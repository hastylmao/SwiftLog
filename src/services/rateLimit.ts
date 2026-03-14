import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ── Daily rate limits per feature ──────────────────────────────────────
const RATE_LIMITS: Record<string, number> = {
  grocery_list: 10,      // meal prep prompts
  chat: 60,              // AI chat messages
  analyze_food: 40,      // food photo/text analysis
  analyze_barcode: 30,   // product barcode scans (AI fallback)
  parse_workout: 30,     // workout text parser
  daily_advice: 10,      // daily insight generation
  match_macros: 15,      // macro matching suggestions
  auto_regulation: 10,   // proactive AI checks
  voice_log: 20,         // voice log parsing
  roast: 10,             // streak roast generation
};

function getTodayKey(feature: string): string {
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `rate_limit:${feature}:${dateStr}`;
}

// Platform-agnostic storage helper
async function getStorageValue(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    } else {
      return await AsyncStorage.getItem(key);
    }
  } catch (err) {
    console.warn('[rateLimit] Storage read error:', err);
    return null;
  }
}

async function setStorageValue(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch (err) {
    console.warn('[rateLimit] Storage write error:', err);
  }
}

export async function checkRateLimit(feature: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limit = RATE_LIMITS[feature];
  if (!limit) return { allowed: true, remaining: 999, limit: 999 };

  const key = getTodayKey(feature);
  const stored = await getStorageValue(key);
  const count = stored ? parseInt(stored, 10) : 0;

  return {
    allowed: count < limit,
    remaining: Math.max(0, limit - count),
    limit,
  };
}

export async function incrementRateLimit(feature: string): Promise<void> {
  const key = getTodayKey(feature);
  const stored = await getStorageValue(key);
  const count = stored ? parseInt(stored, 10) : 0;
  await setStorageValue(key, String(count + 1));
}

export function getRateLimitError(feature: string): string {
  const limit = RATE_LIMITS[feature] || 0;
  const labels: Record<string, string> = {
    grocery_list: 'meal prep',
    chat: 'AI chat',
    analyze_food: 'food analysis',
    analyze_barcode: 'barcode scan',
    parse_workout: 'workout parsing',
    daily_advice: 'daily advice',
    match_macros: 'macro matching',
    auto_regulation: 'auto-regulation',
    voice_log: 'voice logging',
    roast: 'roast generation',
  };
  return `Daily limit reached for ${labels[feature] || feature} (${limit}/day). Resets at midnight.`;
}
