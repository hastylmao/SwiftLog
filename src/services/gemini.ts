import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  GeminiNutritionResponse, GeminiWorkoutResponse,
  User, UserSettings, FoodLog, WaterLog, WorkoutLog,
  WeightLog, Split, SplitDay, UserAchievement,
  SupplementLog, StepsLog, CardioLog, SleepLog,
  GroceryList, GroceryCategory, MacroMatch, AutoRegulation, VoiceLogResult,
} from '../types';
import { checkRateLimit, incrementRateLimit, getRateLimitError } from './rateLimit';

const PERSONAL_MODEL = 'gemini-1.5-flash-latest';
const FUNCTIONS_URL = 'https://geminiproxy-gvrxpzalkq-uc.a.run.app';
const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v2/product';
const OPEN_FOOD_FACTS_TIMEOUT_MS = 2500;
const OPEN_FOOD_FACTS_FIELDS = [
  'product_name',
  'product_name_en',
  'brands',
  'serving_size',
  'quantity',
  'product_quantity',
  'nutriments',
  'ingredients_text',
  'ingredients_text_en',
  'nova_group',
  'additives_tags',
  'allergens_tags',
].join(',');

export interface ProductAnalysis {
  product_name: string;
  brand: string;
  source?: 'database' | 'ai_estimate' | 'nutrition_label' | 'front_package';
  serving_size: string;
  product_weight_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  sodium_mg: number;
  saturated_fat: number;
  trans_fat: number;
  cholesterol_mg: number;
  ingredients_concern: string[];
  health_rating: 'dangerous' | 'bad' | 'alright' | 'good' | 'healthy';
  health_reasoning: string;
  additives: string[];
  allergens: string[];
}

const BARCODE_RESULT_CACHE = new Map<string, ProductAnalysis>();

// ── Rate limit guard ───────────────────────────────────────────────────
async function enforceRateLimit(feature: string): Promise<void> {
  const { allowed } = await checkRateLimit(feature);
  if (!allowed) throw new Error(getRateLimitError(feature));
  await incrementRateLimit(feature);
}

const NUTRITION_LABEL_PROMPT = `You are a nutrition log assistant. Read the provided nutrition facts table image. 
Extract the following details as accurately as possible. Mentally reorient the image if it is sideways or upside down.
Prioritize: Product Name, Brand, Serving Size, Calories, Protein, Carbs, Fat, Sugar, Fiber, Sodium (mg), Saturated Fat, Trans Fat, and Cholesterol (mg).
If a value is not found, use a reasonable estimate for that specific product type.
Respond ONLY in JSON format following this structure:
{
  "product_name": string, "brand": string, "serving_size": string, "product_weight_g": number,
  "calories": number, "protein": number, "carbs": number, "fat": number, "sugar": number, "fiber": number,
  "sodium_mg": number, "saturated_fat": number, "trans_fat": number, "cholesterol_mg": number,
  "ingredients_concern": [string], "health_rating": "dangerous"|"bad"|"alright"|"good"|"healthy",
  "health_reasoning": string, "additives": [string], "allergens": [string]
}`;

const FRONT_PACKAGE_PROMPT = `You are a nutrition analyst. Look at the front of this food packaging.
Identify the exact product and brand. Based on your knowledge database of nutritional information for this specific product (or very similar ones), provide a full nutritional profile.
Respond ONLY in JSON format following this structure:
{
  "product_name": string, "brand": string, "serving_size": string, "product_weight_g": number,
  "calories": number, "protein": number, "carbs": number, "fat": number, "sugar": number, "fiber": number,
  "sodium_mg": number, "saturated_fat": number, "trans_fat": number, "cholesterol_mg": number,
  "ingredients_concern": [string], "health_rating": "dangerous"|"bad"|"alright"|"good"|"healthy",
  "health_reasoning": string, "additives": [string], "allergens": [string]
}`;

const FOOD_IMAGE_PROMPT = (description: string) =>
  `You are a nutrition analyst. Given a photo of food and a text description, estimate the calories, protein (g), carbs (g), and fat (g). Respond ONLY in JSON: {"calories": number, "protein": number, "carbs": number, "fat": number, "food_name": string}.\n\nDescription: ${description}`;

const FOOD_TEXT_PROMPT = (description: string) =>
  `You are a nutrition analyst. Given a text description of food, estimate the calories, protein (g), carbs (g), and fat (g). Respond ONLY in JSON: {"calories": number, "protein": number, "carbs": number, "fat": number, "food_name": string}.\n\nDescription: ${description}`;

const WORKOUT_PROMPT = (description: string) =>
  `You are a workout log parser. Given a natural language description of a workout, extract structured data. Respond ONLY in JSON: {"exercises": [{"name": string, "sets": [{"weight_kg": number, "reps": number}]}]}.\n\nDescription: ${description}`;

// ──────────────────────────────────────────────────────────────────────────
// Parse a JSON snippet out of a Gemini text response (Hyper-Resilient)
// ──────────────────────────────────────────────────────────────────────────
function parseJsonFromText<T>(text: string): T {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('AI returned an empty response.');
  try { return JSON.parse(trimmed) as T; } catch (e) {}
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try { return JSON.parse(candidate) as T; } catch (e) {}
  }
  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = trimmed.substring(firstBracket, lastBracket + 1);
    try { return JSON.parse(candidate) as T; } catch (e) {}
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) { try { return JSON.parse(fenced[1]) as T; } catch (e) {} }
  console.error('[GeminiService] JSON parse failed for raw text:', trimmed);
  const preview = trimmed.length > 300 ? trimmed.substring(0, 300) + '...' : trimmed;
  throw new Error(`AI response format error. Could not extract valid JSON from:\n\n${preview}`);
}

export function safeNum(val: any, fallback = 0): number {
  const n = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(n) ? n : fallback;
}

async function callGeminiProxy<T>(
  type: 'food_text' | 'food_image' | 'workout' | 'barcode' | 'nutrition_label' | 'front_package' | 'chat' | 'advice' | 'auto_regulation' | 'grocery_list' | 'match_macros' | 'voice_log' | 'roast',
  payload: any,
  authToken: string
): Promise<T> {
  const response = await fetch(FUNCTIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ type, payload }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = `Firebase function error: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      message = errorJson.error || errorJson.message || message;
    } catch (e) { message = errorText || message; }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timeout); }
}

function normalizeBarcodeValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const compactNumeric = trimmed.replace(/[\s-]/g, '');
  if (/^\d{8,14}$/.test(compactNumeric)) return compactNumeric;
  const digitRuns = trimmed.match(/\d{8,14}/g);
  if (digitRuns?.length) return [...digitRuns].sort((a, b) => b.length - a.length)[0];
  return trimmed;
}

function looksLikeRetailBarcode(value: string): boolean { return /^\d{8,14}$/.test(value); }

export async function analyzeFood(imageBase64: string, description: string, userApiKey: string, authToken?: string): Promise<GeminiNutritionResponse> {
  await enforceRateLimit('analyze_food');
  if (userApiKey) {
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL, generationConfig: { responseMimeType: 'application/json' } });
    const result = await model.generateContent([FOOD_IMAGE_PROMPT(description), { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }]);
    const parsed = parseJsonFromText<GeminiNutritionResponse>(result.response.text());
    return { ...parsed, calories: safeNum(parsed.calories), protein: safeNum(parsed.protein), carbs: safeNum(parsed.carbs), fat: safeNum(parsed.fat) };
  } else if (authToken) {
    const parsed = await callGeminiProxy<GeminiNutritionResponse>('food_image', { imageBase64, description }, authToken);
    return { ...parsed, calories: safeNum(parsed.calories), protein: safeNum(parsed.protein), carbs: safeNum(parsed.carbs), fat: safeNum(parsed.fat) };
  } else { throw new Error('API key required.'); }
}

export async function analyzeFoodTextOnly(description: string, userApiKey: string, authToken?: string): Promise<GeminiNutritionResponse> {
  await enforceRateLimit('analyze_food');
  if (userApiKey) {
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL, generationConfig: { responseMimeType: 'application/json' } });
    const result = await model.generateContent(FOOD_TEXT_PROMPT(description));
    const parsed = parseJsonFromText<GeminiNutritionResponse>(result.response.text());
    return { ...parsed, calories: safeNum(parsed.calories), protein: safeNum(parsed.protein), carbs: safeNum(parsed.carbs), fat: safeNum(parsed.fat) };
  } else if (authToken) {
    const parsed = await callGeminiProxy<GeminiNutritionResponse>('food_text', { description }, authToken);
    return { ...parsed, calories: safeNum(parsed.calories), protein: safeNum(parsed.protein), carbs: safeNum(parsed.carbs), fat: safeNum(parsed.fat) };
  } else { throw new Error('API key required.'); }
}

export async function parseWorkout(description: string, userApiKey: string, authToken?: string): Promise<GeminiWorkoutResponse> {
  await enforceRateLimit('parse_workout');
  let parsed: GeminiWorkoutResponse;
  if (userApiKey) {
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL, generationConfig: { responseMimeType: 'application/json' } });
    const result = await model.generateContent(WORKOUT_PROMPT(description));
    parsed = parseJsonFromText<GeminiWorkoutResponse>(result.response.text());
  } else if (authToken) {
    parsed = await callGeminiProxy<GeminiWorkoutResponse>('workout', { description }, authToken);
  } else { throw new Error('API key required.'); }

  if (parsed.exercises) {
    parsed.exercises = parsed.exercises.map(ex => ({
      ...ex,
      sets: (ex.sets || []).map(s => ({ weight_kg: safeNum(s.weight_kg), reps: safeNum(s.reps) })),
    }));
  }
  return parsed;
}

export interface ChatHistoryItem { role: 'user' | 'model'; parts: { text: string }[]; }
export interface ChatContext { 
  user: User | null; settings: UserSettings | null; 
  todayFoodLogs: FoodLog[]; todayWaterLogs: WaterLog[]; 
  todayWorkoutLogs: WorkoutLog[]; weightLogs: WeightLog[]; 
  activeSplit: Split | null; splitDays: SplitDay[]; 
  achievements: UserAchievement[]; todaySupplementLogs: SupplementLog[]; 
  todayStepsLogs: StepsLog[]; todayCardioLogs: CardioLog[]; todaySleepLogs: SleepLog[]; 
}

export function buildAgenticPrompt(ctx: ChatContext): string {
  const { user, settings, todayFoodLogs, todayWaterLogs, todayWorkoutLogs, weightLogs, activeSplit, splitDays } = ctx;
  const sections: string[] = [];
  sections.push(`You are "Swift Logger AI", an elite personal fitness coach.`);
  if (user) {
    sections.push(`\nUSER PROFILE: ${user.username}, Age: ${user.age}, Height: ${user.height_cm}cm, Weight: ${user.current_weight_kg}kg.`);
  }
  if (settings) {
    sections.push(`TARGETS: ${settings.target_calories}kcal, P:${settings.target_protein}g, C:${settings.target_carbs}g, F:${settings.target_fat}g.`);
  }
  const totalCals = todayFoodLogs.reduce((s, f) => s + f.calories, 0);
  sections.push(`\nSUMMARY: ${totalCals}kcal logged today across ${todayFoodLogs.length} items. Water: ${todayWaterLogs.reduce((s, w) => s + w.amount_ml, 0)}ml.`);
  if (todayWorkoutLogs.length > 0) {
    sections.push(`WORKOUTS: ${todayWorkoutLogs.map(w => w.title || 'Workout').join(', ')}.`);
  }
  return sections.join('\n');
}

export async function getDailyAdvice(context: ChatContext, userApiKey: string, authToken?: string): Promise<string> {
  await enforceRateLimit('daily_advice');
  if (userApiKey) {
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL });
    const result = await model.generateContent(buildAgenticPrompt(context) + "\nGive 1 short piece of advice.");
    return result.response.text().trim();
  } else if (authToken) {
    const systemPrompt = buildAgenticPrompt(context);
    const res = await callGeminiProxy<{ text: string }>('advice', { systemPrompt }, authToken);
    return res.text || 'No advice available right now.';
  }
  throw new Error('API key required.');
}

export async function chatWithAI(message: string, history: ChatHistoryItem[], context: ChatContext, userApiKey: string, authToken?: string): Promise<string> {
  if (!userApiKey && !authToken) throw new Error('API key required.');
  await enforceRateLimit('chat');
  const systemPrompt = buildAgenticPrompt(context);
  if (userApiKey) {
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL });
    const chat = model.startChat({ history: [{ role: 'user', parts: [{ text: systemPrompt }] }, { role: 'model', parts: [{ text: "Ready." }] }, ...history] });
    const result = await chat.sendMessage(message);
    return result.response.text();
  } else if (authToken) {
    const res = await callGeminiProxy<{ text: string }>('chat', { message, systemPrompt, history }, authToken);
    return (res as any).text || 'Error generating response';
  }
  throw new Error('Key missing');
}

export function initGemini(_k: string) { }
export function getEffectiveApiKey(_k?: string | null) { return { key: '', model: PERSONAL_MODEL }; }

export async function checkAutoRegulation(context: ChatContext, userApiKey: string, authToken?: string): Promise<AutoRegulation | null> {
  try {
    if (!userApiKey && !authToken) return null;
    await enforceRateLimit('auto_regulation');
    if (userApiKey) {
      const ai = new GoogleGenerativeAI(userApiKey);
      const model = ai.getGenerativeModel({ model: PERSONAL_MODEL, generationConfig: { responseMimeType: 'application/json' } });
      const result = await model.generateContent(buildAgenticPrompt(context) + "\nAnalyze data for auto-regulation. JSON ONLY: {\"message\": string, \"type\": string, \"suggestion\": string}");
      return parseJsonFromText<AutoRegulation>(result.response.text());
    } else if (authToken) {
      const systemPrompt = buildAgenticPrompt(context);
      return await callGeminiProxy<AutoRegulation>('auto_regulation', { systemPrompt }, authToken);
    }
    return null;
  } catch { return null; }
}

export async function generateGroceryList(context: ChatContext, userApiKey: string, authToken?: string): Promise<GroceryList> {
  await enforceRateLimit('grocery_list');
  const systemPrompt = buildAgenticPrompt(context);
  if (userApiKey) {
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL, generationConfig: { responseMimeType: 'application/json' } });
    const result = await model.generateContent(systemPrompt + "\nGenerate grocery list. JSON ONLY: {\"categories\": [{\"category\": string, \"items\": string[]}]}");
    const parsed = parseJsonFromText<{ categories: GroceryCategory[] }>(result.response.text());
    return { categories: parsed.categories || [], generatedAt: new Date().toISOString() };
  } else if (authToken) {
    const parsed = await callGeminiProxy<{ categories: GroceryCategory[] }>('grocery_list', { systemPrompt }, authToken);
    return { categories: parsed.categories || [], generatedAt: new Date().toISOString() };
  }
  throw new Error('API key required.');
}

export async function matchMacros(remaining: { protein: number; carbs: number; fat: number; calories: number }, preferences: string, userApiKey: string, authToken?: string): Promise<MacroMatch[]> {
  await enforceRateLimit('match_macros');
  if (userApiKey) {
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL, generationConfig: { responseMimeType: 'application/json' } });
    const result = await model.generateContent(`Suggest foods for macros: P:${remaining.protein}g. JSON ONLY: {\"matches\": [{\"food_name\": string, \"calories\": number, \"protein\": number, \"carbs\": number, \"fat\": number, \"serving_size\": string}]}`);
    const parsed = parseJsonFromText<{ matches: MacroMatch[] }>(result.response.text());
    return parsed.matches || [];
  } else if (authToken) {
    const res = await callGeminiProxy<{ matches: MacroMatch[] }>('match_macros', { remaining, preferences }, authToken);
    return res.matches || [];
  }
  throw new Error('API key required.');
}

export async function parseVoiceLog(transcript: string, userApiKey: string, authToken?: string): Promise<VoiceLogResult> {
  await enforceRateLimit('voice_log');
  if (userApiKey) {
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL, generationConfig: { responseMimeType: 'application/json' } });
    const result = await model.generateContent(`Parse transcript: ${transcript}. JSON ONLY.`);
    const parsed = parseJsonFromText<VoiceLogResult>(result.response.text());
    return { ...parsed, raw_transcript: transcript };
  } else if (authToken) {
    const parsed = await callGeminiProxy<VoiceLogResult>('voice_log', { transcript }, authToken);
    return { ...parsed, raw_transcript: transcript };
  }
  throw new Error('API key required.');
}

export async function generateRoast(context: ChatContext, streakType: string, streakDays: number, userApiKey: string, authToken?: string): Promise<string> {
  await enforceRateLimit('roast');
  if (userApiKey) {
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL });
    const result = await model.generateContent(`Roast user for breaking ${streakDays} day ${streakType} streak (max 2 sentences).`);
    return result.response.text().trim();
  } else if (authToken) {
    const res = await callGeminiProxy<{ text: string }>('roast', { streakType, streakDays }, authToken);
    return res.text || 'Ouch, that streak break hurts!';
  }
  throw new Error('API key required.');
}

// ── Product Analysis ──────────────────────────────────────────────────

function normalizeProductAnalysis(parsed: ProductAnalysis, source: ProductAnalysis['source']): ProductAnalysis {
  parsed.calories = safeNum(parsed.calories);
  parsed.protein = safeNum(parsed.protein);
  parsed.carbs = safeNum(parsed.carbs);
  parsed.fat = safeNum(parsed.fat);
  parsed.sugar = safeNum(parsed.sugar);
  parsed.fiber = safeNum(parsed.fiber);
  parsed.saturated_fat = safeNum(parsed.saturated_fat);
  parsed.trans_fat = safeNum(parsed.trans_fat);
  parsed.sodium_mg = safeNum(parsed.sodium_mg);
  parsed.cholesterol_mg = safeNum(parsed.cholesterol_mg);
  parsed.product_weight_g = safeNum(parsed.product_weight_g);
  parsed.ingredients_concern = Array.isArray(parsed.ingredients_concern) ? parsed.ingredients_concern : [];
  parsed.additives = Array.isArray(parsed.additives) ? parsed.additives : [];
  parsed.allergens = Array.isArray(parsed.allergens) ? parsed.allergens : [];
  parsed.source = source;
  parsed.product_name = (parsed.product_name || 'Unknown Product').trim();
  parsed.brand = (parsed.brand || 'Unknown').trim();
  parsed.serving_size = (parsed.serving_size || 'per serving').trim();
  parsed.health_reasoning = (parsed.health_reasoning || 'Estimated from package.').trim();
  return parsed;
}

export async function analyzeNutritionLabelImage(imageBase64: string, userApiKey: string, authToken?: string, onStageChange?: (message: string) => void): Promise<ProductAnalysis> {
  onStageChange?.('Reading nutrition label...');
  const prompt = NUTRITION_LABEL_PROMPT;
  await enforceRateLimit('analyze_barcode');
  let parsed: ProductAnalysis;
  if (userApiKey) {
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL, generationConfig: { temperature: 0, responseMimeType: 'application/json' } });
    const result = await model.generateContent([prompt, { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }]);
    parsed = parseJsonFromText<ProductAnalysis>(result.response.text());
  } else if (authToken) {
    parsed = await callGeminiProxy<ProductAnalysis>('nutrition_label', { imageBase64 }, authToken);
  } else { throw new Error('Key missing'); }
  return normalizeProductAnalysis(parsed, 'nutrition_label');
}

export async function analyzeFrontPackageImage(imageBase64: string, userApiKey: string, authToken?: string, onStageChange?: (message: string) => void): Promise<ProductAnalysis> {
  onStageChange?.('Identifying product...');
  const prompt = FRONT_PACKAGE_PROMPT;
  await enforceRateLimit('analyze_barcode');
  let parsed: ProductAnalysis;
  if (userApiKey) {
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL, generationConfig: { temperature: 0, responseMimeType: 'application/json' } });
    const result = await model.generateContent([prompt, { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }]);
    parsed = parseJsonFromText<ProductAnalysis>(result.response.text());
  } else if (authToken) {
    parsed = await callGeminiProxy<ProductAnalysis>('front_package', { imageBase64 }, authToken);
  } else { throw new Error('Key missing'); }
  return normalizeProductAnalysis(parsed, 'front_package');
}

export async function analyzeProductBarcode(barcodeData: string, barcodeType: string, userApiKey: string, authToken?: string, onStageChange?: (message: string) => void): Promise<ProductAnalysis> {
  const normalizedBarcode = normalizeBarcodeValue(barcodeData);
  const cacheKey = `${barcodeType}:${normalizedBarcode || barcodeData}`;
  const cached = BARCODE_RESULT_CACHE.get(cacheKey);
  if (cached) return cached;
  onStageChange?.('Checking product database...');
  try {
    const offRes = await fetchWithTimeout(`${OPEN_FOOD_FACTS_URL}/${encodeURIComponent(normalizedBarcode)}.json?fields=${encodeURIComponent(OPEN_FOOD_FACTS_FIELDS)}`, { headers: { 'User-Agent': 'SwiftLogger/1.0' } }, 3000);
    if (offRes.ok) {
      const offData = await offRes.json();
      if (offData.status === 1 && offData.product) {
        const p = offData.product;
        const res: ProductAnalysis = normalizeProductAnalysis({
          product_name: p.product_name || 'Unknown', brand: p.brands || 'Unknown',
          serving_size: p.serving_size || 'per 100g', product_weight_g: safeNum(p.product_quantity),
          calories: safeNum(p.nutriments?.['energy-kcal_100g']),
          protein: safeNum(p.nutriments?.proteins_100g),
          carbs: safeNum(p.nutriments?.carbohydrates_100g),
          fat: safeNum(p.nutriments?.fat_100g),
          sugar: safeNum(p.nutriments?.sugars_100g),
          fiber: safeNum(p.nutriments?.fiber_100g),
          sodium_mg: safeNum(p.nutriments?.sodium_100g) * 1000,
          saturated_fat: safeNum(p.nutriments?.['saturated-fat_100g']),
          trans_fat: safeNum(p.nutriments?.['trans-fat_100g']),
          cholesterol_mg: 0, ingredients_concern: [],
          health_rating: 'alright', health_reasoning: 'Verified barcode match.',
          additives: [], allergens: []
        }, 'database');
        BARCODE_RESULT_CACHE.set(cacheKey, res);
        return res;
      }
    }
  } catch {}
  onStageChange?.('Building AI estimate...');
  let parsed: ProductAnalysis;
  if (userApiKey) {
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL, generationConfig: { responseMimeType: 'application/json' } });
    const result = await model.generateContent(`Estimate nutrition for barcode ${normalizedBarcode}. JSON ONLY.`);
    parsed = parseJsonFromText<ProductAnalysis>(result.response.text());
  } else if (authToken) {
    parsed = await callGeminiProxy<ProductAnalysis>('barcode', { barcodeData: normalizedBarcode, barcodeType }, authToken);
  } else { throw new Error('Key missing'); }
  parsed = normalizeProductAnalysis(parsed, 'ai_estimate');
  BARCODE_RESULT_CACHE.set(cacheKey, parsed);
  return parsed;
}
