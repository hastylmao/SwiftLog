const { onMessagePublished, onCall } = require("firebase-functions/v2/pubsub");
const { https } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");

initializeApp();

/**
 * Shared Gemini API proxy: allows web/mobile clients to use the app's Gemini key
 * when they don't have their own personal key.
 * Requires Firebase authentication & enforces per-user rate limits.
 */
exports.geminiProxy = https.onRequest(
  { cors: true, invoker: "public", region: "us-central1" },
  async (req, res) => {
    try {
      // ── 1. Authenticate user ────────────────────────────────────────────
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const idToken = authHeader.slice(7);
      const auth = getAuth();
      let decodedToken;
      try {
        decodedToken = await auth.verifyIdToken(idToken);
      } catch (err) {
        console.error("Token verification failed:", err.message);
        return res.status(401).json({ error: "Invalid auth token" });
      }

      const userId = decodedToken.uid;

      // ── 2. Rate limiting ────────────────────────────────────────────────
      const db = getFirestore();
      const now = new Date();
      const dayStr = now.toISOString().split("T")[0];
      const hour = now.getUTCHours().toString().padStart(2, "0");

      const usageRef = db.collection("api_usage").doc(`${userId}_${dayStr}`);
      const usageSnap = await usageRef.get();

      let usage = usageSnap.exists ? usageSnap.data() : { requests_today: 0, last_hour: "", requests_this_hour: 0 };
      const isNewHour = usage.last_hour !== hour;

      if (isNewHour) {
        usage.requests_this_hour = 0;
        usage.last_hour = hour;
      }

      // Limits: 20 requests per hour, 80 per day
      const MAX_PER_HOUR = 20;
      const MAX_PER_DAY = 80;

      if (usage.requests_this_hour >= MAX_PER_HOUR) {
        return res.status(429).json({ error: `Rate limit: max ${MAX_PER_HOUR} requests per hour` });
      }
      if (usage.requests_today >= MAX_PER_DAY) {
        return res.status(429).json({ error: `Daily limit reached (${MAX_PER_DAY} requests)` });
      }

      // ── 3. Parse request ───────────────────────────────────────────────
      const { type, payload } = req.body;

      if (!type || !payload) {
        return res.status(400).json({ error: "Missing type or payload" });
      }

      // ── 4. Call Gemini with shared key ─────────────────────────────────
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        console.error("GEMINI_API_KEY not configured");
        return res.status(500).json({ error: "Server misconfigured" });
      }

      const ai = new GoogleGenerativeAI(geminiKey);
      const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

      let geminiText = "";

      if (type === "food_text") {
        const prompt = `You are a nutrition analyst. Given a text description of food, estimate the calories, protein (g), carbs (g), and fat (g). Be as accurate as possible. Consider typical Indian serving sizes if the food is Indian. Respond ONLY in JSON format: {"calories": number, "protein": number, "carbs": number, "fat": number, "food_name": string}.\n\nDescription: ${payload.description}`;
        const result = await model.generateContent(prompt);
        geminiText = result.response.text();
      } else if (type === "food_image") {
        const prompt = `You are a nutrition analyst. Given a photo of food and a text description, estimate the calories, protein (g), carbs (g), and fat (g). Be as accurate as possible. Respond ONLY in JSON format: {"calories": number, "protein": number, "carbs": number, "fat": number, "food_name": string}.\n\nDescription: ${payload.description}`;
        const result = await model.generateContent([
          prompt,
          { inlineData: { mimeType: "image/jpeg", data: payload.imageBase64 } },
        ]);
        geminiText = result.response.text();
      } else if (type === "generate_content_raw") {
        const reqPayload = payload.imageBase64 ? [
          payload.prompt,
          { inlineData: { mimeType: "image/jpeg", data: payload.imageBase64 } }
        ] : payload.prompt;
        const result = await model.generateContent(reqPayload);

        await usageRef.update({
          requests_today: (usage.requests_today || 0) + 1,
          requests_this_hour: (usage.requests_this_hour || 0) + 1,
          last_hour: hour,
        });
        return res.status(200).json({ text: result.response.text() });
      } else if (type === "chat_raw") {
        const chat = model.startChat({ history: payload.history });
        const result = await chat.sendMessage(payload.message);

        await usageRef.update({
          requests_today: (usage.requests_today || 0) + 1,
          requests_this_hour: (usage.requests_this_hour || 0) + 1,
          last_hour: hour,
        });
        return res.status(200).json({ text: result.response.text() });
      } else {
        return res.status(400).json({ error: "Unsupported request type" });
      }

      // Parse JSON from response (Legacy endpoints below)
      const match = geminiText.match(/\{[\s\S]*\}/);
      if (!match) {
        return res.status(502).json({ error: "Invalid AI response" });
      }

      const parsed = JSON.parse(match[0]);

      // ── 5. Increment usage counters ────────────────────────────────────
      await usageRef.update({
        requests_today: (usage.requests_today || 0) + 1,
        requests_this_hour: (usage.requests_this_hour || 0) + 1,
        last_hour: hour,
      });

      // ── 6. Return result ───────────────────────────────────────────────
      return res.status(200).json(parsed);
    } catch (err) {
      console.error("[geminiProxy] Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * Budget kill switch: triggered by Cloud Billing budget alert via Pub/Sub.
 * When cost >= 100% of the 20,000 INR budget, clears the Gemini API key
 * from all users' settings in Firestore, effectively stopping all AI usage.
 */
exports.budgetKillSwitch = onMessagePublished(
  { topic: "budget-alerts", region: "us-central1" },
  async (event) => {
    const data = event.data.message.json;

    console.log("Budget alert received:", JSON.stringify(data));

    const costAmount = data.costAmount || 0;
    const budgetAmount = data.budgetAmount || 0;
    const alertThresholdExceeded = data.alertThresholdExceeded || 0;

    console.log(
      `Cost: ${costAmount}, Budget: ${budgetAmount}, Threshold: ${alertThresholdExceeded}`
    );

    // Only kill when actual spend >= 100% of budget
    if (alertThresholdExceeded >= 1.0) {
      console.log("BUDGET EXCEEDED! Disabling Gemini API keys...");

      const db = getFirestore();
      const settingsSnap = await db.collection("user_settings").get();

      const batch = db.batch();
      let count = 0;

      settingsSnap.forEach((doc) => {
        const docData = doc.data();
        if (docData.gemini_api_key) {
          batch.update(doc.ref, {
            gemini_api_key: "",
            gemini_disabled_reason: "Budget limit of 20000 INR reached. Re-add your key in Settings after reviewing usage.",
            gemini_disabled_at: new Date().toISOString(),
          });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        console.log(`Disabled Gemini keys for ${count} user(s).`);
      } else {
        console.log("No active Gemini keys found.");
      }
    } else {
      console.log(
        `Alert at ${(alertThresholdExceeded * 100).toFixed(0)}% — no action needed yet.`
      );
    }
  }
);
