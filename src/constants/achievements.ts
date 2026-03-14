import { Achievement } from '../types';

// Achievement categories:
// consistency - logging streaks and daily habits
// nutrition - food logging milestones
// hydration - water intake milestones
// strength - workout volume and progress
// volume - total reps/sets milestones
// social - profile and community
// milestone - weight and body goals
// explorer - trying new things

const achievements: Achievement[] = [
  // ============ CONSISTENCY ============
  { id: 'first_log', name: 'First Step', description: 'Log your first food entry', category: 'consistency', tier: 'bronze', icon: 'footsteps', criteria: { type: 'food_count', value: 1 } },
  { id: 'food_5', name: 'Getting Started', description: 'Log 5 food entries', category: 'consistency', tier: 'bronze', icon: 'nutrition', criteria: { type: 'food_count', value: 5 } },
  { id: 'food_10', name: 'Consistent Tracker', description: 'Log 10 food entries', category: 'consistency', tier: 'bronze', icon: 'nutrition', criteria: { type: 'food_count', value: 10 } },
  { id: 'food_25', name: 'Dedicated Logger', description: 'Log 25 food entries', category: 'consistency', tier: 'silver', icon: 'nutrition', criteria: { type: 'food_count', value: 25 } },
  { id: 'food_50', name: 'Food Diary Pro', description: 'Log 50 food entries', category: 'consistency', tier: 'silver', icon: 'nutrition', criteria: { type: 'food_count', value: 50 } },
  { id: 'food_100', name: 'Century Meals', description: 'Log 100 food entries', category: 'consistency', tier: 'gold', icon: 'restaurant', criteria: { type: 'food_count', value: 100 } },
  { id: 'food_250', name: 'Meal Master', description: 'Log 250 food entries', category: 'consistency', tier: 'gold', icon: 'restaurant', criteria: { type: 'food_count', value: 250 } },
  { id: 'food_500', name: 'Nutrition Guru', description: 'Log 500 food entries', category: 'consistency', tier: 'diamond', icon: 'star', criteria: { type: 'food_count', value: 500 } },
  { id: 'food_1000', name: 'Legendary Logger', description: 'Log 1000 food entries', category: 'consistency', tier: 'diamond', icon: 'trophy', criteria: { type: 'food_count', value: 1000 } },

  // ============ WORKOUTS ============
  { id: 'first_workout', name: 'Iron Maiden', description: 'Complete your first workout', category: 'strength', tier: 'bronze', icon: 'barbell', criteria: { type: 'workout_count', value: 1 } },
  { id: 'workout_5', name: 'Gym Regular', description: 'Complete 5 workouts', category: 'strength', tier: 'bronze', icon: 'barbell', criteria: { type: 'workout_count', value: 5 } },
  { id: 'workout_10', name: 'Dedicated Lifter', description: 'Complete 10 workouts', category: 'strength', tier: 'bronze', icon: 'barbell', criteria: { type: 'workout_count', value: 10 } },
  { id: 'workout_25', name: 'Quarter Century', description: 'Complete 25 workouts', category: 'strength', tier: 'silver', icon: 'barbell', criteria: { type: 'workout_count', value: 25 } },
  { id: 'workout_50', name: 'Half Century', description: 'Complete 50 workouts', category: 'strength', tier: 'silver', icon: 'fitness', criteria: { type: 'workout_count', value: 50 } },
  { id: 'workout_100', name: 'Century Club', description: 'Complete 100 workouts', category: 'strength', tier: 'gold', icon: 'fitness', criteria: { type: 'workout_count', value: 100 } },
  { id: 'workout_200', name: 'Iron Warrior', description: 'Complete 200 workouts', category: 'strength', tier: 'gold', icon: 'shield', criteria: { type: 'workout_count', value: 200 } },
  { id: 'workout_365', name: 'Year of Iron', description: 'Complete 365 workouts', category: 'strength', tier: 'diamond', icon: 'ribbon', criteria: { type: 'workout_count', value: 365 } },
  { id: 'workout_500', name: 'Legendary Athlete', description: 'Complete 500 workouts', category: 'strength', tier: 'diamond', icon: 'trophy', criteria: { type: 'workout_count', value: 500 } },

  // ============ WATER / HYDRATION ============
  { id: 'first_water', name: 'Stay Hydrated', description: 'Log your first water intake', category: 'hydration', tier: 'bronze', icon: 'water', criteria: { type: 'water_count', value: 1 } },
  { id: 'water_10', name: 'Water Sipper', description: 'Log water 10 times', category: 'hydration', tier: 'bronze', icon: 'water', criteria: { type: 'water_count', value: 10 } },
  { id: 'water_25', name: 'Hydration Fan', description: 'Log water 25 times', category: 'hydration', tier: 'silver', icon: 'water', criteria: { type: 'water_count', value: 25 } },
  { id: 'water_50', name: 'Water Warrior', description: 'Log water 50 times', category: 'hydration', tier: 'silver', icon: 'water', criteria: { type: 'water_count', value: 50 } },
  { id: 'water_100', name: 'Hydration Hero', description: 'Log water 100 times', category: 'hydration', tier: 'gold', icon: 'water', criteria: { type: 'water_count', value: 100 } },
  { id: 'water_250', name: 'Aqua Master', description: 'Log water 250 times', category: 'hydration', tier: 'gold', icon: 'water', criteria: { type: 'water_count', value: 250 } },
  { id: 'water_500', name: 'Ocean Drinker', description: 'Log water 500 times', category: 'hydration', tier: 'diamond', icon: 'water', criteria: { type: 'water_count', value: 500 } },

  // ============ VOLUME (total kg lifted) ============
  { id: 'volume_100', name: 'First Hundred', description: 'Lift a total of 100kg volume', category: 'volume', tier: 'bronze', icon: 'barbell', criteria: { type: 'total_volume', value: 100 } },
  { id: 'volume_500', name: 'Half Ton', description: 'Lift 500kg total volume', category: 'volume', tier: 'bronze', icon: 'barbell', criteria: { type: 'total_volume', value: 500 } },
  { id: 'volume_1000', name: 'One Ton Club', description: 'Lift 1,000kg total volume', category: 'volume', tier: 'silver', icon: 'barbell', criteria: { type: 'total_volume', value: 1000 } },
  { id: 'volume_5000', name: 'Five Ton Force', description: 'Lift 5,000kg total volume', category: 'volume', tier: 'silver', icon: 'barbell', criteria: { type: 'total_volume', value: 5000 } },
  { id: 'volume_10000', name: 'Ten Ton Titan', description: 'Lift 10,000kg total volume', category: 'volume', tier: 'gold', icon: 'flash', criteria: { type: 'total_volume', value: 10000 } },
  { id: 'volume_25000', name: 'Iron Mountain', description: 'Lift 25,000kg total volume', category: 'volume', tier: 'gold', icon: 'flash', criteria: { type: 'total_volume', value: 25000 } },
  { id: 'volume_50000', name: 'Steel Colossus', description: 'Lift 50,000kg total volume', category: 'volume', tier: 'diamond', icon: 'flash', criteria: { type: 'total_volume', value: 50000 } },
  { id: 'volume_100000', name: 'Legend of Iron', description: 'Lift 100,000kg total volume', category: 'volume', tier: 'diamond', icon: 'trophy', criteria: { type: 'total_volume', value: 100000 } },

  // ============ CALORIES CONSUMED ============
  { id: 'cal_1000', name: 'First Thousand', description: 'Log 1,000 total calories', category: 'nutrition', tier: 'bronze', icon: 'flame', criteria: { type: 'total_calories', value: 1000 } },
  { id: 'cal_5000', name: 'Fueled Up', description: 'Log 5,000 total calories', category: 'nutrition', tier: 'bronze', icon: 'flame', criteria: { type: 'total_calories', value: 5000 } },
  { id: 'cal_10000', name: 'Energy Tracker', description: 'Log 10,000 total calories', category: 'nutrition', tier: 'silver', icon: 'flame', criteria: { type: 'total_calories', value: 10000 } },
  { id: 'cal_50000', name: 'Calorie Counter', description: 'Log 50,000 total calories', category: 'nutrition', tier: 'silver', icon: 'flame', criteria: { type: 'total_calories', value: 50000 } },
  { id: 'cal_100000', name: 'Macro Machine', description: 'Log 100,000 total calories', category: 'nutrition', tier: 'gold', icon: 'flame', criteria: { type: 'total_calories', value: 100000 } },
  { id: 'cal_500000', name: 'Fuel Master', description: 'Log 500,000 total calories', category: 'nutrition', tier: 'gold', icon: 'flame', criteria: { type: 'total_calories', value: 500000 } },
  { id: 'cal_1000000', name: 'Million Calorie Club', description: 'Log 1,000,000 total calories', category: 'nutrition', tier: 'diamond', icon: 'flame', criteria: { type: 'total_calories', value: 1000000 } },

  // ============ PROTEIN ============
  { id: 'protein_100', name: 'Protein Starter', description: 'Log 100g total protein', category: 'nutrition', tier: 'bronze', icon: 'nutrition', criteria: { type: 'total_protein', value: 100 } },
  { id: 'protein_500', name: 'Protein Lover', description: 'Log 500g total protein', category: 'nutrition', tier: 'bronze', icon: 'nutrition', criteria: { type: 'total_protein', value: 500 } },
  { id: 'protein_1000', name: 'Protein Power', description: 'Log 1,000g total protein', category: 'nutrition', tier: 'silver', icon: 'nutrition', criteria: { type: 'total_protein', value: 1000 } },
  { id: 'protein_5000', name: 'Amino Acid King', description: 'Log 5,000g total protein', category: 'nutrition', tier: 'silver', icon: 'nutrition', criteria: { type: 'total_protein', value: 5000 } },
  { id: 'protein_10000', name: 'Protein Legend', description: 'Log 10,000g total protein', category: 'nutrition', tier: 'gold', icon: 'nutrition', criteria: { type: 'total_protein', value: 10000 } },
  { id: 'protein_50000', name: 'Muscle Architect', description: 'Log 50,000g total protein', category: 'nutrition', tier: 'diamond', icon: 'nutrition', criteria: { type: 'total_protein', value: 50000 } },

  // ============ WATER VOLUME (total ml) ============
  { id: 'water_vol_1L', name: 'First Liter', description: 'Drink 1 liter total', category: 'hydration', tier: 'bronze', icon: 'water', criteria: { type: 'total_water', value: 1000 } },
  { id: 'water_vol_10L', name: 'Ten Liters', description: 'Drink 10 liters total', category: 'hydration', tier: 'bronze', icon: 'water', criteria: { type: 'total_water', value: 10000 } },
  { id: 'water_vol_50L', name: 'Fifty Liters', description: 'Drink 50 liters total', category: 'hydration', tier: 'silver', icon: 'water', criteria: { type: 'total_water', value: 50000 } },
  { id: 'water_vol_100L', name: 'Hundred Liters', description: 'Drink 100 liters total', category: 'hydration', tier: 'silver', icon: 'water', criteria: { type: 'total_water', value: 100000 } },
  { id: 'water_vol_500L', name: 'River Drinker', description: 'Drink 500 liters total', category: 'hydration', tier: 'gold', icon: 'water', criteria: { type: 'total_water', value: 500000 } },
  { id: 'water_vol_1000L', name: 'Water God', description: 'Drink 1,000 liters total', category: 'hydration', tier: 'diamond', icon: 'water', criteria: { type: 'total_water', value: 1000000 } },

  // ============ WEIGHT LOGGING ============
  { id: 'weight_1', name: 'Scale Starter', description: 'Log your weight for the first time', category: 'milestone', tier: 'bronze', icon: 'scale', criteria: { type: 'weight_log_count', value: 1 } },
  { id: 'weight_7', name: 'Weekly Weigh-in', description: 'Log weight 7 times', category: 'milestone', tier: 'bronze', icon: 'scale', criteria: { type: 'weight_log_count', value: 7 } },
  { id: 'weight_30', name: 'Monthly Monitor', description: 'Log weight 30 times', category: 'milestone', tier: 'silver', icon: 'scale', criteria: { type: 'weight_log_count', value: 30 } },
  { id: 'weight_90', name: 'Quarterly Tracker', description: 'Log weight 90 times', category: 'milestone', tier: 'gold', icon: 'scale', criteria: { type: 'weight_log_count', value: 90 } },
  { id: 'weight_365', name: 'Year-long Journey', description: 'Log weight 365 times', category: 'milestone', tier: 'diamond', icon: 'scale', criteria: { type: 'weight_log_count', value: 365 } },

  // ============ SINGLE SESSION RECORDS ============
  { id: 'session_cal_500', name: 'Big Meal', description: 'Log 500+ calories in a single food entry', category: 'nutrition', tier: 'bronze', icon: 'flame', criteria: { type: 'single_food_calories', value: 500 } },
  { id: 'session_cal_1000', name: 'Feast Mode', description: 'Log 1,000+ calories in a single food entry', category: 'nutrition', tier: 'silver', icon: 'flame', criteria: { type: 'single_food_calories', value: 1000 } },
  { id: 'session_cal_1500', name: 'Cheat Day King', description: 'Log 1,500+ calories in a single food entry', category: 'nutrition', tier: 'gold', icon: 'flame', criteria: { type: 'single_food_calories', value: 1500 } },
  { id: 'session_vol_1000', name: 'Volume Day', description: 'Lift 1,000kg in a single workout', category: 'strength', tier: 'bronze', icon: 'barbell', criteria: { type: 'single_workout_volume', value: 1000 } },
  { id: 'session_vol_2500', name: 'Heavy Hitter', description: 'Lift 2,500kg in a single workout', category: 'strength', tier: 'silver', icon: 'barbell', criteria: { type: 'single_workout_volume', value: 2500 } },
  { id: 'session_vol_5000', name: 'Beast Mode', description: 'Lift 5,000kg in a single workout', category: 'strength', tier: 'gold', icon: 'flash', criteria: { type: 'single_workout_volume', value: 5000 } },
  { id: 'session_vol_10000', name: 'Superhuman', description: 'Lift 10,000kg in a single workout', category: 'strength', tier: 'diamond', icon: 'flash', criteria: { type: 'single_workout_volume', value: 10000 } },
  { id: 'session_water_2L', name: 'Well Hydrated', description: 'Drink 2L water in a single day', category: 'hydration', tier: 'bronze', icon: 'water', criteria: { type: 'daily_water', value: 2000 } },
  { id: 'session_water_3L', name: 'Hydration Champion', description: 'Drink 3L water in a single day', category: 'hydration', tier: 'silver', icon: 'water', criteria: { type: 'daily_water', value: 3000 } },
  { id: 'session_water_4L', name: 'Aqua Warrior', description: 'Drink 4L water in a single day', category: 'hydration', tier: 'gold', icon: 'water', criteria: { type: 'daily_water', value: 4000 } },
  { id: 'session_water_5L', name: 'Water Olympian', description: 'Drink 5L water in a single day', category: 'hydration', tier: 'diamond', icon: 'water', criteria: { type: 'daily_water', value: 5000 } },

  // ============ PROTEIN SINGLE DAY ============
  { id: 'daily_protein_100', name: 'Protein Day', description: 'Eat 100g protein in a day', category: 'nutrition', tier: 'bronze', icon: 'nutrition', criteria: { type: 'daily_protein', value: 100 } },
  { id: 'daily_protein_150', name: 'High Protein', description: 'Eat 150g protein in a day', category: 'nutrition', tier: 'silver', icon: 'nutrition', criteria: { type: 'daily_protein', value: 150 } },
  { id: 'daily_protein_200', name: 'Protein Monster', description: 'Eat 200g protein in a day', category: 'nutrition', tier: 'gold', icon: 'nutrition', criteria: { type: 'daily_protein', value: 200 } },
  { id: 'daily_protein_250', name: 'Amino Overload', description: 'Eat 250g protein in a day', category: 'nutrition', tier: 'diamond', icon: 'nutrition', criteria: { type: 'daily_protein', value: 250 } },

  // ============ EXPLORER (exercise variety) ============
  { id: 'exercises_5', name: 'Explorer', description: 'Use 5 different exercises', category: 'explorer', tier: 'bronze', icon: 'compass', criteria: { type: 'unique_exercises', value: 5 } },
  { id: 'exercises_10', name: 'Adventurer', description: 'Use 10 different exercises', category: 'explorer', tier: 'bronze', icon: 'compass', criteria: { type: 'unique_exercises', value: 10 } },
  { id: 'exercises_25', name: 'Exercise Collector', description: 'Use 25 different exercises', category: 'explorer', tier: 'silver', icon: 'compass', criteria: { type: 'unique_exercises', value: 25 } },
  { id: 'exercises_50', name: 'Movement Master', description: 'Use 50 different exercises', category: 'explorer', tier: 'gold', icon: 'compass', criteria: { type: 'unique_exercises', value: 50 } },
  { id: 'exercises_100', name: 'Exercise Encyclopedia', description: 'Use 100 different exercises', category: 'explorer', tier: 'diamond', icon: 'compass', criteria: { type: 'unique_exercises', value: 100 } },

  // ============ MEAL TYPES ============
  { id: 'meal_breakfast_10', name: 'Breakfast Club', description: 'Log 10 breakfasts', category: 'nutrition', tier: 'bronze', icon: 'sunny', criteria: { type: 'meal_type_count', value: 10, meal_type: 'breakfast' } },
  { id: 'meal_lunch_10', name: 'Lunch Regular', description: 'Log 10 lunches', category: 'nutrition', tier: 'bronze', icon: 'partly-sunny', criteria: { type: 'meal_type_count', value: 10, meal_type: 'lunch' } },
  { id: 'meal_dinner_10', name: 'Dinner Regular', description: 'Log 10 dinners', category: 'nutrition', tier: 'bronze', icon: 'moon', criteria: { type: 'meal_type_count', value: 10, meal_type: 'dinner' } },
  { id: 'meal_snack_10', name: 'Snack Attack', description: 'Log 10 snacks', category: 'nutrition', tier: 'bronze', icon: 'cafe', criteria: { type: 'meal_type_count', value: 10, meal_type: 'snack' } },
  { id: 'meal_breakfast_50', name: 'Morning Person', description: 'Log 50 breakfasts', category: 'nutrition', tier: 'silver', icon: 'sunny', criteria: { type: 'meal_type_count', value: 50, meal_type: 'breakfast' } },
  { id: 'meal_lunch_50', name: 'Lunch Legend', description: 'Log 50 lunches', category: 'nutrition', tier: 'silver', icon: 'partly-sunny', criteria: { type: 'meal_type_count', value: 50, meal_type: 'lunch' } },
  { id: 'meal_dinner_50', name: 'Dinner Champion', description: 'Log 50 dinners', category: 'nutrition', tier: 'silver', icon: 'moon', criteria: { type: 'meal_type_count', value: 50, meal_type: 'dinner' } },
  { id: 'meal_snack_50', name: 'Snack Master', description: 'Log 50 snacks', category: 'nutrition', tier: 'silver', icon: 'cafe', criteria: { type: 'meal_type_count', value: 50, meal_type: 'snack' } },

  // ============ MUSCLE GROUPS ============
  { id: 'muscle_chest_10', name: 'Chest Day', description: 'Log 10 chest workouts', category: 'strength', tier: 'bronze', icon: 'body', criteria: { type: 'muscle_workout_count', value: 10, muscle: 'Chest' } },
  { id: 'muscle_back_10', name: 'Back Builder', description: 'Log 10 back workouts', category: 'strength', tier: 'bronze', icon: 'body', criteria: { type: 'muscle_workout_count', value: 10, muscle: 'Back' } },
  { id: 'muscle_legs_10', name: 'Leg Day Warrior', description: 'Log 10 leg workouts', category: 'strength', tier: 'bronze', icon: 'body', criteria: { type: 'muscle_workout_count', value: 10, muscle: 'Quads' } },
  { id: 'muscle_shoulders_10', name: 'Boulder Shoulders', description: 'Log 10 shoulder workouts', category: 'strength', tier: 'bronze', icon: 'body', criteria: { type: 'muscle_workout_count', value: 10, muscle: 'Shoulders' } },
  { id: 'muscle_arms_10', name: 'Arm Day', description: 'Log 10 bicep workouts', category: 'strength', tier: 'bronze', icon: 'body', criteria: { type: 'muscle_workout_count', value: 10, muscle: 'Biceps' } },
  { id: 'muscle_chest_50', name: 'Chest Specialist', description: 'Log 50 chest workouts', category: 'strength', tier: 'silver', icon: 'body', criteria: { type: 'muscle_workout_count', value: 50, muscle: 'Chest' } },
  { id: 'muscle_back_50', name: 'Back Specialist', description: 'Log 50 back workouts', category: 'strength', tier: 'silver', icon: 'body', criteria: { type: 'muscle_workout_count', value: 50, muscle: 'Back' } },
  { id: 'muscle_legs_50', name: 'Leg Specialist', description: 'Log 50 leg workouts', category: 'strength', tier: 'silver', icon: 'body', criteria: { type: 'muscle_workout_count', value: 50, muscle: 'Quads' } },

  // ============ AI USAGE ============
  { id: 'ai_food_1', name: 'AI Assisted', description: 'Use AI to analyze a food item', category: 'explorer', tier: 'bronze', icon: 'sparkles', criteria: { type: 'ai_food_count', value: 1 } },
  { id: 'ai_food_10', name: 'AI Foodie', description: 'Use AI to analyze 10 food items', category: 'explorer', tier: 'silver', icon: 'sparkles', criteria: { type: 'ai_food_count', value: 10 } },
  { id: 'ai_food_25', name: 'AI Gourmet', description: 'Use AI to analyze 25 food items', category: 'explorer', tier: 'gold', icon: 'sparkles', criteria: { type: 'ai_food_count', value: 25 } },
  { id: 'ai_food_50', name: 'AI Nutrition Expert', description: 'Use AI to analyze 50 food items', category: 'explorer', tier: 'gold', icon: 'sparkles', criteria: { type: 'ai_food_count', value: 50 } },
  { id: 'ai_food_100', name: 'AI Food Scientist', description: 'Use AI to analyze 100 food items', category: 'explorer', tier: 'diamond', icon: 'sparkles', criteria: { type: 'ai_food_count', value: 100 } },
  { id: 'ai_workout_1', name: 'Smart Training', description: 'Use AI to parse a workout', category: 'explorer', tier: 'bronze', icon: 'sparkles', criteria: { type: 'ai_workout_count', value: 1 } },
  { id: 'ai_workout_10', name: 'AI Coach Regular', description: 'Use AI to parse 10 workouts', category: 'explorer', tier: 'silver', icon: 'sparkles', criteria: { type: 'ai_workout_count', value: 10 } },
  { id: 'ai_workout_25', name: 'AI Training Partner', description: 'Use AI to parse 25 workouts', category: 'explorer', tier: 'gold', icon: 'sparkles', criteria: { type: 'ai_workout_count', value: 25 } },
  { id: 'ai_workout_50', name: 'AI Powered Athlete', description: 'Use AI to parse 50 workouts', category: 'explorer', tier: 'diamond', icon: 'sparkles', criteria: { type: 'ai_workout_count', value: 50 } },

  // ============ MULTI-DAY STREAKS (by day count) ============
  { id: 'streak_3', name: '3-Day Streak', description: 'Log something 3 days in a row', category: 'consistency', tier: 'bronze', icon: 'flame', criteria: { type: 'logging_streak', value: 3 } },
  { id: 'streak_5', name: '5-Day Streak', description: 'Log something 5 days in a row', category: 'consistency', tier: 'bronze', icon: 'flame', criteria: { type: 'logging_streak', value: 5 } },
  { id: 'streak_7', name: 'Week Warrior', description: 'Log something 7 days in a row', category: 'consistency', tier: 'silver', icon: 'flame', criteria: { type: 'logging_streak', value: 7 } },
  { id: 'streak_10', name: '10-Day Fire', description: 'Log something 10 days in a row', category: 'consistency', tier: 'silver', icon: 'flame', criteria: { type: 'logging_streak', value: 10 } },
  { id: 'streak_14', name: 'Fortnight Focus', description: 'Log something 14 days in a row', category: 'consistency', tier: 'silver', icon: 'flame', criteria: { type: 'logging_streak', value: 14 } },
  { id: 'streak_21', name: 'Habit Formed', description: 'Log something 21 days in a row', category: 'consistency', tier: 'gold', icon: 'flame', criteria: { type: 'logging_streak', value: 21 } },
  { id: 'streak_30', name: 'Monthly Machine', description: 'Log something 30 days in a row', category: 'consistency', tier: 'gold', icon: 'flame', criteria: { type: 'logging_streak', value: 30 } },
  { id: 'streak_45', name: '45-Day Blaze', description: 'Log something 45 days in a row', category: 'consistency', tier: 'gold', icon: 'flame', criteria: { type: 'logging_streak', value: 45 } },
  { id: 'streak_60', name: 'Two-Month Titan', description: 'Log something 60 days in a row', category: 'consistency', tier: 'gold', icon: 'flame', criteria: { type: 'logging_streak', value: 60 } },
  { id: 'streak_90', name: 'Quarter Year', description: 'Log something 90 days in a row', category: 'consistency', tier: 'diamond', icon: 'flame', criteria: { type: 'logging_streak', value: 90 } },
  { id: 'streak_120', name: 'Four Months Strong', description: 'Log something 120 days in a row', category: 'consistency', tier: 'diamond', icon: 'flame', criteria: { type: 'logging_streak', value: 120 } },
  { id: 'streak_180', name: 'Half Year Hero', description: 'Log something 180 days in a row', category: 'consistency', tier: 'diamond', icon: 'flame', criteria: { type: 'logging_streak', value: 180 } },
  { id: 'streak_270', name: 'Nine Months', description: 'Log something 270 days in a row', category: 'consistency', tier: 'diamond', icon: 'trophy', criteria: { type: 'logging_streak', value: 270 } },
  { id: 'streak_365', name: 'Year of Dedication', description: 'Log something 365 days in a row', category: 'consistency', tier: 'diamond', icon: 'trophy', criteria: { type: 'logging_streak', value: 365 } },

  // ============ WORKOUT STREAKS ============
  { id: 'gym_streak_3', name: 'Gym Streak 3', description: 'Work out 3 days in a row', category: 'strength', tier: 'bronze', icon: 'barbell', criteria: { type: 'workout_streak', value: 3 } },
  { id: 'gym_streak_5', name: 'Gym Streak 5', description: 'Work out 5 days in a row', category: 'strength', tier: 'silver', icon: 'barbell', criteria: { type: 'workout_streak', value: 5 } },
  { id: 'gym_streak_7', name: 'Full Week Gym', description: 'Work out 7 days in a row', category: 'strength', tier: 'gold', icon: 'barbell', criteria: { type: 'workout_streak', value: 7 } },
  { id: 'gym_streak_10', name: '10 Day Beast', description: 'Work out 10 days in a row', category: 'strength', tier: 'gold', icon: 'barbell', criteria: { type: 'workout_streak', value: 10 } },
  { id: 'gym_streak_14', name: 'Iron Fortnight', description: 'Work out 14 days in a row', category: 'strength', tier: 'diamond', icon: 'barbell', criteria: { type: 'workout_streak', value: 14 } },
  { id: 'gym_streak_21', name: 'Three Week Warrior', description: 'Work out 21 days in a row', category: 'strength', tier: 'diamond', icon: 'trophy', criteria: { type: 'workout_streak', value: 21 } },
  { id: 'gym_streak_30', name: 'Monthly Madness', description: 'Work out 30 days in a row', category: 'strength', tier: 'diamond', icon: 'trophy', criteria: { type: 'workout_streak', value: 30 } },

  // ============ MORE MUSCLE GROUPS ============
  { id: 'muscle_triceps_10', name: 'Tricep Thunder', description: 'Log 10 tricep workouts', category: 'strength', tier: 'bronze', icon: 'body', criteria: { type: 'muscle_workout_count', value: 10, muscle: 'Triceps' } },
  { id: 'muscle_abs_10', name: 'Core Crusher', description: 'Log 10 ab workouts', category: 'strength', tier: 'bronze', icon: 'body', criteria: { type: 'muscle_workout_count', value: 10, muscle: 'Abs' } },
  { id: 'muscle_glutes_10', name: 'Glute Grinder', description: 'Log 10 glute workouts', category: 'strength', tier: 'bronze', icon: 'body', criteria: { type: 'muscle_workout_count', value: 10, muscle: 'Glutes' } },
  { id: 'muscle_calves_10', name: 'Calf Crusher', description: 'Log 10 calf workouts', category: 'strength', tier: 'bronze', icon: 'body', criteria: { type: 'muscle_workout_count', value: 10, muscle: 'Calves' } },
  { id: 'muscle_traps_10', name: 'Trap King', description: 'Log 10 trap workouts', category: 'strength', tier: 'bronze', icon: 'body', criteria: { type: 'muscle_workout_count', value: 10, muscle: 'Traps' } },
  { id: 'muscle_forearms_10', name: 'Grip Strength', description: 'Log 10 forearm workouts', category: 'strength', tier: 'bronze', icon: 'body', criteria: { type: 'muscle_workout_count', value: 10, muscle: 'Forearms' } },
  { id: 'muscle_hamstrings_10', name: 'Hamstring Hero', description: 'Log 10 hamstring workouts', category: 'strength', tier: 'bronze', icon: 'body', criteria: { type: 'muscle_workout_count', value: 10, muscle: 'Hamstrings' } },
  { id: 'muscle_triceps_50', name: 'Tricep Titan', description: 'Log 50 tricep workouts', category: 'strength', tier: 'silver', icon: 'body', criteria: { type: 'muscle_workout_count', value: 50, muscle: 'Triceps' } },
  { id: 'muscle_abs_50', name: 'Six Pack Loading', description: 'Log 50 ab workouts', category: 'strength', tier: 'silver', icon: 'body', criteria: { type: 'muscle_workout_count', value: 50, muscle: 'Abs' } },
  { id: 'muscle_glutes_50', name: 'Glute God', description: 'Log 50 glute workouts', category: 'strength', tier: 'silver', icon: 'body', criteria: { type: 'muscle_workout_count', value: 50, muscle: 'Glutes' } },
  { id: 'muscle_chest_100', name: 'Chest Champion', description: 'Log 100 chest workouts', category: 'strength', tier: 'gold', icon: 'body', criteria: { type: 'muscle_workout_count', value: 100, muscle: 'Chest' } },
  { id: 'muscle_back_100', name: 'Back Beast', description: 'Log 100 back workouts', category: 'strength', tier: 'gold', icon: 'body', criteria: { type: 'muscle_workout_count', value: 100, muscle: 'Back' } },
  { id: 'muscle_legs_100', name: 'Leg Legend', description: 'Log 100 leg workouts', category: 'strength', tier: 'gold', icon: 'body', criteria: { type: 'muscle_workout_count', value: 100, muscle: 'Quads' } },
  { id: 'muscle_shoulders_100', name: 'Shoulder Savant', description: 'Log 100 shoulder workouts', category: 'strength', tier: 'gold', icon: 'body', criteria: { type: 'muscle_workout_count', value: 100, muscle: 'Shoulders' } },
  { id: 'muscle_arms_100', name: 'Arm Army', description: 'Log 100 bicep workouts', category: 'strength', tier: 'gold', icon: 'body', criteria: { type: 'muscle_workout_count', value: 100, muscle: 'Biceps' } },

  // ============ MORE MEAL ACHIEVEMENTS ============
  { id: 'meal_breakfast_100', name: 'Breakfast Legend', description: 'Log 100 breakfasts', category: 'nutrition', tier: 'gold', icon: 'sunny', criteria: { type: 'meal_type_count', value: 100, meal_type: 'breakfast' } },
  { id: 'meal_lunch_100', name: 'Lunch Lord', description: 'Log 100 lunches', category: 'nutrition', tier: 'gold', icon: 'partly-sunny', criteria: { type: 'meal_type_count', value: 100, meal_type: 'lunch' } },
  { id: 'meal_dinner_100', name: 'Dinner Dynasty', description: 'Log 100 dinners', category: 'nutrition', tier: 'gold', icon: 'moon', criteria: { type: 'meal_type_count', value: 100, meal_type: 'dinner' } },
  { id: 'meal_snack_100', name: 'Snack Supreme', description: 'Log 100 snacks', category: 'nutrition', tier: 'gold', icon: 'cafe', criteria: { type: 'meal_type_count', value: 100, meal_type: 'snack' } },
  { id: 'meal_breakfast_250', name: 'Rise & Grind', description: 'Log 250 breakfasts', category: 'nutrition', tier: 'diamond', icon: 'sunny', criteria: { type: 'meal_type_count', value: 250, meal_type: 'breakfast' } },
  { id: 'meal_dinner_250', name: 'Dinner Deity', description: 'Log 250 dinners', category: 'nutrition', tier: 'diamond', icon: 'moon', criteria: { type: 'meal_type_count', value: 250, meal_type: 'dinner' } },

  // ============ MORE CALORIE MILESTONES ============
  { id: 'cal_2500', name: 'Two & a Half', description: 'Log 2,500 total calories', category: 'nutrition', tier: 'bronze', icon: 'flame', criteria: { type: 'total_calories', value: 2500 } },
  { id: 'cal_25000', name: '25K Fuel', description: 'Log 25,000 total calories', category: 'nutrition', tier: 'silver', icon: 'flame', criteria: { type: 'total_calories', value: 25000 } },
  { id: 'cal_250000', name: 'Quarter Million', description: 'Log 250,000 total calories', category: 'nutrition', tier: 'gold', icon: 'flame', criteria: { type: 'total_calories', value: 250000 } },
  { id: 'cal_2000000', name: 'Double Million', description: 'Log 2,000,000 total calories', category: 'nutrition', tier: 'diamond', icon: 'trophy', criteria: { type: 'total_calories', value: 2000000 } },

  // ============ MORE VOLUME MILESTONES ============
  { id: 'volume_2500', name: '2.5 Ton Force', description: 'Lift 2,500kg total volume', category: 'volume', tier: 'silver', icon: 'barbell', criteria: { type: 'total_volume', value: 2500 } },
  { id: 'volume_75000', name: 'Iron Giant', description: 'Lift 75,000kg total volume', category: 'volume', tier: 'diamond', icon: 'flash', criteria: { type: 'total_volume', value: 75000 } },
  { id: 'volume_200000', name: 'Mythical Lifter', description: 'Lift 200,000kg total volume', category: 'volume', tier: 'diamond', icon: 'trophy', criteria: { type: 'total_volume', value: 200000 } },
  { id: 'volume_500000', name: 'Demigod', description: 'Lift 500,000kg total volume', category: 'volume', tier: 'diamond', icon: 'trophy', criteria: { type: 'total_volume', value: 500000 } },

  // ============ FOOD VARIETY ============
  { id: 'food_15', name: 'Getting Hooked', description: 'Log 15 food entries', category: 'consistency', tier: 'bronze', icon: 'nutrition', criteria: { type: 'food_count', value: 15 } },
  { id: 'food_75', name: 'Food Journal Pro', description: 'Log 75 food entries', category: 'consistency', tier: 'silver', icon: 'nutrition', criteria: { type: 'food_count', value: 75 } },
  { id: 'food_150', name: 'Dedicated Dieter', description: 'Log 150 food entries', category: 'consistency', tier: 'gold', icon: 'restaurant', criteria: { type: 'food_count', value: 150 } },
  { id: 'food_350', name: 'Food Historian', description: 'Log 350 food entries', category: 'consistency', tier: 'gold', icon: 'restaurant', criteria: { type: 'food_count', value: 350 } },
  { id: 'food_750', name: 'Calorie Encyclopedia', description: 'Log 750 food entries', category: 'consistency', tier: 'diamond', icon: 'star', criteria: { type: 'food_count', value: 750 } },
  { id: 'food_2000', name: 'Two Thousand Meals', description: 'Log 2,000 food entries', category: 'consistency', tier: 'diamond', icon: 'trophy', criteria: { type: 'food_count', value: 2000 } },

  // ============ MORE WORKOUT COUNTS ============
  { id: 'workout_3', name: 'Hat Trick', description: 'Complete 3 workouts', category: 'strength', tier: 'bronze', icon: 'barbell', criteria: { type: 'workout_count', value: 3 } },
  { id: 'workout_15', name: 'Getting Serious', description: 'Complete 15 workouts', category: 'strength', tier: 'bronze', icon: 'barbell', criteria: { type: 'workout_count', value: 15 } },
  { id: 'workout_75', name: 'Gym Rat', description: 'Complete 75 workouts', category: 'strength', tier: 'silver', icon: 'fitness', criteria: { type: 'workout_count', value: 75 } },
  { id: 'workout_150', name: 'Iron Addict', description: 'Complete 150 workouts', category: 'strength', tier: 'gold', icon: 'fitness', criteria: { type: 'workout_count', value: 150 } },
  { id: 'workout_300', name: 'Spartan', description: 'Complete 300 workouts', category: 'strength', tier: 'gold', icon: 'shield', criteria: { type: 'workout_count', value: 300 } },
  { id: 'workout_750', name: 'Gym Legend', description: 'Complete 750 workouts', category: 'strength', tier: 'diamond', icon: 'ribbon', criteria: { type: 'workout_count', value: 750 } },
  { id: 'workout_1000', name: 'Thousand Sessions', description: 'Complete 1000 workouts', category: 'strength', tier: 'diamond', icon: 'trophy', criteria: { type: 'workout_count', value: 1000 } },

  // ============ MORE WATER COUNTS ============
  { id: 'water_5', name: 'H2O Novice', description: 'Log water 5 times', category: 'hydration', tier: 'bronze', icon: 'water', criteria: { type: 'water_count', value: 5 } },
  { id: 'water_75', name: 'Water Devotee', description: 'Log water 75 times', category: 'hydration', tier: 'silver', icon: 'water', criteria: { type: 'water_count', value: 75 } },
  { id: 'water_150', name: 'Hydration Expert', description: 'Log water 150 times', category: 'hydration', tier: 'gold', icon: 'water', criteria: { type: 'water_count', value: 150 } },
  { id: 'water_350', name: 'Water Sage', description: 'Log water 350 times', category: 'hydration', tier: 'gold', icon: 'water', criteria: { type: 'water_count', value: 350 } },
  { id: 'water_750', name: 'Hydration Legend', description: 'Log water 750 times', category: 'hydration', tier: 'diamond', icon: 'water', criteria: { type: 'water_count', value: 750 } },
  { id: 'water_1000', name: 'Thousand Sips', description: 'Log water 1000 times', category: 'hydration', tier: 'diamond', icon: 'trophy', criteria: { type: 'water_count', value: 1000 } },

  // ============ PROTEIN MILESTONES ============
  { id: 'protein_250', name: 'Protein Enthusiast', description: 'Log 250g total protein', category: 'nutrition', tier: 'bronze', icon: 'nutrition', criteria: { type: 'total_protein', value: 250 } },
  { id: 'protein_2500', name: 'Protein Addict', description: 'Log 2,500g total protein', category: 'nutrition', tier: 'silver', icon: 'nutrition', criteria: { type: 'total_protein', value: 2500 } },
  { id: 'protein_7500', name: 'Amino Commander', description: 'Log 7,500g total protein', category: 'nutrition', tier: 'gold', icon: 'nutrition', criteria: { type: 'total_protein', value: 7500 } },
  { id: 'protein_25000', name: 'Protein Emperor', description: 'Log 25,000g total protein', category: 'nutrition', tier: 'diamond', icon: 'nutrition', criteria: { type: 'total_protein', value: 25000 } },
  { id: 'protein_100000', name: 'Protein God', description: 'Log 100,000g total protein', category: 'nutrition', tier: 'diamond', icon: 'trophy', criteria: { type: 'total_protein', value: 100000 } },

  // ============ WEIGHT LOGGING EXTENDED ============
  { id: 'weight_14', name: 'Biweekly Tracker', description: 'Log weight 14 times', category: 'milestone', tier: 'bronze', icon: 'scale', criteria: { type: 'weight_log_count', value: 14 } },
  { id: 'weight_60', name: 'Two Month Watch', description: 'Log weight 60 times', category: 'milestone', tier: 'silver', icon: 'scale', criteria: { type: 'weight_log_count', value: 60 } },
  { id: 'weight_180', name: 'Half Year Scale', description: 'Log weight 180 times', category: 'milestone', tier: 'gold', icon: 'scale', criteria: { type: 'weight_log_count', value: 180 } },
  { id: 'weight_500', name: 'Scale Sage', description: 'Log weight 500 times', category: 'milestone', tier: 'diamond', icon: 'scale', criteria: { type: 'weight_log_count', value: 500 } },

  // ============ DAILY RECORDS EXTENDED ============
  { id: 'session_cal_750', name: 'Hearty Meal', description: 'Log 750+ calories in a single food entry', category: 'nutrition', tier: 'bronze', icon: 'flame', criteria: { type: 'single_food_calories', value: 750 } },
  { id: 'session_cal_2000', name: 'Epic Feast', description: 'Log 2,000+ calories in a single food entry', category: 'nutrition', tier: 'diamond', icon: 'flame', criteria: { type: 'single_food_calories', value: 2000 } },
  { id: 'session_vol_7500', name: 'Tank Mode', description: 'Lift 7,500kg in a single workout', category: 'strength', tier: 'gold', icon: 'flash', criteria: { type: 'single_workout_volume', value: 7500 } },
  { id: 'session_vol_15000', name: 'Godlike Session', description: 'Lift 15,000kg in a single workout', category: 'strength', tier: 'diamond', icon: 'flash', criteria: { type: 'single_workout_volume', value: 15000 } },
  { id: 'session_vol_20000', name: 'Olympian', description: 'Lift 20,000kg in a single workout', category: 'strength', tier: 'diamond', icon: 'trophy', criteria: { type: 'single_workout_volume', value: 20000 } },

  // ============ MORE WATER VOLUME ============
  { id: 'water_vol_5L', name: 'Five Liters', description: 'Drink 5 liters total', category: 'hydration', tier: 'bronze', icon: 'water', criteria: { type: 'total_water', value: 5000 } },
  { id: 'water_vol_25L', name: 'Twenty Five Liters', description: 'Drink 25 liters total', category: 'hydration', tier: 'silver', icon: 'water', criteria: { type: 'total_water', value: 25000 } },
  { id: 'water_vol_200L', name: 'Two Hundred Liters', description: 'Drink 200 liters total', category: 'hydration', tier: 'gold', icon: 'water', criteria: { type: 'total_water', value: 200000 } },
  { id: 'water_vol_750L', name: 'Lake Drinker', description: 'Drink 750 liters total', category: 'hydration', tier: 'diamond', icon: 'water', criteria: { type: 'total_water', value: 750000 } },

  // ============ EXPLORER EXTENDED ============
  { id: 'exercises_3', name: 'Toe Dipper', description: 'Use 3 different exercises', category: 'explorer', tier: 'bronze', icon: 'compass', criteria: { type: 'unique_exercises', value: 3 } },
  { id: 'exercises_15', name: 'Curious Lifter', description: 'Use 15 different exercises', category: 'explorer', tier: 'bronze', icon: 'compass', criteria: { type: 'unique_exercises', value: 15 } },
  { id: 'exercises_35', name: 'Variety Seeker', description: 'Use 35 different exercises', category: 'explorer', tier: 'silver', icon: 'compass', criteria: { type: 'unique_exercises', value: 35 } },
  { id: 'exercises_75', name: 'Exercise Guru', description: 'Use 75 different exercises', category: 'explorer', tier: 'gold', icon: 'compass', criteria: { type: 'unique_exercises', value: 75 } },
  { id: 'exercises_150', name: 'Movement Library', description: 'Use 150 different exercises', category: 'explorer', tier: 'diamond', icon: 'compass', criteria: { type: 'unique_exercises', value: 150 } },

  // ============ SOCIAL ============
  { id: 'profile_complete', name: 'Profile Complete', description: 'Complete your full profile', category: 'social', tier: 'bronze', icon: 'person', criteria: { type: 'profile_complete', value: 1 } },
  { id: 'split_created', name: 'Split Creator', description: 'Create your first workout split', category: 'social', tier: 'bronze', icon: 'calendar', criteria: { type: 'split_created', value: 1 } },
  { id: 'onboarding_done', name: 'Welcome Aboard', description: 'Complete the onboarding process', category: 'social', tier: 'bronze', icon: 'checkmark-circle', criteria: { type: 'onboarding_complete', value: 1 } },

  // ============ TOTAL DAYS LOGGED ============
  { id: 'days_logged_3', name: 'Three Days In', description: 'Log something on 3 different days', category: 'consistency', tier: 'bronze', icon: 'calendar', criteria: { type: 'total_days_logged', value: 3 } },
  { id: 'days_logged_7', name: 'First Week Done', description: 'Log something on 7 different days', category: 'consistency', tier: 'bronze', icon: 'calendar', criteria: { type: 'total_days_logged', value: 7 } },
  { id: 'days_logged_14', name: 'Two Weeks Active', description: 'Log something on 14 different days', category: 'consistency', tier: 'bronze', icon: 'calendar', criteria: { type: 'total_days_logged', value: 14 } },
  { id: 'days_logged_30', name: 'Monthly Tracker', description: 'Log something on 30 different days', category: 'consistency', tier: 'silver', icon: 'calendar', criteria: { type: 'total_days_logged', value: 30 } },
  { id: 'days_logged_60', name: 'Two Month Veteran', description: 'Log something on 60 different days', category: 'consistency', tier: 'silver', icon: 'calendar', criteria: { type: 'total_days_logged', value: 60 } },
  { id: 'days_logged_90', name: 'Quarter Year Active', description: 'Log something on 90 different days', category: 'consistency', tier: 'gold', icon: 'calendar', criteria: { type: 'total_days_logged', value: 90 } },
  { id: 'days_logged_180', name: 'Half Year Dedication', description: 'Log something on 180 different days', category: 'consistency', tier: 'gold', icon: 'calendar', criteria: { type: 'total_days_logged', value: 180 } },
  { id: 'days_logged_365', name: 'Full Year Logger', description: 'Log something on 365 different days', category: 'consistency', tier: 'diamond', icon: 'trophy', criteria: { type: 'total_days_logged', value: 365 } },
  { id: 'days_logged_500', name: '500 Days Strong', description: 'Log something on 500 different days', category: 'consistency', tier: 'diamond', icon: 'trophy', criteria: { type: 'total_days_logged', value: 500 } },
  { id: 'days_logged_730', name: 'Two Year Journey', description: 'Log something on 730 different days', category: 'consistency', tier: 'diamond', icon: 'trophy', criteria: { type: 'total_days_logged', value: 730 } },

  // ============ WORKOUT DAYS (unique days with workouts) ============
  { id: 'gym_days_5', name: 'Five Gym Days', description: 'Work out on 5 different days', category: 'strength', tier: 'bronze', icon: 'barbell', criteria: { type: 'total_workout_days', value: 5 } },
  { id: 'gym_days_15', name: 'Fifteen Gym Days', description: 'Work out on 15 different days', category: 'strength', tier: 'bronze', icon: 'barbell', criteria: { type: 'total_workout_days', value: 15 } },
  { id: 'gym_days_30', name: 'Monthly Gym Goer', description: 'Work out on 30 different days', category: 'strength', tier: 'silver', icon: 'barbell', criteria: { type: 'total_workout_days', value: 30 } },
  { id: 'gym_days_60', name: 'Sixty Training Days', description: 'Work out on 60 different days', category: 'strength', tier: 'silver', icon: 'fitness', criteria: { type: 'total_workout_days', value: 60 } },
  { id: 'gym_days_100', name: 'Century Days', description: 'Work out on 100 different days', category: 'strength', tier: 'gold', icon: 'fitness', criteria: { type: 'total_workout_days', value: 100 } },
  { id: 'gym_days_200', name: '200 Days of Iron', description: 'Work out on 200 different days', category: 'strength', tier: 'gold', icon: 'shield', criteria: { type: 'total_workout_days', value: 200 } },
  { id: 'gym_days_365', name: 'Year of Training', description: 'Work out on 365 different days', category: 'strength', tier: 'diamond', icon: 'trophy', criteria: { type: 'total_workout_days', value: 365 } },

  // ============ PERFECT DAYS (hit calories + protein + water) ============
  { id: 'perfect_day_1', name: 'Perfect Day', description: 'Hit all macros & water in one day', category: 'consistency', tier: 'bronze', icon: 'checkmark-done', criteria: { type: 'perfect_days', value: 1 } },
  { id: 'perfect_day_3', name: 'Triple Threat', description: 'Have 3 perfect days', category: 'consistency', tier: 'bronze', icon: 'checkmark-done', criteria: { type: 'perfect_days', value: 3 } },
  { id: 'perfect_day_7', name: 'Perfect Week', description: 'Have 7 perfect days', category: 'consistency', tier: 'silver', icon: 'checkmark-done', criteria: { type: 'perfect_days', value: 7 } },
  { id: 'perfect_day_14', name: 'Two Weeks Flawless', description: 'Have 14 perfect days', category: 'consistency', tier: 'silver', icon: 'checkmark-done', criteria: { type: 'perfect_days', value: 14 } },
  { id: 'perfect_day_30', name: 'Perfect Month', description: 'Have 30 perfect days', category: 'consistency', tier: 'gold', icon: 'checkmark-done', criteria: { type: 'perfect_days', value: 30 } },
  { id: 'perfect_day_60', name: 'Discipline Master', description: 'Have 60 perfect days', category: 'consistency', tier: 'gold', icon: 'checkmark-done', criteria: { type: 'perfect_days', value: 60 } },
  { id: 'perfect_day_100', name: 'Century of Perfection', description: 'Have 100 perfect days', category: 'consistency', tier: 'diamond', icon: 'trophy', criteria: { type: 'perfect_days', value: 100 } },
  { id: 'perfect_day_200', name: 'Perfection Incarnate', description: 'Have 200 perfect days', category: 'consistency', tier: 'diamond', icon: 'trophy', criteria: { type: 'perfect_days', value: 200 } },

  // ============ MAX WEIGHT LIFTED (heaviest single set) ============
  { id: 'max_weight_40', name: 'Novice Lifter', description: 'Lift 40kg+ in a single set', category: 'strength', tier: 'bronze', icon: 'barbell', criteria: { type: 'max_weight_lifted', value: 40 } },
  { id: 'max_weight_60', name: 'Getting Stronger', description: 'Lift 60kg+ in a single set', category: 'strength', tier: 'bronze', icon: 'barbell', criteria: { type: 'max_weight_lifted', value: 60 } },
  { id: 'max_weight_80', name: 'Solid Strength', description: 'Lift 80kg+ in a single set', category: 'strength', tier: 'silver', icon: 'barbell', criteria: { type: 'max_weight_lifted', value: 80 } },
  { id: 'max_weight_100', name: 'Triple Digits', description: 'Lift 100kg+ in a single set', category: 'strength', tier: 'silver', icon: 'barbell', criteria: { type: 'max_weight_lifted', value: 100 } },
  { id: 'max_weight_120', name: 'Powerful', description: 'Lift 120kg+ in a single set', category: 'strength', tier: 'gold', icon: 'flash', criteria: { type: 'max_weight_lifted', value: 120 } },
  { id: 'max_weight_140', name: 'Elite Strength', description: 'Lift 140kg+ in a single set', category: 'strength', tier: 'gold', icon: 'flash', criteria: { type: 'max_weight_lifted', value: 140 } },
  { id: 'max_weight_160', name: 'Powerhouse', description: 'Lift 160kg+ in a single set', category: 'strength', tier: 'gold', icon: 'flash', criteria: { type: 'max_weight_lifted', value: 160 } },
  { id: 'max_weight_180', name: 'Beast Mode', description: 'Lift 180kg+ in a single set', category: 'strength', tier: 'diamond', icon: 'flash', criteria: { type: 'max_weight_lifted', value: 180 } },
  { id: 'max_weight_200', name: '200kg Club', description: 'Lift 200kg+ in a single set', category: 'strength', tier: 'diamond', icon: 'trophy', criteria: { type: 'max_weight_lifted', value: 200 } },
  { id: 'max_weight_250', name: 'Superhuman Strength', description: 'Lift 250kg+ in a single set', category: 'strength', tier: 'diamond', icon: 'trophy', criteria: { type: 'max_weight_lifted', value: 250 } },

  // ============ EXERCISES PER WORKOUT (most in a single session) ============
  { id: 'exercises_per_3', name: 'Mini Session', description: 'Do 3+ exercises in one workout', category: 'explorer', tier: 'bronze', icon: 'list', criteria: { type: 'max_exercises_per_workout', value: 3 } },
  { id: 'exercises_per_5', name: 'Full Routine', description: 'Do 5+ exercises in one workout', category: 'explorer', tier: 'bronze', icon: 'list', criteria: { type: 'max_exercises_per_workout', value: 5 } },
  { id: 'exercises_per_7', name: 'Thorough Session', description: 'Do 7+ exercises in one workout', category: 'explorer', tier: 'silver', icon: 'list', criteria: { type: 'max_exercises_per_workout', value: 7 } },
  { id: 'exercises_per_10', name: 'Marathon Workout', description: 'Do 10+ exercises in one workout', category: 'explorer', tier: 'gold', icon: 'list', criteria: { type: 'max_exercises_per_workout', value: 10 } },
  { id: 'exercises_per_15', name: 'Absolute Unit', description: 'Do 15+ exercises in one workout', category: 'explorer', tier: 'diamond', icon: 'list', criteria: { type: 'max_exercises_per_workout', value: 15 } },

  // ============ SETS PER WORKOUT (most in a single session) ============
  { id: 'sets_per_10', name: '10 Set Session', description: 'Do 10+ sets in one workout', category: 'volume', tier: 'bronze', icon: 'layers', criteria: { type: 'max_sets_per_workout', value: 10 } },
  { id: 'sets_per_20', name: '20 Set Grind', description: 'Do 20+ sets in one workout', category: 'volume', tier: 'silver', icon: 'layers', criteria: { type: 'max_sets_per_workout', value: 20 } },
  { id: 'sets_per_30', name: '30 Set Monster', description: 'Do 30+ sets in one workout', category: 'volume', tier: 'gold', icon: 'layers', criteria: { type: 'max_sets_per_workout', value: 30 } },
  { id: 'sets_per_40', name: '40 Set Beast', description: 'Do 40+ sets in one workout', category: 'volume', tier: 'gold', icon: 'layers', criteria: { type: 'max_sets_per_workout', value: 40 } },
  { id: 'sets_per_50', name: '50 Set Warrior', description: 'Do 50+ sets in one workout', category: 'volume', tier: 'diamond', icon: 'layers', criteria: { type: 'max_sets_per_workout', value: 50 } },

  // ============ DAILY CALORIES (most in a day) ============
  { id: 'daily_cal_2000', name: 'Full Day 2K', description: 'Log 2,000+ cal in a day', category: 'nutrition', tier: 'bronze', icon: 'flame', criteria: { type: 'max_daily_calories', value: 2000 } },
  { id: 'daily_cal_2500', name: 'Fueled Day', description: 'Log 2,500+ cal in a day', category: 'nutrition', tier: 'bronze', icon: 'flame', criteria: { type: 'max_daily_calories', value: 2500 } },
  { id: 'daily_cal_3000', name: 'Bulk Day', description: 'Log 3,000+ cal in a day', category: 'nutrition', tier: 'silver', icon: 'flame', criteria: { type: 'max_daily_calories', value: 3000 } },
  { id: 'daily_cal_3500', name: 'Surplus Mode', description: 'Log 3,500+ cal in a day', category: 'nutrition', tier: 'silver', icon: 'flame', criteria: { type: 'max_daily_calories', value: 3500 } },
  { id: 'daily_cal_4000', name: 'Calorie Monster', description: 'Log 4,000+ cal in a day', category: 'nutrition', tier: 'gold', icon: 'flame', criteria: { type: 'max_daily_calories', value: 4000 } },
  { id: 'daily_cal_5000', name: 'Epic Surplus', description: 'Log 5,000+ cal in a day', category: 'nutrition', tier: 'diamond', icon: 'flame', criteria: { type: 'max_daily_calories', value: 5000 } },

  // ============ TOTAL FOOD WEIGHT (grams) ============
  { id: 'total_carbs_1000', name: 'Carb Starter', description: 'Log 1,000g total carbs', category: 'nutrition', tier: 'bronze', icon: 'nutrition', criteria: { type: 'total_carbs', value: 1000 } },
  { id: 'total_carbs_5000', name: 'Carb Loader', description: 'Log 5,000g total carbs', category: 'nutrition', tier: 'silver', icon: 'nutrition', criteria: { type: 'total_carbs', value: 5000 } },
  { id: 'total_carbs_10000', name: 'Carb King', description: 'Log 10,000g total carbs', category: 'nutrition', tier: 'gold', icon: 'nutrition', criteria: { type: 'total_carbs', value: 10000 } },
  { id: 'total_carbs_50000', name: 'Carb Emperor', description: 'Log 50,000g total carbs', category: 'nutrition', tier: 'diamond', icon: 'nutrition', criteria: { type: 'total_carbs', value: 50000 } },
  { id: 'total_fat_500', name: 'Fat Tracker', description: 'Log 500g total fat', category: 'nutrition', tier: 'bronze', icon: 'nutrition', criteria: { type: 'total_fat', value: 500 } },
  { id: 'total_fat_2500', name: 'Fat Monitor', description: 'Log 2,500g total fat', category: 'nutrition', tier: 'silver', icon: 'nutrition', criteria: { type: 'total_fat', value: 2500 } },
  { id: 'total_fat_5000', name: 'Fat Master', description: 'Log 5,000g total fat', category: 'nutrition', tier: 'gold', icon: 'nutrition', criteria: { type: 'total_fat', value: 5000 } },
  { id: 'total_fat_25000', name: 'Fat Lord', description: 'Log 25,000g total fat', category: 'nutrition', tier: 'diamond', icon: 'nutrition', criteria: { type: 'total_fat', value: 25000 } },

  // ============ LONG SESSION (workout duration) ============
  { id: 'long_session_30', name: 'Half Hour Warrior', description: '30+ minute workout session', category: 'strength', tier: 'bronze', icon: 'time', criteria: { type: 'max_workout_duration', value: 30 } },
  { id: 'long_session_45', name: '45 Min Grind', description: '45+ minute workout session', category: 'strength', tier: 'bronze', icon: 'time', criteria: { type: 'max_workout_duration', value: 45 } },
  { id: 'long_session_60', name: 'One Hour Iron', description: '60+ minute workout session', category: 'strength', tier: 'silver', icon: 'time', criteria: { type: 'max_workout_duration', value: 60 } },
  { id: 'long_session_90', name: 'Endurance King', description: '90+ minute workout session', category: 'strength', tier: 'gold', icon: 'time', criteria: { type: 'max_workout_duration', value: 90 } },
  { id: 'long_session_120', name: 'Two Hour Beast', description: '120+ minute workout session', category: 'strength', tier: 'diamond', icon: 'time', criteria: { type: 'max_workout_duration', value: 120 } },

  // ============ MEALS PER DAY ============
  { id: 'meals_per_day_3', name: 'Three Square Meals', description: 'Log 3+ meals in a day', category: 'nutrition', tier: 'bronze', icon: 'restaurant', criteria: { type: 'max_meals_per_day', value: 3 } },
  { id: 'meals_per_day_4', name: 'Four Meal Plan', description: 'Log 4+ meals in a day', category: 'nutrition', tier: 'bronze', icon: 'restaurant', criteria: { type: 'max_meals_per_day', value: 4 } },
  { id: 'meals_per_day_5', name: 'Five Meal Prep', description: 'Log 5+ meals in a day', category: 'nutrition', tier: 'silver', icon: 'restaurant', criteria: { type: 'max_meals_per_day', value: 5 } },
  { id: 'meals_per_day_6', name: 'Six Meal Machine', description: 'Log 6+ meals in a day', category: 'nutrition', tier: 'gold', icon: 'restaurant', criteria: { type: 'max_meals_per_day', value: 6 } },
  { id: 'meals_per_day_8', name: 'Grazing Champion', description: 'Log 8+ meals in a day', category: 'nutrition', tier: 'diamond', icon: 'restaurant', criteria: { type: 'max_meals_per_day', value: 8 } },

  // ============ WEEKEND WARRIOR ============
  { id: 'weekend_workouts_5', name: 'Weekend Warrior', description: 'Work out on 5 weekends', category: 'strength', tier: 'bronze', icon: 'barbell', criteria: { type: 'weekend_workouts', value: 5 } },
  { id: 'weekend_workouts_20', name: 'Weekend Regular', description: 'Work out on 20 weekends', category: 'strength', tier: 'silver', icon: 'barbell', criteria: { type: 'weekend_workouts', value: 20 } },
  { id: 'weekend_workouts_50', name: 'No Days Off', description: 'Work out on 50 weekends', category: 'strength', tier: 'gold', icon: 'barbell', criteria: { type: 'weekend_workouts', value: 50 } },
  { id: 'weekend_workouts_100', name: 'Weekend Legend', description: 'Work out on 100 weekends', category: 'strength', tier: 'diamond', icon: 'trophy', criteria: { type: 'weekend_workouts', value: 100 } },

  // ============ MUSCLE GROUP GOLD/DIAMOND (extended existing) ============
  { id: 'muscle_triceps_100', name: 'Tricep Titan Gold', description: 'Log 100 tricep workouts', category: 'strength', tier: 'gold', icon: 'body', criteria: { type: 'muscle_workout_count', value: 100, muscle: 'Triceps' } },
  { id: 'muscle_abs_100', name: 'Six Pack Achieved', description: 'Log 100 ab workouts', category: 'strength', tier: 'gold', icon: 'body', criteria: { type: 'muscle_workout_count', value: 100, muscle: 'Abs' } },
  { id: 'muscle_glutes_100', name: 'Glute Goddess', description: 'Log 100 glute workouts', category: 'strength', tier: 'gold', icon: 'body', criteria: { type: 'muscle_workout_count', value: 100, muscle: 'Glutes' } },
  { id: 'muscle_calves_50', name: 'Calf Sculptor', description: 'Log 50 calf workouts', category: 'strength', tier: 'silver', icon: 'body', criteria: { type: 'muscle_workout_count', value: 50, muscle: 'Calves' } },
  { id: 'muscle_calves_100', name: 'Diamond Calves', description: 'Log 100 calf workouts', category: 'strength', tier: 'gold', icon: 'body', criteria: { type: 'muscle_workout_count', value: 100, muscle: 'Calves' } },
  { id: 'muscle_traps_50', name: 'Trap Lord', description: 'Log 50 trap workouts', category: 'strength', tier: 'silver', icon: 'body', criteria: { type: 'muscle_workout_count', value: 50, muscle: 'Traps' } },
  { id: 'muscle_traps_100', name: 'Yoke Master', description: 'Log 100 trap workouts', category: 'strength', tier: 'gold', icon: 'body', criteria: { type: 'muscle_workout_count', value: 100, muscle: 'Traps' } },
  { id: 'muscle_hamstrings_50', name: 'Hamstring Hammer', description: 'Log 50 hamstring workouts', category: 'strength', tier: 'silver', icon: 'body', criteria: { type: 'muscle_workout_count', value: 50, muscle: 'Hamstrings' } },
  { id: 'muscle_hamstrings_100', name: 'Hamstring Legend', description: 'Log 100 hamstring workouts', category: 'strength', tier: 'gold', icon: 'body', criteria: { type: 'muscle_workout_count', value: 100, muscle: 'Hamstrings' } },
  { id: 'muscle_forearms_50', name: 'Iron Grip', description: 'Log 50 forearm workouts', category: 'strength', tier: 'silver', icon: 'body', criteria: { type: 'muscle_workout_count', value: 50, muscle: 'Forearms' } },
  { id: 'muscle_forearms_100', name: 'Grip Legend', description: 'Log 100 forearm workouts', category: 'strength', tier: 'gold', icon: 'body', criteria: { type: 'muscle_workout_count', value: 100, muscle: 'Forearms' } },

  // Diamond tier for all muscle groups (200 each)
  { id: 'muscle_chest_200', name: 'Chest Deity', description: 'Log 200 chest workouts', category: 'strength', tier: 'diamond', icon: 'body', criteria: { type: 'muscle_workout_count', value: 200, muscle: 'Chest' } },
  { id: 'muscle_back_200', name: 'Back Deity', description: 'Log 200 back workouts', category: 'strength', tier: 'diamond', icon: 'body', criteria: { type: 'muscle_workout_count', value: 200, muscle: 'Back' } },
  { id: 'muscle_legs_200', name: 'Leg Deity', description: 'Log 200 leg workouts', category: 'strength', tier: 'diamond', icon: 'body', criteria: { type: 'muscle_workout_count', value: 200, muscle: 'Quads' } },
  { id: 'muscle_shoulders_200', name: 'Shoulder Deity', description: 'Log 200 shoulder workouts', category: 'strength', tier: 'diamond', icon: 'body', criteria: { type: 'muscle_workout_count', value: 200, muscle: 'Shoulders' } },
  { id: 'muscle_arms_200', name: 'Arm Deity', description: 'Log 200 bicep workouts', category: 'strength', tier: 'diamond', icon: 'body', criteria: { type: 'muscle_workout_count', value: 200, muscle: 'Biceps' } },
  { id: 'muscle_triceps_200', name: 'Tricep Deity', description: 'Log 200 tricep workouts', category: 'strength', tier: 'diamond', icon: 'body', criteria: { type: 'muscle_workout_count', value: 200, muscle: 'Triceps' } },

  // ============ FAT / CARBS SINGLE DAY ============
  { id: 'low_fat_day', name: 'Low Fat Day', description: 'Log under 40g fat in a 2000+ cal day', category: 'nutrition', tier: 'silver', icon: 'leaf', criteria: { type: 'low_fat_day', value: 1 } },
  { id: 'high_carb_day_300', name: 'Carb Up Day', description: 'Eat 300g+ carbs in a day', category: 'nutrition', tier: 'silver', icon: 'nutrition', criteria: { type: 'daily_carbs', value: 300 } },
  { id: 'high_carb_day_400', name: 'Carb Loading', description: 'Eat 400g+ carbs in a day', category: 'nutrition', tier: 'gold', icon: 'nutrition', criteria: { type: 'daily_carbs', value: 400 } },
  { id: 'high_carb_day_500', name: 'Glycogen Maxed', description: 'Eat 500g+ carbs in a day', category: 'nutrition', tier: 'diamond', icon: 'nutrition', criteria: { type: 'daily_carbs', value: 500 } },

  // ============ CONSISTENCY COMBOS ============
  { id: 'combo_food_water_7', name: 'Dual Tracker 7', description: 'Log food + water 7 days in a row', category: 'consistency', tier: 'silver', icon: 'checkmark-done', criteria: { type: 'food_water_streak', value: 7 } },
  { id: 'combo_food_water_14', name: 'Dual Tracker 14', description: 'Log food + water 14 days in a row', category: 'consistency', tier: 'gold', icon: 'checkmark-done', criteria: { type: 'food_water_streak', value: 14 } },
  { id: 'combo_food_water_30', name: 'Dual Tracker 30', description: 'Log food + water 30 days in a row', category: 'consistency', tier: 'gold', icon: 'checkmark-done', criteria: { type: 'food_water_streak', value: 30 } },
  { id: 'combo_food_water_60', name: 'Dual Tracker 60', description: 'Log food + water 60 days in a row', category: 'consistency', tier: 'diamond', icon: 'trophy', criteria: { type: 'food_water_streak', value: 60 } },
  { id: 'combo_all_7', name: 'Triple Tracker 7', description: 'Log food + water + workout 7 days', category: 'consistency', tier: 'gold', icon: 'ribbon', criteria: { type: 'all_three_streak', value: 7 } },
  { id: 'combo_all_14', name: 'Triple Tracker 14', description: 'Log food + water + workout 14 days', category: 'consistency', tier: 'gold', icon: 'ribbon', criteria: { type: 'all_three_streak', value: 14 } },
  { id: 'combo_all_30', name: 'Complete Athlete', description: 'Log food + water + workout 30 days', category: 'consistency', tier: 'diamond', icon: 'trophy', criteria: { type: 'all_three_streak', value: 30 } },

  // ============ WORKOUT PER WEEK CONSISTENCY ============
  { id: 'weekly_3x_4', name: '3x/Week for a Month', description: 'Work out 3+ times/week for 4 weeks', category: 'consistency', tier: 'silver', icon: 'calendar', criteria: { type: 'weekly_workout_consistency', value: 4, min_per_week: 3 } },
  { id: 'weekly_3x_8', name: '3x/Week for 2 Months', description: 'Work out 3+ times/week for 8 weeks', category: 'consistency', tier: 'gold', icon: 'calendar', criteria: { type: 'weekly_workout_consistency', value: 8, min_per_week: 3 } },
  { id: 'weekly_3x_12', name: '3x/Week for 3 Months', description: 'Work out 3+ times/week for 12 weeks', category: 'consistency', tier: 'gold', icon: 'calendar', criteria: { type: 'weekly_workout_consistency', value: 12, min_per_week: 3 } },
  { id: 'weekly_4x_4', name: '4x/Week for a Month', description: 'Work out 4+ times/week for 4 weeks', category: 'consistency', tier: 'gold', icon: 'calendar', criteria: { type: 'weekly_workout_consistency', value: 4, min_per_week: 4 } },
  { id: 'weekly_5x_4', name: '5x/Week for a Month', description: 'Work out 5+ times/week for 4 weeks', category: 'consistency', tier: 'gold', icon: 'calendar', criteria: { type: 'weekly_workout_consistency', value: 4, min_per_week: 5 } },
  { id: 'weekly_5x_12', name: '5x/Week for a Quarter', description: 'Work out 5+ times/week for 12 weeks', category: 'consistency', tier: 'diamond', icon: 'trophy', criteria: { type: 'weekly_workout_consistency', value: 12, min_per_week: 5 } },
  { id: 'weekly_6x_4', name: '6x/Week Beast', description: 'Work out 6+ times/week for 4 weeks', category: 'consistency', tier: 'diamond', icon: 'trophy', criteria: { type: 'weekly_workout_consistency', value: 4, min_per_week: 6 } },
];

// Generate additional tier variations to reach high count
const generateBulkAchievements = (): Achievement[] => {
  const bulk: Achievement[] = [];
  
  // Sets completed milestones
  const setMilestones = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
  const setTiers: ('bronze' | 'silver' | 'gold' | 'diamond')[] = ['bronze', 'bronze', 'silver', 'silver', 'gold', 'gold', 'diamond', 'diamond'];
  setMilestones.forEach((val, i) => {
    bulk.push({
      id: `sets_${val}`, name: `${val} Sets`, description: `Complete ${val.toLocaleString()} total sets`,
      category: 'volume', tier: setTiers[i], icon: 'layers', criteria: { type: 'total_sets', value: val },
    });
  });

  // Reps completed milestones
  const repMilestones = [100, 500, 1000, 5000, 10000, 25000, 50000, 100000];
  repMilestones.forEach((val, i) => {
    bulk.push({
      id: `reps_${val}`, name: `${val.toLocaleString()} Reps`, description: `Complete ${val.toLocaleString()} total reps`,
      category: 'volume', tier: setTiers[i], icon: 'repeat', criteria: { type: 'total_reps', value: val },
    });
  });

  // Duration milestones (total workout minutes)
  const durationMilestones = [60, 300, 600, 1200, 3000, 6000, 12000, 24000];
  const durationNames = ['One Hour', 'Five Hours', 'Ten Hours', 'Twenty Hours', 'Fifty Hours', 'Hundred Hours', 'Two Hundred Hours', 'Four Hundred Hours'];
  durationMilestones.forEach((val, i) => {
    bulk.push({
      id: `duration_${val}`, name: durationNames[i], description: `Spend ${val} minutes working out`,
      category: 'strength', tier: setTiers[i], icon: 'time', criteria: { type: 'total_duration', value: val },
    });
  });

  // Per-exercise milestones (for popular exercises)
  const popularExercises = [
    'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
    'Pull Up', 'Dumbbell Curl', 'Lateral Raise', 'Leg Press', 'Romanian Deadlift',
    'Incline Bench Press', 'Cable Fly', 'Tricep Pushdown', 'Face Pull', 'Hip Thrust',
    'Dumbbell Row', 'Chin Up', 'Dip', 'Calf Raise', 'Hammer Curl',
    'Leg Curl', 'Leg Extension', 'Skull Crusher', 'Preacher Curl', 'T-Bar Row',
  ];
  const exMilestones = [10, 25, 50, 100, 200];
  const exTiers: ('bronze' | 'silver' | 'gold' | 'diamond' | 'diamond')[] = ['bronze', 'silver', 'gold', 'diamond', 'diamond'];
  popularExercises.forEach(ex => {
    exMilestones.forEach((val, i) => {
      const slug = ex.toLowerCase().replace(/\s+/g, '_');
      const suffix = val >= 200 ? ' Master' : val >= 100 ? ' Elite' : '';
      bulk.push({
        id: `ex_${slug}_${val}`, name: `${ex} ${val}x${suffix}`, description: `Perform ${ex} ${val} times`,
        category: 'strength', tier: exTiers[i], icon: 'barbell',
        criteria: { type: 'exercise_count', value: val, exercise: ex },
      });
    });
  });

  // Daily calorie target hit
  const hitMilestones = [1, 7, 14, 30, 60, 90, 180, 365];
  const hitNames = ['On Target', 'Week on Point', 'Two Weeks Strong', 'Month of Precision', 'Two Months Dialing', 'Quarter Precision', 'Half Year Accuracy', 'Perfect Year'];
  const hitTiers: ('bronze' | 'silver' | 'gold' | 'diamond')[] = ['bronze', 'bronze', 'silver', 'silver', 'gold', 'gold', 'diamond', 'diamond'];
  hitMilestones.forEach((val, i) => {
    bulk.push({
      id: `target_hit_${val}`, name: hitNames[i], description: `Hit your calorie target ${val} days`,
      category: 'consistency', tier: hitTiers[i], icon: 'checkmark-circle',
      criteria: { type: 'calorie_target_days', value: val },
    });
  });

  // Water target hit
  hitMilestones.forEach((val, i) => {
    bulk.push({
      id: `water_target_${val}`, name: `Hydrated ${val}d`, description: `Hit water target ${val} days`,
      category: 'hydration', tier: hitTiers[i], icon: 'water',
      criteria: { type: 'water_target_days', value: val },
    });
  });

  // Protein target hit  
  hitMilestones.forEach((val, i) => {
    bulk.push({
      id: `protein_target_${val}`, name: `Protein Goal ${val}d`, description: `Hit protein target ${val} days`,
      category: 'nutrition', tier: hitTiers[i], icon: 'nutrition',
      criteria: { type: 'protein_target_days', value: val },
    });
  });

  // Photos milestones
  [1, 5, 10, 25, 50, 100].forEach((val, i) => {
    const tiers: ('bronze' | 'silver' | 'gold' | 'diamond')[] = ['bronze', 'bronze', 'silver', 'silver', 'gold', 'diamond'];
    bulk.push({
      id: `photos_${val}`, name: `${val} Photos`, description: `Take ${val} progress photos`,
      category: 'social', tier: tiers[i], icon: 'camera',
      criteria: { type: 'photo_count', value: val },
    });
  });

  // Workout time of day
  ['morning', 'afternoon', 'evening', 'night'].forEach(time => {
    [5, 20, 50, 100].forEach((val, i) => {
      const tiers: ('bronze' | 'silver' | 'gold' | 'diamond')[] = ['bronze', 'silver', 'gold', 'diamond'];
      const timeNames: Record<string, string[]> = {
        morning: ['Early Bird', 'Dawn Warrior', 'Sunrise Champion', 'Morning Legend'],
        afternoon: ['Midday Mover', 'Afternoon Regular', 'PM Powerhouse', 'Afternoon Lord'],
        evening: ['Evening Enthusiast', 'Sunset Lifter', 'Dusk Dominator', 'Evening Emperor'],
        night: ['Night Owl', 'Midnight Grinder', 'Nocturnal Beast', 'Night Legend'],
      };
      bulk.push({
        id: `${time}_workout_${val}`, name: timeNames[time][i],
        description: `Work out in the ${time} ${val} times`,
        category: 'explorer', tier: tiers[i], icon: time === 'morning' ? 'sunny' : time === 'night' ? 'moon' : time === 'evening' ? 'cloudy-night' : 'partly-sunny',
        criteria: { type: 'time_of_day_workout', value: val, time_of_day: time },
      });
    });
  });

  return bulk;
};

export const ALL_ACHIEVEMENTS: Achievement[] = [...achievements, ...generateBulkAchievements()];

export function getAchievementById(id: string): Achievement | undefined {
  return ALL_ACHIEVEMENTS.find(a => a.id === id);
}

export function getAchievementsByCategory(category: string): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(a => a.category === category);
}

export function getAchievementsByTier(tier: string): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(a => a.tier === tier);
}

export const ACHIEVEMENT_CATEGORIES = [
  { id: 'consistency', name: 'Consistency', icon: 'flame' },
  { id: 'nutrition', name: 'Nutrition', icon: 'nutrition' },
  { id: 'hydration', name: 'Hydration', icon: 'water' },
  { id: 'strength', name: 'Strength', icon: 'barbell' },
  { id: 'volume', name: 'Volume', icon: 'layers' },
  { id: 'explorer', name: 'Explorer', icon: 'compass' },
  { id: 'milestone', name: 'Milestones', icon: 'flag' },
  { id: 'social', name: 'Social', icon: 'people' },
];
