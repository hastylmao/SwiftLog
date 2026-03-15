const { onMessagePublished } = require("firebase-functions/v2/pubsub");
const { https } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");

initializeApp();

function getKeyFingerprint(key) {
  if (!key || key.length < 8) return "missing";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function getGeminiErrorInfo(error) {
  const status =
    typeof error?.status === "number"
      ? error.status
      : typeof error?.statusCode === "number"
        ? error.statusCode
        : 502;

  return {
    status: status >= 400 && status < 600 ? status : 502,
    message: error?.message || "Unknown Gemini error",
    details:
      error?.errorDetails ||
      error?.details ||
      error?.response?.data ||
      error?.stack ||
      String(error),
  };
}

exports.geminiProxy = https.onRequest(
  {
    cors: [
      "http://localhost:3000",
      "http://localhost:8081",
      "https://swift-log-gamma.vercel.app",
    ],
    region: "us-central1",
  },
  async (req, res) => {
    try {
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
        console.error("[geminiProxy] Token verification failed:", err?.message || err);
        return res.status(401).json({ error: "Invalid auth token" });
      }

      const userId = decodedToken.uid;
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { type, payload } = body || {};

      if (!type || !payload) {
        return res.status(400).json({ error: "Missing type or payload" });
      }

      const db = getFirestore();
      const now = new Date();
      const dayStr = now.toISOString().split("T")[0];
      const hour = now.getUTCHours().toString().padStart(2, "0");

      const usageRef = db.collection("api_usage").doc(`${userId}_${dayStr}`);
      const usageSnap = await usageRef.get();
      const usage = usageSnap.exists
        ? usageSnap.data()
        : { requests_today: 0, last_hour: "", requests_this_hour: 0 };

      if (usage.last_hour !== hour) {
        usage.requests_this_hour = 0;
        usage.last_hour = hour;
      }

      const maxPerHour = 40;
      const maxPerDay = 150;

      if ((usage.requests_this_hour || 0) >= maxPerHour) {
        return res.status(429).json({ error: `Rate limit: max ${maxPerHour} requests per hour` });
      }

      if ((usage.requests_today || 0) >= maxPerDay) {
        return res.status(429).json({ error: `Daily limit reached (${maxPerDay} requests)` });
      }

      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        console.error("[geminiProxy] GEMINI_API_KEY not configured");
        return res.status(500).json({ error: "Server misconfigured" });
      }

      console.log("[geminiProxy] Processing request", {
        userId,
        type,
        keyFingerprint: getKeyFingerprint(geminiKey),
      });

      const ai = new GoogleGenerativeAI(geminiKey);
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

      let geminiText = "";

      try {
        if (type === "food_text") {
          const prompt = `You are a nutrition analyst. Given a text description of food, estimate the calories, protein (g), carbs (g), and fat (g). Respond ONLY in JSON: {"calories": number, "protein": number, "carbs": number, "fat": number, "food_name": string}.\n\nDescription: ${payload.description}`;
          const result = await model.generateContent({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          });
          geminiText = result.response.text();
        } else if (type === "food_image") {
          const prompt = `You are a nutrition analyst. Given a photo of food and a text description, estimate the calories, protein (g), carbs (g), and fat (g). Respond ONLY in JSON: {"calories": number, "protein": number, "carbs": number, "fat": number, "food_name": string}.\n\nDescription: ${payload.description}`;
          const result = await model.generateContent({
            contents: [{
              parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/jpeg", data: payload.imageBase64 } }
              ]
            }],
            generationConfig: { responseMimeType: "application/json" }
          });
          geminiText = result.response.text();
        } else if (type === "chat") {
          const { message, systemPrompt, history } = payload;
          const chat = model.startChat({
            history: [
              { role: "user", parts: [{ text: systemPrompt }] },
              { role: "model", parts: [{ text: "Got it! I have all your data loaded. How can I help?" }] },
              ...(Array.isArray(history) ? history : []),
            ],
          });
          const result = await chat.sendMessage(message);
          geminiText = result.response.text();
        } else if (type === "barcode") {
          const prompt = `You are estimating nutrition for a packaged food barcode.
Barcode data: ${payload.barcodeData}
Respond ONLY in JSON:
{
  "product_name": string, "brand": string, "serving_size": string, "product_weight_g": number,
  "calories": number, "protein": number, "carbs": number, "fat": number, "sugar": number, "fiber": number,
  "sodium_mg": number, "saturated_fat": number, "trans_fat": number, "cholesterol_mg": number,
  "ingredients_concern": [string], "health_rating": "dangerous"|"bad"|"alright"|"good"|"healthy",
  "health_reasoning": string, "additives": [string], "allergens": [string]
}`;
          const result = await model.generateContent({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          });
          geminiText = result.response.text();
        } else if (type === "nutrition_label") {
          const prompt = `Read this packaged food nutrition label image. Mentally reorient if needed.
Priorities: Extract nutrition facts table, product name, brand, and weight.
Respond ONLY in JSON:
{
  "product_name": string, "brand": string, "serving_size": string, "product_weight_g": number,
  "calories": number, "protein": number, "carbs": number, "fat": number, "sugar": number, "fiber": number,
  "sodium_mg": number, "saturated_fat": number, "trans_fat": number, "cholesterol_mg": number,
  "ingredients_concern": [string], "health_rating": "dangerous"|"bad"|"alright"|"good"|"healthy",
  "health_reasoning": string, "additives": [string], "allergens": [string]
}`;
          const result = await model.generateContent({
            contents: [{
              parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/jpeg", data: payload.imageBase64 } }
              ]
            }],
            generationConfig: { responseMimeType: "application/json" }
          });
          geminiText = result.response.text();
        } else if (type === "front_package") {
          const prompt = `Analyze the front of this packaging. Identify the product name and brand. Estimate full nutritional profile based on known data or similar products.
Respond ONLY in JSON:
{
  "product_name": string, "brand": string, "serving_size": string, "product_weight_g": number,
  "calories": number, "protein": number, "carbs": number, "fat": number, "sugar": number, "fiber": number,
  "sodium_mg": number, "saturated_fat": number, "trans_fat": number, "cholesterol_mg": number,
  "ingredients_concern": [string], "health_rating": "dangerous"|"bad"|"alright"|"good"|"healthy",
  "health_reasoning": string, "additives": [string], "allergens": [string]
}`;
          const result = await model.generateContent({
            contents: [{
              parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/jpeg", data: payload.imageBase64 } }
              ]
            }],
            generationConfig: { responseMimeType: "application/json" }
          });
          geminiText = result.response.text();
        } else {
          return res.status(400).json({ error: "Unsupported request type" });
        }
      } catch (geminiErr) {
        const errorInfo = getGeminiErrorInfo(geminiErr);
        console.error("[geminiProxy] Gemini API error:", {
          userId,
          type,
          info: errorInfo,
        });
        return res.status(errorInfo.status).json({
          error: "AI service error",
          message: errorInfo.message,
          details: errorInfo.details,
        });
      }

      if (!geminiText) {
        return res.status(502).json({ error: "AI returned no content" });
      }

      let responseData = {};
      if (type === "chat") {
        responseData = { text: geminiText };
      } else {
        // IMPROVED EXTRACTION: Find the first { and last }
        const first = geminiText.indexOf("{");
        const last = geminiText.lastIndexOf("}");
        
        if (first === -1 || last === -1 || last <= first) {
          console.error("[geminiProxy] Could not find JSON block in response:", geminiText);
          return res.status(502).json({ error: "AI failed to return JSON", raw: geminiText });
        }

        const jsonStr = geminiText.substring(first, last + 1);
        try {
          responseData = JSON.parse(jsonStr);
        } catch (parseErr) {
          console.error("[geminiProxy] JSON Parse failed:", {
            error: parseErr.message,
            extracted: jsonStr,
            fullResponse: geminiText
          });
          return res.status(502).json({ error: "Invalid JSON from AI", raw: geminiText });
        }
      }

      await usageRef.set(
        {
          requests_today: (usage.requests_today || 0) + 1,
          requests_this_hour: (usage.requests_this_hour || 0) + 1,
          last_hour: hour,
          updated_at: now.toISOString(),
        },
        { merge: true }
      );

      return res.status(200).json(responseData);
    } catch (err) {
      console.error("[geminiProxy] Fatal Error:", err);
      return res.status(500).json({
        error: "Internal server error",
        message: err?.message || String(err),
      });
    }
  }
);

exports.budgetKillSwitch = onMessagePublished(
  { topic: "budget-alerts", region: "us-central1" },
  async (event) => {
    const data = event.data.message.json;
    console.log("Budget alert received:", JSON.stringify(data));
    const alertThresholdExceeded = data.alertThresholdExceeded || 0;
    if (alertThresholdExceeded >= 1.0) {
      const db = getFirestore();
      const settingsSnap = await db.collection("user_settings").get();
      const batch = db.batch();
      let count = 0;
      settingsSnap.forEach((doc) => {
        const docData = doc.data();
        if (docData.gemini_api_key) {
          batch.update(doc.ref, {
            gemini_api_key: "",
            gemini_disabled_reason: "Budget limit reached.",
            gemini_disabled_at: new Date().toISOString(),
          });
          count++;
        }
      });
      if (count > 0) await batch.commit();
    }
  }
);
