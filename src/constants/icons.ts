import { Ionicons } from '@expo/vector-icons';

// Muscle group icons (Ionicons)
export const MUSCLE_ICONS: Record<string, { icon: string; color: string }> = {
  'Chest':        { icon: 'fitness',        color: '#FF6B6B' },
  'Back':         { icon: 'body',           color: '#4A90FF' },
  'Shoulders':    { icon: 'arrow-up-circle', color: '#FF8A00' },
  'Biceps':       { icon: 'flash',          color: '#FFD93D' },
  'Triceps':      { icon: 'flash-outline',  color: '#FF6EC7' },
  'Legs':         { icon: 'footsteps',      color: '#00E5A0' },
  'Quads':        { icon: 'footsteps',      color: '#00E5A0' },
  'Hamstrings':   { icon: 'trending-down',  color: '#6BCB77' },
  'Glutes':       { icon: 'flame',          color: '#FF4757' },
  'Calves':       { icon: 'walk',           color: '#4FC3F7' },
  'Core':         { icon: 'radio-button-on', color: '#7B61FF' },
  'Abs':          { icon: 'radio-button-on', color: '#7B61FF' },
  'Forearms':     { icon: 'hand-left',      color: '#CD7F32' },
  'Traps':        { icon: 'chevron-up-circle', color: '#00D4FF' },
  'Full Body':    { icon: 'body',           color: '#39FF14' },
  'Cardio':       { icon: 'heart',          color: '#FF4757' },
  'Rest':         { icon: 'bed',            color: '#8E8E93' },
};

// Activity icons
export const ACTIVITY_ICONS: Record<string, { icon: string; color: string }> = {
  food:     { icon: 'restaurant',     color: '#FF8A00' },
  workout:  { icon: 'barbell',        color: '#4A90FF' },
  water:    { icon: 'water',          color: '#4FC3F7' },
  weight:   { icon: 'scale',          color: '#7B61FF' },
  photo:    { icon: 'camera',         color: '#FF6EC7' },
  chat:     { icon: 'sparkles',       color: '#FFD93D' },
  trophy:   { icon: 'trophy',         color: '#FFD700' },
};

// Achievement tier icons
export const TIER_CONFIG: Record<string, { icon: string; color: string; glow: string }> = {
  bronze:  { icon: 'medal-outline',   color: '#CD7F32', glow: 'rgba(205,127,50,0.3)' },
  silver:  { icon: 'medal-outline',   color: '#C0C0C0', glow: 'rgba(192,192,192,0.3)' },
  gold:    { icon: 'medal',           color: '#FFD700', glow: 'rgba(255,215,0,0.3)' },
  diamond: { icon: 'diamond',         color: '#B9F2FF', glow: 'rgba(185,242,255,0.4)' },
};

// Gamification icons
export const GAMIFICATION_ICONS = {
  streak: { icon: 'flame', color: '#FF8A00' },
  pr: { icon: 'flash', color: '#FFD700' },
  levelUp: { icon: 'arrow-up-circle', color: '#00E5A0' },
  confetti: { icon: 'sparkles', color: '#FF6EC7' },
};

// Meal type icons (filled, glowing)
export const MEAL_ICONS: Record<string, { icon: string; color: string }> = {
  breakfast: { icon: 'sunny',         color: '#FFD93D' },
  lunch:     { icon: 'partly-sunny',  color: '#FF8A00' },
  dinner:    { icon: 'moon',          color: '#7B61FF' },
  snack:     { icon: 'cafe',          color: '#6BCB77' },
};

export function getMuscleIcon(muscle: string): { icon: string; color: string } {
  return MUSCLE_ICONS[muscle] || { icon: 'barbell', color: '#4A90FF' };
}
