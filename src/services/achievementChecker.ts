import { ALL_ACHIEVEMENTS, getAchievementById } from '../constants/achievements';
import { Achievement, UserAchievement, FoodLog, WorkoutLog, WaterLog, WeightLog } from '../types';

export interface AchievementStats {
  food_count: number;
  workout_count: number;
  water_count: number;
  total_calories: number;
  total_protein: number;
  total_volume: number;
  total_water: number;
  total_sets: number;
  total_reps: number;
  total_duration: number;
  weight_log_count: number;
  unique_exercises: number;
  photo_count: number;
  logging_streak: number;
  workout_streak: number;
  ai_food_count: number;
  ai_workout_count: number;
  onboarding_complete: boolean;
  profile_complete: boolean;
  split_created: boolean;
  // Day-specific
  daily_water: number;
  daily_protein: number;
  // Single records
  max_single_food_calories: number;
  max_single_workout_volume: number;
  // Meal counts
  meal_type_counts: Record<string, number>;
  // Muscle counts
  muscle_workout_counts: Record<string, number>;
  // Exercise counts
  exercise_counts: Record<string, number>;
  // Target hit days
  calorie_target_days: number;
  water_target_days: number;
  protein_target_days: number;
  // Time of day
  time_of_day_counts: Record<string, number>;
  // NEW STATS
  total_days_logged: number;
  total_workout_days: number;
  perfect_days: number;
  max_weight_lifted: number;
  max_exercises_per_workout: number;
  max_sets_per_workout: number;
  max_daily_calories: number;
  total_carbs: number;
  total_fat: number;
  max_workout_duration: number;
  max_meals_per_day: number;
  weekend_workouts: number;
  daily_carbs: number;
  low_fat_day_count: number;
  food_water_streak: number;
  all_three_streak: number;
  weekly_workout_weeks: Record<number, number>; // min_per_week -> consecutive weeks
}

export function buildStatsFromData(params: {
  allFoodLogs: FoodLog[];
  allWorkoutLogs: WorkoutLog[];
  allWaterLogs: WaterLog[];
  allWeightLogs: WeightLog[];
  photoCount: number;
  onboardingComplete: boolean;
  profileComplete: boolean;
  splitCreated: boolean;
  todayWater: number;
  todayProtein: number;
  dailyCalorieTarget: number;
  dailyWaterTarget: number;
  dailyProteinTarget: number;
}): AchievementStats {
  const {
    allFoodLogs, allWorkoutLogs, allWaterLogs, allWeightLogs,
    photoCount, onboardingComplete, profileComplete, splitCreated,
    todayWater, todayProtein, dailyCalorieTarget, dailyWaterTarget, dailyProteinTarget,
  } = params;

  // Count meal types
  const mealCounts: Record<string, number> = {};
  allFoodLogs.forEach(f => {
    mealCounts[f.meal_type] = (mealCounts[f.meal_type] || 0) + 1;
  });

  // Count exercises and muscles
  const exerciseCounts: Record<string, number> = {};
  const muscleCounts: Record<string, number> = {};
  const uniqueExercises = new Set<string>();
  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0;
  let totalDuration = 0;
  let maxSingleVolume = 0;

  // Time of day
  const todCounts: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };

  allWorkoutLogs.forEach(w => {
    const workoutVolume = (w.exercises || []).reduce((vol, ex) =>
      vol + (ex.sets || []).reduce((setVol, s) => setVol + (s.weight_kg * s.reps), 0), 0);
    totalVolume += workoutVolume;
    totalDuration += w.duration_minutes || 0;
    if (workoutVolume > maxSingleVolume) maxSingleVolume = workoutVolume;

    // Time of day
    const hour = new Date(w.created_at).getHours();
    if (hour >= 5 && hour < 12) todCounts.morning++;
    else if (hour >= 12 && hour < 17) todCounts.afternoon++;
    else if (hour >= 17 && hour < 21) todCounts.evening++;
    else todCounts.night++;

    if (w.exercises) {
      w.exercises.forEach(ex => {
        uniqueExercises.add(ex.exercise_name);
        exerciseCounts[ex.exercise_name] = (exerciseCounts[ex.exercise_name] || 0) + 1;
        if (ex.muscle_group) {
          muscleCounts[ex.muscle_group] = (muscleCounts[ex.muscle_group] || 0) + 1;
        }
        if (ex.sets) {
          totalSets += ex.sets.length;
          ex.sets.forEach(s => { totalReps += s.reps || 0; });
        }
      });
    }
  });

  // Max single food calories
  let maxFoodCal = 0;
  allFoodLogs.forEach(f => { if (f.calories > maxFoodCal) maxFoodCal = f.calories; });

  // Logging streak (count consecutive days with any log)
  const loggingStreak = computeStreak(getDaySet([
    ...allFoodLogs.map(f => f.created_at),
    ...allWorkoutLogs.map(w => w.created_at),
    ...allWaterLogs.map(w => w.created_at),
  ]));

  const workoutStreak = computeStreak(getDaySet(allWorkoutLogs.map(w => w.created_at)));

  // Target hit days
  const calTargetDays = countTargetHitDays(allFoodLogs, 'calories', dailyCalorieTarget, 0.9);
  const waterTargetDays = countWaterTargetDays(allWaterLogs, dailyWaterTarget);
  const proteinTargetDays = countTargetHitDays(allFoodLogs, 'protein', dailyProteinTarget, 0.9);

  // AI counts (estimated from source field if exists, otherwise 0)
  const aiFoodCount = allFoodLogs.filter(f => (f as any).source === 'ai').length;
  const aiWorkoutCount = allWorkoutLogs.filter(w => (w as any).source === 'ai').length;

  // ─── NEW: total days logged (unique days with any activity) ───
  const allDays = new Set<string>();
  [...allFoodLogs.map(f => f.created_at), ...allWorkoutLogs.map(w => w.created_at),
   ...allWaterLogs.map(w => w.created_at), ...allWeightLogs.map(w => w.created_at)].forEach(ts => {
    const d = new Date(ts);
    allDays.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
  });

  // ─── Workout-related single-session max stats ───
  let maxWeightLifted = 0;
  let maxExercisesPerWorkout = 0;
  let maxSetsPerWorkout = 0;
  let maxWorkoutDuration = 0;
  const workoutDaySet = new Set<string>();
  let weekendWorkoutDays = 0;

  allWorkoutLogs.forEach(w => {
    const d = new Date(w.created_at);
    const dayKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const isNewDay = !workoutDaySet.has(dayKey);
    workoutDaySet.add(dayKey);
    if (isNewDay && (d.getDay() === 0 || d.getDay() === 6)) weekendWorkoutDays++;

    const dur = w.duration_minutes || 0;
    if (dur > maxWorkoutDuration) maxWorkoutDuration = dur;

    const exCount = (w.exercises || []).length;
    if (exCount > maxExercisesPerWorkout) maxExercisesPerWorkout = exCount;

    let sessionSets = 0;
    (w.exercises || []).forEach(ex => {
      (ex.sets || []).forEach(s => {
        if (s.weight_kg > maxWeightLifted) maxWeightLifted = s.weight_kg;
      });
      sessionSets += (ex.sets || []).length;
    });
    if (sessionSets > maxSetsPerWorkout) maxSetsPerWorkout = sessionSets;
  });

  // ─── Daily food aggregates ───
  const dailyFoodCals: Record<string, number> = {};
  const dailyFoodCarbs: Record<string, number> = {};
  const dailyFoodFat: Record<string, number> = {};
  const dailyFoodProtein: Record<string, number> = {};
  const dailyMealCount: Record<string, number> = {};
  const foodDaySet = new Set<string>();

  allFoodLogs.forEach(f => {
    const d = new Date(f.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    foodDaySet.add(key);
    dailyFoodCals[key] = (dailyFoodCals[key] || 0) + (f.calories || 0);
    dailyFoodCarbs[key] = (dailyFoodCarbs[key] || 0) + ((f as any).carbs || 0);
    dailyFoodFat[key] = (dailyFoodFat[key] || 0) + ((f as any).fat || 0);
    dailyFoodProtein[key] = (dailyFoodProtein[key] || 0) + (f.protein || 0);
    dailyMealCount[key] = (dailyMealCount[key] || 0) + 1;
  });

  const maxDailyCals = Math.max(0, ...Object.values(dailyFoodCals));
  const maxDailyCarbs = Math.max(0, ...Object.values(dailyFoodCarbs));
  const maxMealsPerDay = Math.max(0, ...Object.values(dailyMealCount));
  const totalCarbs = allFoodLogs.reduce((s, f) => s + ((f as any).carbs || 0), 0);
  const totalFat = allFoodLogs.reduce((s, f) => s + ((f as any).fat || 0), 0);

  // Low fat days: fat < 40g && cals >= 2000
  const lowFatDayCount = Object.keys(dailyFoodCals).filter(k =>
    (dailyFoodFat[k] || 0) < 40 && (dailyFoodCals[k] || 0) >= 2000
  ).length;

  // ─── Perfect days: hit calorie, protein, and water targets ───
  const waterDayTotals: Record<string, number> = {};
  const waterDaySet = new Set<string>();
  allWaterLogs.forEach(w => {
    const d = new Date(w.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    waterDaySet.add(key);
    waterDayTotals[key] = (waterDayTotals[key] || 0) + w.amount_ml;
  });

  let perfectDays = 0;
  const allFoodDays = Object.keys(dailyFoodCals);
  allFoodDays.forEach(key => {
    const calOk = dailyCalorieTarget > 0 && dailyFoodCals[key] >= dailyCalorieTarget * 0.9;
    const proOk = dailyProteinTarget > 0 && (dailyFoodProtein[key] || 0) >= dailyProteinTarget * 0.9;
    const watOk = dailyWaterTarget > 0 && (waterDayTotals[key] || 0) >= dailyWaterTarget * 0.9;
    if (calOk && proOk && watOk) perfectDays++;
  });

  // ─── Food+Water streak & all-three streak ───
  const foodWaterStreak = computeStreak(intersectDaySets(foodDaySet, waterDaySet));

  const workoutDaySet2 = new Set<string>();
  allWorkoutLogs.forEach(w => {
    const d = new Date(w.created_at);
    workoutDaySet2.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  });
  const allThreeSet = new Set<string>(
    [...foodDaySet].filter(d => waterDaySet.has(d) && workoutDaySet2.has(d))
  );
  const allThreeStreak = computeStreak(allThreeSet);

  // ─── Weekly workout consistency ───
  const weeklyWorkoutWeeks: Record<number, number> = {};
  for (const minPerWeek of [3, 4, 5, 6]) {
    weeklyWorkoutWeeks[minPerWeek] = computeWeeklyConsistency(allWorkoutLogs.map(w => w.created_at), minPerWeek);
  }

  return {
    food_count: allFoodLogs.length,
    workout_count: allWorkoutLogs.length,
    water_count: allWaterLogs.length,
    total_calories: allFoodLogs.reduce((s, f) => s + f.calories, 0),
    total_protein: allFoodLogs.reduce((s, f) => s + f.protein, 0),
    total_volume: totalVolume,
    total_water: allWaterLogs.reduce((s, w) => s + w.amount_ml, 0),
    total_sets: totalSets,
    total_reps: totalReps,
    total_duration: totalDuration,
    weight_log_count: allWeightLogs.length,
    unique_exercises: uniqueExercises.size,
    photo_count: photoCount,
    logging_streak: loggingStreak,
    workout_streak: workoutStreak,
    ai_food_count: aiFoodCount,
    ai_workout_count: aiWorkoutCount,
    onboarding_complete: onboardingComplete,
    profile_complete: profileComplete,
    split_created: splitCreated,
    daily_water: todayWater,
    daily_protein: todayProtein,
    max_single_food_calories: maxFoodCal,
    max_single_workout_volume: maxSingleVolume,
    meal_type_counts: mealCounts,
    muscle_workout_counts: muscleCounts,
    exercise_counts: exerciseCounts,
    calorie_target_days: calTargetDays,
    water_target_days: waterTargetDays,
    protein_target_days: proteinTargetDays,
    time_of_day_counts: todCounts,
    // NEW
    total_days_logged: allDays.size,
    total_workout_days: workoutDaySet.size,
    perfect_days: perfectDays,
    max_weight_lifted: maxWeightLifted,
    max_exercises_per_workout: maxExercisesPerWorkout,
    max_sets_per_workout: maxSetsPerWorkout,
    max_daily_calories: maxDailyCals,
    total_carbs: totalCarbs,
    total_fat: totalFat,
    max_workout_duration: maxWorkoutDuration,
    max_meals_per_day: maxMealsPerDay,
    weekend_workouts: weekendWorkoutDays,
    daily_carbs: maxDailyCarbs,
    low_fat_day_count: lowFatDayCount,
    food_water_streak: foodWaterStreak,
    all_three_streak: allThreeStreak,
    weekly_workout_weeks: weeklyWorkoutWeeks,
  };
}

function getDaySet(timestamps: string[]): Set<string> {
  const days = new Set<string>();
  timestamps.forEach(ts => {
    const d = new Date(ts);
    days.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  });
  return days;
}

function computeStreak(daySet: Set<string>): number {
  if (daySet.size === 0) return 0;
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 1000; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (daySet.has(key)) {
      streak++;
    } else if (i === 0) {
      // Today might not have a log yet, skip
      continue;
    } else {
      break;
    }
  }
  return streak;
}

function countTargetHitDays(logs: FoodLog[], field: 'calories' | 'protein', target: number, threshold: number): number {
  if (!target) return 0;
  const dayTotals: Record<string, number> = {};
  logs.forEach(f => {
    const d = new Date(f.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    dayTotals[key] = (dayTotals[key] || 0) + (f as any)[field];
  });
  return Object.values(dayTotals).filter(v => v >= target * threshold).length;
}

function countWaterTargetDays(logs: WaterLog[], target: number): number {
  if (!target) return 0;
  const dayTotals: Record<string, number> = {};
  logs.forEach(w => {
    const d = new Date(w.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    dayTotals[key] = (dayTotals[key] || 0) + w.amount_ml;
  });
  return Object.values(dayTotals).filter(v => v >= target * 0.9).length;
}

export function checkNewAchievements(
  stats: AchievementStats,
  alreadyUnlocked: Set<string>,
): Achievement[] {
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ALL_ACHIEVEMENTS) {
    if (alreadyUnlocked.has(achievement.id)) continue;

    const c = achievement.criteria;
    let met = false;

    switch (c.type) {
      case 'food_count': met = stats.food_count >= c.value; break;
      case 'workout_count': met = stats.workout_count >= c.value; break;
      case 'water_count': met = stats.water_count >= c.value; break;
      case 'total_calories': met = stats.total_calories >= c.value; break;
      case 'total_protein': met = stats.total_protein >= c.value; break;
      case 'total_volume': met = stats.total_volume >= c.value; break;
      case 'total_water': met = stats.total_water >= c.value; break;
      case 'total_sets': met = stats.total_sets >= c.value; break;
      case 'total_reps': met = stats.total_reps >= c.value; break;
      case 'total_duration': met = stats.total_duration >= c.value; break;
      case 'weight_log_count': met = stats.weight_log_count >= c.value; break;
      case 'unique_exercises': met = stats.unique_exercises >= c.value; break;
      case 'photo_count': met = stats.photo_count >= c.value; break;
      case 'logging_streak': met = stats.logging_streak >= c.value; break;
      case 'workout_streak': met = stats.workout_streak >= c.value; break;
      case 'ai_food_count': met = stats.ai_food_count >= c.value; break;
      case 'ai_workout_count': met = stats.ai_workout_count >= c.value; break;
      case 'onboarding_complete': met = stats.onboarding_complete; break;
      case 'profile_complete': met = stats.profile_complete; break;
      case 'split_created': met = stats.split_created; break;
      case 'daily_water': met = stats.daily_water >= c.value; break;
      case 'daily_protein': met = stats.daily_protein >= c.value; break;
      case 'single_food_calories': met = stats.max_single_food_calories >= c.value; break;
      case 'single_workout_volume': met = stats.max_single_workout_volume >= c.value; break;
      case 'meal_type_count':
        met = (stats.meal_type_counts[(c as any).meal_type] || 0) >= c.value;
        break;
      case 'muscle_workout_count':
        met = (stats.muscle_workout_counts[(c as any).muscle] || 0) >= c.value;
        break;
      case 'exercise_count':
        met = (stats.exercise_counts[(c as any).exercise] || 0) >= c.value;
        break;
      case 'calorie_target_days': met = stats.calorie_target_days >= c.value; break;
      case 'water_target_days': met = stats.water_target_days >= c.value; break;
      case 'protein_target_days': met = stats.protein_target_days >= c.value; break;
      case 'time_of_day_workout':
        met = (stats.time_of_day_counts[(c as any).time_of_day] || 0) >= c.value;
        break;
      // NEW criteria types
      case 'total_days_logged': met = stats.total_days_logged >= c.value; break;
      case 'total_workout_days': met = stats.total_workout_days >= c.value; break;
      case 'perfect_days': met = stats.perfect_days >= c.value; break;
      case 'max_weight_lifted': met = stats.max_weight_lifted >= c.value; break;
      case 'max_exercises_per_workout': met = stats.max_exercises_per_workout >= c.value; break;
      case 'max_sets_per_workout': met = stats.max_sets_per_workout >= c.value; break;
      case 'max_daily_calories': met = stats.max_daily_calories >= c.value; break;
      case 'total_carbs': met = stats.total_carbs >= c.value; break;
      case 'total_fat': met = stats.total_fat >= c.value; break;
      case 'max_workout_duration': met = stats.max_workout_duration >= c.value; break;
      case 'max_meals_per_day': met = stats.max_meals_per_day >= c.value; break;
      case 'weekend_workouts': met = stats.weekend_workouts >= c.value; break;
      case 'daily_carbs': met = stats.daily_carbs >= c.value; break;
      case 'low_fat_day': met = stats.low_fat_day_count >= c.value; break;
      case 'food_water_streak': met = stats.food_water_streak >= c.value; break;
      case 'all_three_streak': met = stats.all_three_streak >= c.value; break;
      case 'weekly_workout_consistency':
        const minPW = (c as any).min_per_week || 3;
        met = (stats.weekly_workout_weeks[minPW] || 0) >= c.value;
        break;
    }

    if (met) {
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

function intersectDaySets(a: Set<string>, b: Set<string>): Set<string> {
  const result = new Set<string>();
  a.forEach(d => { if (b.has(d)) result.add(d); });
  return result;
}

function computeWeeklyConsistency(timestamps: string[], minPerWeek: number): number {
  if (timestamps.length === 0) return 0;
  // Group workouts by ISO week
  const weekCounts: Record<string, number> = {};
  timestamps.forEach(ts => {
    const d = new Date(ts);
    // Get Monday-based week key
    const day = d.getDay() || 7; // Sunday=7
    const monday = new Date(d);
    monday.setDate(d.getDate() - day + 1);
    const weekKey = `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;
    weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
  });
  
  // Sort weeks and find longest consecutive run meeting threshold
  const sortedWeeks = Object.keys(weekCounts).sort();
  let maxRun = 0;
  let currentRun = 0;
  for (let i = 0; i < sortedWeeks.length; i++) {
    if (weekCounts[sortedWeeks[i]] >= minPerWeek) {
      // Check if consecutive with previous week
      if (i === 0 || isConsecutiveWeek(sortedWeeks[i-1], sortedWeeks[i])) {
        currentRun++;
      } else {
        currentRun = 1;
      }
      if (currentRun > maxRun) maxRun = currentRun;
    } else {
      currentRun = 0;
    }
  }
  return maxRun;
}

function isConsecutiveWeek(weekA: string, weekB: string): boolean {
  const dA = new Date(weekA);
  const dB = new Date(weekB);
  const diff = (dB.getTime() - dA.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 6 && diff <= 8; // roughly 7 days apart
}
