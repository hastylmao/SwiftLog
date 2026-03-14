export type Gender = 'male' | 'female';
export type CalorieMode = 'maintain' | 'light_cut' | 'heavy_cut' | 'light_bulk' | 'heavy_bulk';

export interface User {
  id: string;
  username: string;
  age: number;
  height_cm: number;
  starting_weight_kg: number;
  current_weight_kg: number;
  goal_weight_kg: number;
  gender: Gender;
  avatar_url?: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  gemini_api_key?: string;
  calorie_mode: CalorieMode;
  maintenance_calories: number;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  water_goal_ml: number;
  current_split_day: number;
  supplement_plan?: string[];
  created_at: string;
  updated_at: string;
}

export interface Split {
  id: string;
  user_id: string;
  name: string;
  type: 'preset' | 'custom';
  is_active: boolean;
  created_at: string;
}

export interface SplitDay {
  id: string;
  split_id: string;
  day_number: number;
  day_name: string;
  muscle_groups: string[];
  created_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photo_url?: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  logged_at: string;
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  is_warmup: boolean;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_log_id: string;
  exercise_name: string;
  muscle_group?: string;
  order_index: number;
  created_at: string;
  sets?: WorkoutSet[];
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  split_day_id?: string;
  title?: string;
  notes?: string;
  duration_minutes?: number;
  photo_url?: string;
  photo_urls?: string[];
  logged_at: string;
  created_at: string;
  exercises?: WorkoutExercise[];
}

export interface WaterLog {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
  created_at: string;
}

export interface SupplementLog {
  id: string;
  user_id: string;
  supplement_name: string;
  dosage?: string;
  taken_at: string;
  created_at?: string;
}

export interface StepsLog {
  id: string;
  user_id: string;
  steps: number;
  logged_at: string;
  created_at?: string;
}

export interface CardioLog {
  id: string;
  user_id: string;
  cardio_type: string;
  duration_minutes: number;
  calories_burned: number;
  logged_at: string;
  created_at?: string;
}

export interface SleepLog {
  id: string;
  user_id: string;
  sleep_at: string;
  wake_at: string;
  quality_score?: number;
  logged_at: string;
  created_at?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  criteria: AchievementCriteria;
}

export interface AchievementCriteria {
  type: string;
  value: number;
  exercise?: string;
  metric?: string;
  meal_type?: string;
  muscle?: string;
  time_of_day?: string;
  min_per_week?: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  tier?: string;
}

export interface Photo {
  id: string;
  user_id: string;
  url: string;
  type: 'workout' | 'food' | 'progress';
  caption?: string;
  related_log_id?: string;
  created_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  logged_at: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// ── New types for rework features ─────────────────────────────────────────

export interface UserFullHistory {
  food: FoodLog[];
  workouts: WorkoutLog[];
  water: WaterLog[];
  supplements: SupplementLog[];
  cardio: CardioLog[];
  sleep: SleepLog[];
  steps: StepsLog[];
  weights: WeightLog[];
  achievements: UserAchievement[];
}

export interface FollowRelation {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user: User;
  totalVolume: number;
  workoutsCompleted: number;
  proteinConsumed: number;
  caloriesLogged: number;
  daysLogged: number;
  rank: number;
}

export interface GroceryCategory {
  category: string;
  items: string[];
}

export interface GroceryList {
  categories: GroceryCategory[];
  generatedAt: string;
}

export interface MacroMatch {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string;
}

export interface AutoRegulation {
  message: string;
  type: 'sleep' | 'calories' | 'recovery';
  suggestion: string;
  volumeReductionPercent?: number;
}

export interface VoiceLogResult {
  workouts?: {
    name: string;
    sets: { weight_kg: number; reps: number }[];
  }[];
  water?: { amount_ml: number };
  food?: {
    food_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    meal_type: string;
  }[];
  supplements?: string[];
  raw_transcript?: string;
}

// Superset support for WorkoutLog
export interface ExerciseEntryWithSuperset {
  name: string;
  muscle_group: string;
  sets: { weight_kg: string; reps: string }[];
  superset_group?: number | null;
}

export interface ExerciseDB {
  name: string;
  muscle_group: string;
  category: string;
  equipment: string;
}

export interface GeminiNutritionResponse {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  food_name: string;
}

export interface GeminiWorkoutResponse {
  exercises: {
    name: string;
    sets: {
      weight_kg: number;
      reps: number;
    }[];
  }[];
}

export interface HistoryTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water_ml: number;
  steps: number;
  cardio_minutes: number;
  cardio_calories: number;
}

export interface HistoryDay {
  date: string;
  foods: FoodLog[];
  workouts: WorkoutLog[];
  water: WaterLog[];
  supplements: SupplementLog[];
  cardio: CardioLog[];
  sleep: SleepLog[];
  steps: StepsLog[];
  weights: WeightLog[];
  totals: HistoryTotals;
}

