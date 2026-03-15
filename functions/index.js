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

      const maxPerHour = 20;
      const maxPerDay = 80;

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

      console.log("[geminiProxy] Request", {
        userId,
        type,
        keyFingerprint: getKeyFingerprint(geminiKey),
      });

      const ai = new GoogleGenerativeAI(geminiKey);
      const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

      let geminiText = "";

      try {
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
          const prompt = `You are estimating nutrition for a packaged food barcode that was NOT found in the verified product database.

Barcode type: ${payload.barcodeType}
Barcode data: ${payload.barcodeData}

Rules:
1. Never pretend you know the exact product unless you are highly confident from the barcode pattern alone.
2. If confidence is not high, set:
   - "product_name" to "Unverified Product Estimate"
   - "brand" to "Unknown"
3. Always mention in "health_reasoning" that this is an AI estimate and not a verified barcode match.
4. Be conservative. It is better to return a generic estimate than invent a precise wrong brand or flavor.
5. Keep the same barcode response stable and deterministic.

Respond ONLY in JSON:
{
  "product_name": string,
  "brand": string,
  "serving_size": string,
  "product_weight_g": number,
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "sugar": number,
  "fiber": number,
  "sodium_mg": number,
  "saturated_fat": number,
  "trans_fat": number,
  "cholesterol_mg": number,
  "ingredients_concern": [string],
  "health_rating": "dangerous"|"bad"|"alright"|"good"|"healthy",
  "health_reasoning": string,
  "additives": [string],
  "allergens": [string]
}`;
          const barcodeModel = ai.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { temperature: 0, topP: 0.1, topK: 1 },
          });
          const result = await barcodeModel.generateContent(prompt);
          geminiText = result.response.text();
        } else if (type === "nutrition_label") {
          const prompt = `Read this packaged food nutrition label image.

The image may be mirrored, upside down, sideways, or rotated. Mentally reorient it first before extracting anything.

  Priorities:
  - Read the nutrition facts table first.
  - Extract product name, brand, serving basis, and pack weight if visible.
  - If some text is unreadable, make a conservative estimate and mention that in health_reasoning.
- If product name or brand is not visible, use "Unknown".
- If total pack weight is not visible, set "product_weight_g" to 0.
- Mention that this came from a nutrition-label photo.

Respond ONLY in compact JSON:
{
  "product_name": string,
  "brand": string,
  "serving_size": string,
  "product_weight_g": number,
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "sugar": number,
  "fiber": number,
  "sodium_mg": number,
  "saturated_fat": number,
  "trans_fat": number,
  "cholesterol_mg": number,
  "ingredients_concern": [string],
  "health_rating": "dangerous"|"bad"|"alright"|"good"|"healthy",
  "health_reasoning": string,
  "additives": [string],
  "allergens": [string]
}`;
          const labelModel = ai.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
              temperature: 0,
              topP: 0.1,
              topK: 1,
              maxOutputTokens: 900,
            },
          });
          const result = await labelModel.generateContent([
            prompt,
            { inlineData: { mimeType: "image/jpeg", data: payload.imageBase64 } },
          ]);
          geminiText = result.response.text();
        } else if (type === "front_package") {
          const prompt = `Look at the front of this packaged food item. Identify the product name and brand.
Using your training data, securely estimate the full nutritional profile for this exact product (calories, protein, carbs, fat, sugar, fiber, sodium_mg, saturated_fat, trans_fat, cholesterol_mg). Provide ingredients_concern, health_rating, health_reasoning, additives, and allergens based on known data about this product or similar ones.
If the pack weight is visible, extract it, otherwise estimate a typical serving size.
Set "source" to "front_package".

Respond ONLY in compact JSON:
{
  "product_name": string,
  "brand": string,
  "serving_size": string,
  "product_weight_g": number,
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "sugar": number,
  "fiber": number,
  "sodium_mg": number,
  "saturated_fat": number,
  "trans_fat": number,
  "cholesterol_mg": number,
  "ingredients_concern": [string],
  "health_rating": "dangerous"|"bad"|"alright"|"good"|"healthy",
  "health_reasoning": string,
  "additives": [string],
  "allergens": [string]
}`;
          const frontModel = ai.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
              temperature: 0,
              topP: 0.1,
              topK: 1,
              maxOutputTokens: 900,
            },
          });
          const result = await frontModel.generateContent([
            prompt,
            { inlineData: { mimeType: "image/jpeg", data: payload.imageBase64 } },
          ]);
          geminiText = result.response.text();
        } else {
          return res.status(400).json({ error: "Unsupported request type" });
        }
      } catch (geminiErr) {
        const errorInfo = getGeminiErrorInfo(geminiErr);
        console.error("[geminiProxy] Gemini API error:", {
          userId,
          type,
          status: errorInfo.status,
          message: errorInfo.message,
          details: errorInfo.details,
        });
        return res.status(errorInfo.status).json({
          error: "AI service error",
          message: errorInfo.message,
          details: errorInfo.details,
        });
      }

      let responseData = {};
      if (type === "chat") {
        responseData = { text: geminiText };
      } else {
        const match = geminiText.match(/\{[\s\S]*\}/);
        if (!match) {
          console.error("[geminiProxy] Invalid non-JSON Gemini response:", {
            userId,
            type,
            rawText: geminiText,
          });
          return res.status(502).json({ error: "Invalid AI response", details: geminiText });
        }

        try {
          responseData = JSON.parse(match[0]);
        } catch (parseErr) {
          console.error("[geminiProxy] Failed to parse Gemini JSON:", {
            userId,
            type,
            rawText: geminiText,
            error: parseErr?.message || parseErr,
          });
          return res.status(502).json({ error: "Invalid AI response", details: geminiText });
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
      console.error("[geminiProxy] Error:", err);
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

    const costAmount = data.costAmount || 0;
    const alertThresholdExceeded = data.alertThresholdExceeded || 0;

    console.log(
      `Cost: ${costAmount}, Budget: ${data.budgetAmount || 0}, Threshold: ${alertThresholdExceeded}`
    );

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
      console.log(`Alert at ${(alertThresholdExceeded * 100).toFixed(0)}% - no action needed yet.`);
    }
  }
);
