import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  GeminiNutritionResponse, GeminiWorkoutResponse,
  User, UserSettings, FoodLog, WaterLog, WorkoutLog,
  WeightLog, Split, SplitDay, UserAchievement,
  SupplementLog, StepsLog, CardioLog, SleepLog,
  GroceryList, GroceryCategory, MacroMatch, AutoRegulation, VoiceLogResult,
} from '../types';
import { checkRateLimit, incrementRateLimit, getRateLimitError } from './rateLimit';

const PERSONAL_MODEL = 'gemini-2.5-flash';
const FUNCTIONS_URL = 'https://geminiproxy-gvrxpzalkq-uc.a.run.app';
const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v2/product';
const OPEN_FOOD_FACTS_TIMEOUT_MS = 6000;

// ── Rate limit guard ───────────────────────────────────────────────────
async function enforceRateLimit(feature: string): Promise<void> {
  const { allowed } = await checkRateLimit(feature);
  if (!allowed) throw new Error(getRateLimitError(feature));
  await incrementRateLimit(feature);
}

// ── Prompt builders ────────────────────────────────────────────────────────
const FOOD_IMAGE_PROMPT = (description: string) =>
  `You are a nutrition analyst. Given a photo of food and a text description, estimate the calories, protein (g), carbs (g), and fat (g). Be as accurate as possible. Respond ONLY in JSON format: {"calories": number, "protein": number, "carbs": number, "fat": number, "food_name": string}.\n\nDescription: ${description}`;

const FOOD_TEXT_PROMPT = (description: string) =>
  `You are a nutrition analyst. Given a text description of food, estimate the calories, protein (g), carbs (g), and fat (g). Be as accurate as possible. Consider typical Indian serving sizes if the food is Indian. Respond ONLY in JSON format: {"calories": number, "protein": number, "carbs": number, "fat": number, "food_name": string}.\n\nDescription: ${description}`;

const WORKOUT_PROMPT = (description: string) =>
  `You are a workout log parser. Given a natural language description of a workout, extract structured data. Respond ONLY in JSON format: {"exercises": [{"name": string, "sets": [{"weight_kg": number, "reps": number}]}]}.\n\nDescription: ${description}`;

// ──────────────────────────────────────────────────────────────────────────
// Parse a JSON snippet out of a Gemini text response
// ──────────────────────────────────────────────────────────────────────────
function parseJsonFromText<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse AI response as JSON');
  return JSON.parse(match[0]) as T;
}

/** Safely convert any value to a finite number, returning fallback for NaN/Infinity/null/undefined/strings */
export function safeNum(val: any, fallback = 0): number {
  const n = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(n) ? n : fallback;
}

// ──────────────────────────────────────────────────────────────────────────
// Call Gemini proxy on Firebase Cloud Functions (shared key)
// ──────────────────────────────────────────────────────────────────────────
async function callGeminiProxy<T>(
  type: 'food_text' | 'food_image' | 'workout' | 'barcode' | 'chat',
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
    const error = await response.text();
    throw new Error(error || `Firebase function error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// PUBLIC: analyzeFood (image + description)
// ──────────────────────────────────────────────────────────────────────────
export async function analyzeFood(
  imageBase64: string,
  description: string,
  userApiKey: string,
  authToken?: string
): Promise<GeminiNutritionResponse> {
  await enforceRateLimit('analyze_food');

  if (userApiKey) {
    // Use personal key
    const prompt = FOOD_IMAGE_PROMPT(description);
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL });
    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
    ]);
    const parsed = parseJsonFromText<GeminiNutritionResponse>(result.response.text());
    return { ...parsed, calories: safeNum(parsed.calories), protein: safeNum(parsed.protein), carbs: safeNum(parsed.carbs), fat: safeNum(parsed.fat) };
  } else if (authToken) {
    // Use shared key via proxy
    const parsed = await callGeminiProxy<GeminiNutritionResponse>('food_image', { imageBase64, description }, authToken);
    return {
      ...parsed,
      calories: safeNum((parsed as any).calories),
      protein: safeNum((parsed as any).protein),
      carbs: safeNum((parsed as any).carbs),
      fat: safeNum((parsed as any).fat),
    };
  } else {
    throw new Error('Gemini API key required. Add it in Settings.');
  }
}

// ──────────────────────────────────────────────────────────────────────────
// PUBLIC: analyzeFoodTextOnly (description only)
// ──────────────────────────────────────────────────────────────────────────
export async function analyzeFoodTextOnly(
  description: string,
  userApiKey: string,
  authToken?: string
): Promise<GeminiNutritionResponse> {
  await enforceRateLimit('analyze_food');

  if (userApiKey) {
    // Use personal key
    const prompt = FOOD_TEXT_PROMPT(description);
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL });
    const result = await model.generateContent(prompt);
    const parsed = parseJsonFromText<GeminiNutritionResponse>(result.response.text());
    return { ...parsed, calories: safeNum(parsed.calories), protein: safeNum(parsed.protein), carbs: safeNum(parsed.carbs), fat: safeNum(parsed.fat) };
  } else if (authToken) {
    // Use shared key via proxy
    const parsed = await callGeminiProxy<GeminiNutritionResponse>('food_text', { description }, authToken);
    return {
      ...parsed,
      calories: safeNum((parsed as any).calories),
      protein: safeNum((parsed as any).protein),
      carbs: safeNum((parsed as any).carbs),
      fat: safeNum((parsed as any).fat),
    };
  } else {
    throw new Error('Gemini API key required. Add it in Settings.');
  }
}

// ──────────────────────────────────────────────────────────────────────────
// PUBLIC: parseWorkout (natural language → structured exercises)
// ──────────────────────────────────────────────────────────────────────────
export async function parseWorkout(
  description: string,
  userApiKey: string
): Promise<GeminiWorkoutResponse> {
  if (!userApiKey) throw new Error('Gemini API key required. Add it in Settings.');
  await enforceRateLimit('parse_workout');
  const prompt = WORKOUT_PROMPT(description);
  const ai = new GoogleGenerativeAI(userApiKey);
  const model = ai.getGenerativeModel({ model: PERSONAL_MODEL });
  const result = await model.generateContent(prompt);
  const parsed = parseJsonFromText<GeminiWorkoutResponse>(result.response.text());
  if (parsed.exercises) {
    parsed.exercises = parsed.exercises.map(ex => ({
      ...ex,
      sets: (ex.sets || []).map(s => ({
        weight_kg: safeNum(s.weight_kg),
        reps: safeNum(s.reps),
      })),
    }));
  }
  return parsed;
}

// ──────────────────────────────────────────────────────────────────────────
// Chat types
// ──────────────────────────────────────────────────────────────────────────
export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface ChatContext {
  user: User | null;
  settings: UserSettings | null;
  todayFoodLogs: FoodLog[];
  todayWaterLogs: WaterLog[];
  todayWorkoutLogs: WorkoutLog[];
  weightLogs: WeightLog[];
  activeSplit: Split | null;
  splitDays: SplitDay[];
  achievements: UserAchievement[];
  todaySupplementLogs: SupplementLog[];
  todayStepsLogs: StepsLog[];
  todayCardioLogs: CardioLog[];
  todaySleepLogs: SleepLog[];
}

// ──────────────────────────────────────────────────────────────────────────
// Agentic system prompt builder
// ──────────────────────────────────────────────────────────────────────────
export function buildAgenticPrompt(ctx: ChatContext): string {
  const {
    user, settings, todayFoodLogs, todayWaterLogs, todayWorkoutLogs,
    weightLogs, activeSplit, splitDays, achievements,
    todaySupplementLogs, todayStepsLogs, todayCardioLogs, todaySleepLogs
  } = ctx;

  const sections: string[] = [];

  sections.push(
    `You are "Swift Logger AI", an elite personal fitness coach, nutritionist, and wellness advisor built into the Swift Logger fitness app. ` +
    `You have FULL real-time access to the user's tracking data shown below. ` +
    `Use this data proactively — reference specific numbers, point out gaps, suggest concrete foods/exercises, and celebrate wins. ` +
    `Be concise, practical, motivating, and data-driven. If the user describes pain or injury, always recommend seeing a medical professional.`
  );

  if (user) {
    sections.push(
      `\n📋 USER PROFILE:\n` +
      `• Name: ${user.username}\n` +
      `• Age: ${user.age} | Gender: ${user.gender}\n` +
      `• Height: ${user.height_cm} cm\n` +
      `• Current Weight: ${user.current_weight_kg} kg\n` +
      `• Goal Weight: ${user.goal_weight_kg} kg\n` +
      `• Starting Weight: ${user.starting_weight_kg} kg\n` +
      `• Weight ${user.current_weight_kg > user.goal_weight_kg ? 'to lose' : 'to gain'}: ${Math.abs(user.current_weight_kg - user.goal_weight_kg).toFixed(1)} kg`
    );
  }

  if (settings) {
    sections.push(
      `\n🎯 DAILY TARGETS (Calorie mode: ${settings.calorie_mode.replace('_', ' ')}):\n` +
      `• Calories: ${settings.target_calories} kcal (maintenance: ${settings.maintenance_calories} kcal)\n` +
      `• Protein: ${settings.target_protein} g\n` +
      `• Carbs: ${settings.target_carbs} g\n` +
      `• Fat: ${settings.target_fat} g\n` +
      `• Water: ${settings.water_goal_ml} ml`
    );
  }

  const totalCals = todayFoodLogs.reduce((s, f) => s + f.calories, 0);
  const totalProtein = todayFoodLogs.reduce((s, f) => s + f.protein, 0);
  const totalCarbs = todayFoodLogs.reduce((s, f) => s + f.carbs, 0);
  const totalFat = todayFoodLogs.reduce((s, f) => s + f.fat, 0);
  const tCals = settings?.target_calories ?? 0;
  const tProtein = settings?.target_protein ?? 0;
  const tCarbs = settings?.target_carbs ?? 0;
  const tFat = settings?.target_fat ?? 0;

  let foodSection = `\n🍽️ TODAY'S FOOD LOG (${todayFoodLogs.length} items):\n`;
  if (todayFoodLogs.length === 0) {
    foodSection += `• Nothing logged yet today!\n`;
  } else {
    const byMeal: Record<string, FoodLog[]> = {};
    todayFoodLogs.forEach(f => { if (!byMeal[f.meal_type]) byMeal[f.meal_type] = []; byMeal[f.meal_type].push(f); });
    for (const [meal, items] of Object.entries(byMeal)) {
      foodSection += `  ${meal.charAt(0).toUpperCase() + meal.slice(1)}:\n`;
      items.forEach(f => { foodSection += `    - ${f.food_name}: ${f.calories} kcal | P:${f.protein}g C:${f.carbs}g F:${f.fat}g\n`; });
    }
  }
  foodSection += `\n📊 TOTALS vs TARGETS:\n`;
  foodSection += `• Calories: ${totalCals} / ${tCals} kcal (${tCals - totalCals > 0 ? tCals - totalCals + ' remaining' : 'target reached!'})\n`;
  foodSection += `• Protein:  ${totalProtein} / ${tProtein} g\n`;
  foodSection += `• Carbs:    ${totalCarbs} / ${tCarbs} g\n`;
  foodSection += `• Fat:      ${totalFat} / ${tFat} g`;
  sections.push(foodSection);

  const totalWater = todayWaterLogs.reduce((s, w) => s + w.amount_ml, 0);
  const waterGoal = settings?.water_goal_ml ?? 0;
  sections.push(
    `\n💧 TODAY'S WATER:\n` +
    `• ${totalWater} / ${waterGoal} ml (${waterGoal - totalWater > 0 ? waterGoal - totalWater + ' ml remaining' : 'goal reached!'})\n` +
    `• ${todayWaterLogs.length} entries logged`
  );

  let workoutSection = `\n🏋️ TODAY'S WORKOUTS (${todayWorkoutLogs.length}):\n`;
  if (todayWorkoutLogs.length === 0) {
    workoutSection += `• No workouts logged yet today.`;
  } else {
    todayWorkoutLogs.forEach((w, i) => {
      workoutSection += `  Workout ${i + 1}: ${w.title || 'Untitled'}`;
      if (w.duration_minutes) workoutSection += ` (${w.duration_minutes} min)`;
      workoutSection += '\n';
      if (w.exercises && w.exercises.length > 0) {
        w.exercises.forEach(ex => {
          const setsStr = ex.sets?.map(s =>
            `${s.weight_kg}kg × ${s.reps}${s.is_warmup ? ' (warmup)' : ''}`
          ).join(', ') || 'no sets';
          workoutSection += `    - ${ex.exercise_name}${ex.muscle_group ? ` [${ex.muscle_group}]` : ''}: ${setsStr}\n`;
        });
      }
    });
  }
  sections.push(workoutSection);

  if (activeSplit && splitDays.length > 0) {
    let splitSection = `\n📅 ACTIVE SPLIT: "${activeSplit.name}"\n`;
    const todayIdx = settings?.current_split_day ?? 1;
    splitDays
      .sort((a, b) => a.day_number - b.day_number)
      .forEach(d => {
        const marker = d.day_number === todayIdx ? ' 👈 TODAY' : '';
        splitSection += `  Day ${d.day_number} (${d.day_name}): ${d.muscle_groups.join(', ')}${marker}\n`;
      });
    sections.push(splitSection);
  }

  if (weightLogs.length > 0) {
    const recent = [...weightLogs]
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
      .slice(0, 14);
    let weightSection = `\n⚖️ RECENT WEIGHT TREND (last ${recent.length} entries):\n`;
    recent.reverse().forEach(w => {
      weightSection += `  ${new Date(w.logged_at).toLocaleDateString()}: ${w.weight_kg} kg\n`;
    });
    if (recent.length >= 2) {
      const diff = recent[recent.length - 1].weight_kg - recent[0].weight_kg;
      weightSection += `  Net change: ${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`;
    }
    sections.push(weightSection);
  }

  if (todaySupplementLogs.length > 0) {
    sections.push(`\n💊 SUPPLEMENTS TAKEN: ${todaySupplementLogs.map(s => s.supplement_name).join(', ')}`);
  }

  if (todayStepsLogs.length > 0) {
    const totalSteps = todayStepsLogs.reduce((s, st) => s + st.steps, 0);
    sections.push(`\n🚶 STEPS TODAY: ${totalSteps.toLocaleString()}`);
  }

  if (todayCardioLogs.length > 0) {
    const totalCardioCals = todayCardioLogs.reduce((s, c) => s + c.calories_burned, 0);
    const totalCardioMin = todayCardioLogs.reduce((s, c) => s + c.duration_minutes, 0);
    sections.push(`\n🚴 CARDIO: ${totalCardioMin} min total | ${totalCardioCals} kcal burned`);
  }

  if (todaySleepLogs.length > 0) {
    const s = todaySleepLogs[0];
    sections.push(`\n😴 SLEEP: From ${new Date(s.sleep_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(s.wake_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  }

  if (achievements.length > 0) {
    sections.push(`\n🏆 ACHIEVEMENTS UNLOCKED: ${achievements.length} total`);
  }

  sections.push(
    `\n⚡ BEHAVIOR GUIDELINES:\n` +
    `• When asked what to eat: Reference REMAINING macros, suggest specific foods/quantities.\n` +
    `• When asked about workouts: Reference the active split, today's schedule, recent sessions.\n` +
    `• Proactively flag if significantly under/over on macros, water, or a missed workout.\n` +
    `• Give specific quantities (e.g., "200g chicken breast gives ~62g protein").\n` +
    `• Be encouraging when on track. Be constructive when off track.\n` +
    `• Use their name (${user?.username || 'friend'}) occasionally.\n` +
    `• For regional food suggestions, include common Indian foods where relevant.\n` +
    `• Keep responses concise — bullet points and short paragraphs. No walls of text.`
  );

  return sections.join('\n');
}

// ──────────────────────────────────────────────────────────────────────────
// PUBLIC: getDailyAdvice
// ──────────────────────────────────────────────────────────────────────────
export async function getDailyAdvice(
  context: ChatContext,
  userApiKey: string
): Promise<string> {
  if (!userApiKey) throw new Error('Gemini API key required. Add it in Settings.');
  await enforceRateLimit('daily_advice');
  const systemPrompt = buildAgenticPrompt(context);
  const advicePrompt = "Based on my data above, give me ONE short, powerful piece of daily advice for today (max 2 sentences). Focus on what I should prioritize right now.";
  const ai = new GoogleGenerativeAI(userApiKey);
  const model = ai.getGenerativeModel({ model: PERSONAL_MODEL });
  const result = await model.generateContent(systemPrompt + "\n\n" + advicePrompt);
  return result.response.text().trim().replace(/^"|"$/g, '');
}

// ──────────────────────────────────────────────────────────────────────────
// PUBLIC: chatWithAI
// ──────────────────────────────────────────────────────────────────────────
export async function chatWithAI(
  message: string,
  history: ChatHistoryItem[],
  context: ChatContext,
  userApiKey: string,
  authToken?: string
): Promise<string> {
  if (!userApiKey && !authToken) throw new Error('Gemini API key required. Add it in Settings.');
  await enforceRateLimit('chat');
  const systemPrompt = buildAgenticPrompt(context);
  
  if (userApiKey) {
    // Use personal key
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL });
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: `Got it! I have all your data loaded. How can I help?` }] },
        ...history,
      ],
    });
    const result = await chat.sendMessage(message);
    return result.response.text();
  } else if (authToken) {
    // Use shared key via proxy
    const response = await callGeminiProxy<{ text: string }>('chat', { message, systemPrompt, history }, authToken);
    return (response as any).text || 'Unable to generate response';
  }
  
  throw new Error('No API key available');
}

// Legacy export (used by initGemini callers if any)
export function initGemini(_apiKey: string) { }
export function getEffectiveApiKey(_key?: string | null) { return { key: '', model: PERSONAL_MODEL }; }

// ──────────────────────────────────────────────────────────────────────────
// PUBLIC: checkAutoRegulation — proactive AI suggestion based on sleep/calories
// ──────────────────────────────────────────────────────────────────────────
export async function checkAutoRegulation(
  context: ChatContext,
  userApiKey: string
): Promise<AutoRegulation | null> {
  const { todaySleepLogs, todayFoodLogs, settings } = context;

  // Check conditions: < 5 hours sleep OR < 50% calories by 3pm
  const sleep = todaySleepLogs[0];
  let sleepHours = 8;
  if (sleep?.sleep_at && sleep?.wake_at) {
    sleepHours = Math.abs(new Date(sleep.wake_at).getTime() - new Date(sleep.sleep_at).getTime()) / 3600000;
  }

  const totalCals = todayFoodLogs.reduce((s, f) => s + f.calories, 0);
  const targetCals = settings?.target_calories || 2000;
  const hour = new Date().getHours();
  const calRatio = totalCals / targetCals;

  const needsSleepCheck = sleepHours < 5;
  const needsCalorieCheck = hour >= 15 && calRatio < 0.5;

  if (!needsSleepCheck && !needsCalorieCheck) return null;

  const prompt = needsSleepCheck
    ? `User got ${sleepHours.toFixed(1)} hours of sleep last night. In 1-2 sentences, suggest a proactive workout volume reduction and explain why. Be direct and specific (e.g., "Noticed you only got ${sleepHours.toFixed(1)}h of sleep. I'd suggest dropping today's workout volume by 20% to prevent injury and CNS fatigue."). Respond ONLY in JSON: {"message": string, "type": "sleep", "suggestion": string, "volumeReductionPercent": number}`
    : `User has only consumed ${totalCals} of their ${targetCals} calorie target by ${hour}:00. In 1-2 sentences, give a proactive nudge (e.g., a quick meal suggestion). Respond ONLY in JSON: {"message": string, "type": "calories", "suggestion": string}`;

  try {
    if (!userApiKey) return null;
    await enforceRateLimit('auto_regulation');
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseJsonFromText<AutoRegulation>(text);
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// PUBLIC: generateGroceryList — AI-generated weekly shopping list
// ──────────────────────────────────────────────────────────────────────────
export async function generateGroceryList(
  context: ChatContext,
  userApiKey: string
): Promise<GroceryList> {
  const systemPrompt = buildAgenticPrompt(context);
  const prompt = `${systemPrompt}\n\nBased on this user's diet goals and recent eating patterns, generate a practical weekly grocery shopping list. Organize by category. Focus on whole foods that help hit their macro targets. Respond ONLY in JSON: {"categories": [{"category": string, "items": string[]}]}`;

  if (!userApiKey) throw new Error('Gemini API key required. Add it in Settings.');
  await enforceRateLimit('grocery_list');
  const ai = new GoogleGenerativeAI(userApiKey);
  const model = ai.getGenerativeModel({ model: PERSONAL_MODEL });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const parsed = parseJsonFromText<{ categories: GroceryCategory[] }>(text);
  return { categories: parsed.categories || [], generatedAt: new Date().toISOString() };
}

// ──────────────────────────────────────────────────────────────────────────
// PUBLIC: matchMacros — AI food suggestions to hit remaining macros
// ──────────────────────────────────────────────────────────────────────────
export async function matchMacros(
  remaining: { protein: number; carbs: number; fat: number; calories: number },
  preferences: string,
  userApiKey: string
): Promise<MacroMatch[]> {
  const prompt = `You are a nutrition expert. Suggest 4 specific foods/meals that together would help hit these remaining macro targets for the day:
- Calories remaining: ${remaining.calories} kcal
- Protein remaining: ${remaining.protein}g
- Carbs remaining: ${remaining.carbs}g
- Fat remaining: ${remaining.fat}g
${preferences ? `User preferences: ${preferences}` : ''}
Consider simple, accessible foods. Respond ONLY in JSON: {"matches": [{"food_name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "serving_size": string}]}`;

  if (!userApiKey) throw new Error('Gemini API key required. Add it in Settings.');
  await enforceRateLimit('match_macros');
  const ai = new GoogleGenerativeAI(userApiKey);
  const model = ai.getGenerativeModel({ model: PERSONAL_MODEL });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const parsed = parseJsonFromText<{ matches: MacroMatch[] }>(text);
  return parsed.matches || [];
}

// ──────────────────────────────────────────────────────────────────────────
// PUBLIC: parseVoiceLog — parse a voice transcript into structured log data
// ──────────────────────────────────────────────────────────────────────────
export async function parseVoiceLog(
  transcript: string,
  userApiKey: string
): Promise<VoiceLogResult> {
  const prompt = `You are a fitness app log parser. Parse this voice dictation into structured fitness log data. Extract ALL mentioned items.
Voice input: "${transcript}"
Respond ONLY in JSON format:
{
  "workouts": [{"name": string, "sets": [{"weight_kg": number, "reps": number, "rpe": number}]}],
  "water": {"amount_ml": number},
  "food": [{"food_name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "meal_type": "breakfast"|"lunch"|"dinner"|"snack"}],
  "supplements": [string]
}
If something isn't mentioned, omit that key entirely. For water "a bottle" = 500ml, "a glass" = 250ml. For calories/macros, estimate if not given.`;

  if (!userApiKey) throw new Error('Gemini API key required. Add it in Settings.');
  await enforceRateLimit('voice_log');
  const ai = new GoogleGenerativeAI(userApiKey);
  const model = ai.getGenerativeModel({ model: PERSONAL_MODEL });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const parsed = parseJsonFromText<VoiceLogResult>(text);
  return { ...parsed, raw_transcript: transcript };
}

// ──────────────────────────────────────────────────────────────────────────
// PUBLIC: generateRoast — AI roast/motivation for broken streaks (Hardcore Mode)
// ──────────────────────────────────────────────────────────────────────────
export async function generateRoast(
  context: ChatContext,
  streakType: string,
  streakDays: number,
  userApiKey: string
): Promise<string> {
  const name = context.user?.username || 'champ';
  const prompt = `You are a funny, slightly savage but ultimately motivating fitness coach. ${name} just broke their ${streakDays}-day ${streakType} streak. Write ONE short roast (max 2 sentences). Be funny and a bit harsh but end on a motivating note. No emojis. Keep it punchy.`;

  if (!userApiKey) throw new Error('Gemini API key required. Add it in Settings.');
  await enforceRateLimit('roast');
  const ai = new GoogleGenerativeAI(userApiKey);
  const model = ai.getGenerativeModel({ model: PERSONAL_MODEL });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

// ──────────────────────────────────────────────────────────────────────────
// PUBLIC: analyzeProductBarcode — look up product from barcode data via AI
// ──────────────────────────────────────────────────────────────────────────
export interface ProductAnalysis {
  product_name: string;
  brand: string;
  serving_size: string;
  product_weight_g: number;  // total pack weight in grams (0 if unknown)
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

export async function analyzeProductBarcode(
  barcodeData: string,
  barcodeType: string,
  userApiKey: string,
  authToken?: string
): Promise<ProductAnalysis> {
  // Step 1: Look up in Open Food Facts (real product database)
  let offProduct: any = null;
  try {
    const offRes = await fetchWithTimeout(`${OPEN_FOOD_FACTS_URL}/${encodeURIComponent(barcodeData)}.json`, {
      headers: { 'User-Agent': 'SwiftLogger/1.0 (fitness-app)' },
    }, OPEN_FOOD_FACTS_TIMEOUT_MS);
    if (offRes.ok) {
      const offData = await offRes.json();
      if (offData.status === 1 && offData.product) {
        offProduct = offData.product;
      }
    }
  } catch {}

  if (offProduct) {
    // We have real data — build result directly from Open Food Facts (FAST path)
    const nutriments = offProduct.nutriments || {};
    // Extract product weight
    let productWeightG = 0;
    const quantityStr = offProduct.product_quantity || offProduct.quantity || '';
    const weightMatch = String(quantityStr).match(/(\d+\.?\d*)\s*(g|gm|grams|ml)/i);
    if (weightMatch) {
      productWeightG = safeNum(parseFloat(weightMatch[1]));
    } else if (typeof quantityStr === 'number') {
      productWeightG = safeNum(quantityStr);
    }

    const protein = safeNum(nutriments.proteins_100g || nutriments.proteins);
    const carbs = safeNum(nutriments.carbohydrates_100g || nutriments.carbohydrates);
    const fat = safeNum(nutriments.fat_100g || nutriments.fat);
    const sugar = safeNum(nutriments.sugars_100g || nutriments.sugars);
    const fiber = safeNum(nutriments.fiber_100g || nutriments.fiber);
    const saturated_fat = safeNum(nutriments['saturated-fat_100g'] || nutriments['saturated-fat']);
    const trans_fat = safeNum(nutriments['trans-fat_100g'] || nutriments['trans-fat']);
    // OFF stores sodium in grams; some entries report mg instead — sanity check
    const rawSodium = safeNum(nutriments.sodium_100g || nutriments.sodium);
    const sodium_mg = rawSodium > 5 ? Math.round(rawSodium) : Math.round(rawSodium * 1000);

    // Calories: prefer energy-kcal, then compute from macros, then kJ conversion
    let calories = safeNum(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || nutriments['energy-kcal_value']);
    if (!calories) {
      // Compute from macros (most reliable for bad data)
      const macroCalc = Math.round(protein * 4 + carbs * 4 + fat * 9);
      if (macroCalc > 0) {
        calories = macroCalc;
      } else if (nutriments.energy_100g || nutriments.energy_value) {
        // Last resort: kJ conversion
        const unit = (nutriments.energy_unit || 'kJ').toLowerCase();
        const rawEnergy = safeNum(nutriments.energy_100g || nutriments.energy_value);
        calories = unit === 'kcal' ? Math.round(rawEnergy) : Math.round(rawEnergy / 4.184);
      }
    }

    // Compute health rating locally (instant, no AI needed)
    const ingredients = (offProduct.ingredients_text || offProduct.ingredients_text_en || '').toLowerCase();
    const nova = safeNum(offProduct.nova_group, 0);
    const additivesList = (offProduct.additives_tags || []).map((a: string) => a.replace('en:', ''));
    const allergensList = (offProduct.allergens_tags || []).map((a: string) => a.replace('en:', ''));

    // Simple health rating logic
    let health_rating: ProductAnalysis['health_rating'] = 'alright';
    const concerns: string[] = [];

    if (trans_fat > 1) { health_rating = 'dangerous'; concerns.push('High trans fat'); }
    if (sodium_mg > 1500) { if (health_rating !== 'dangerous') health_rating = 'bad'; concerns.push('Very high sodium'); }
    if (sugar > 20) { if (health_rating !== 'dangerous') health_rating = 'bad'; concerns.push('Very high sugar'); }
    if (sugar > 12 && health_rating === 'alright') { health_rating = 'bad'; concerns.push('High sugar content'); }
    if (saturated_fat > 8 && health_rating === 'alright') { health_rating = 'bad'; concerns.push('High saturated fat'); }
    if (sodium_mg > 600 && health_rating === 'alright') { concerns.push('Moderate-high sodium'); }
    if (nova === 4 && health_rating === 'alright') { health_rating = 'bad'; concerns.push('Ultra-processed (NOVA 4)'); }

    // Positive checks
    if (protein > 15 && sugar < 5 && saturated_fat < 3 && nova <= 2) { health_rating = 'healthy'; }
    else if (fiber > 5 && sugar < 8 && nova <= 2) { health_rating = 'healthy'; }
    else if (protein > 10 && sugar < 8 && saturated_fat < 5 && concerns.length === 0) { health_rating = 'good'; }
    else if (concerns.length === 0 && nova <= 3) { health_rating = 'good'; }

    // Check for harmful ingredients
    const badIngredients = ['hydrogenated', 'palm oil', 'high fructose corn syrup', 'aspartame', 'acesulfame', 'sodium benzoate', 'tbhq', 'msg', 'monosodium glutamate'];
    badIngredients.forEach(bi => {
      if (ingredients.includes(bi)) concerns.push(`Contains ${bi}`);
    });

    const reasoning = concerns.length > 0
      ? concerns.slice(0, 3).join('. ') + '.'
      : protein > 10 ? 'Good protein content with reasonable macros.'
      : 'Moderate nutritional profile.';

    return {
      product_name: offProduct.product_name || offProduct.product_name_en || 'Unknown',
      brand: offProduct.brands || 'Unknown',
      serving_size: offProduct.serving_size || offProduct.quantity || 'per 100g',
      product_weight_g: productWeightG,
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      sugar: Math.round(sugar * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
      sodium_mg,
      saturated_fat: Math.round(saturated_fat * 10) / 10,
      trans_fat: Math.round(trans_fat * 10) / 10,
      cholesterol_mg: Math.round(safeNum(nutriments['cholesterol_100g']) * 1000),
      ingredients_concern: concerns,
      health_rating,
      health_reasoning: reasoning,
      additives: additivesList,
      allergens: allergensList,
    };
  }

  // No database match — fall back to AI guess
  const prompt = `You are a food product nutrition expert. A user scanned a barcode but it was NOT found in the Open Food Facts database.

Barcode type: ${barcodeType}
Barcode data: ${barcodeData}

Try to identify this product from the barcode number. Common barcode prefixes: 890 = India, 0-09 = USA/Canada, 30-37 = France, 400-440 = Germany, 45-49 = Japan, 50 = UK, 87 = Netherlands, 880 = South Korea.

If you can identify the product, provide accurate nutritional data. If not, set product_name to "Unknown Product — try scanning again".

Health rating criteria:
- "dangerous": Banned substances, very high trans fats, excessive sodium, known harmful additives
- "bad": High added sugars (>15g), high saturated fat, mostly empty calories, heavily processed
- "alright": Moderate nutritional value, some processing
- "good": Decent macro profile, limited processing, beneficial nutrients
- "healthy": Whole/minimally processed, high protein or fiber, clean ingredients

Respond ONLY in JSON:
{
  "product_name": string,
  "brand": string,
  "serving_size": string,
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

  await enforceRateLimit('analyze_barcode');
  let parsed: ProductAnalysis;

  if (userApiKey) {
    const ai = new GoogleGenerativeAI(userApiKey);
    const model = ai.getGenerativeModel({ model: PERSONAL_MODEL });
    const result = await model.generateContent(prompt);
    parsed = parseJsonFromText<ProductAnalysis>(result.response.text());
  } else if (authToken) {
    parsed = await callGeminiProxy<ProductAnalysis>('barcode', { barcodeData, barcodeType }, authToken);
  } else {
    throw new Error('Gemini API key required. Add it in Settings.');
  }

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
  parsed.ingredients_concern = Array.isArray(parsed.ingredients_concern) ? parsed.ingredients_concern : [];
  parsed.additives = Array.isArray(parsed.additives) ? parsed.additives : [];
  parsed.allergens = Array.isArray(parsed.allergens) ? parsed.allergens : [];
  parsed.product_weight_g = safeNum(parsed.product_weight_g);
  return parsed;
}
