export const SPLIT_PRESETS = [
  {
    name: 'Push/Pull/Legs (PPL)',
    description: '6-day split targeting push muscles, pull muscles, and legs separately. Great for intermediate to advanced lifters.',
    days: [
      { day_name: 'Push', muscle_groups: ['Chest', 'Shoulders', 'Triceps'] },
      { day_name: 'Pull', muscle_groups: ['Back', 'Biceps', 'Rear Delts'] },
      { day_name: 'Legs', muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
      { day_name: 'Push', muscle_groups: ['Chest', 'Shoulders', 'Triceps'] },
      { day_name: 'Pull', muscle_groups: ['Back', 'Biceps', 'Rear Delts'] },
      { day_name: 'Legs', muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
    ],
  },
  {
    name: 'Upper/Lower',
    description: '4-day split alternating upper and lower body. Good volume and recovery balance.',
    days: [
      { day_name: 'Upper Body', muscle_groups: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'] },
      { day_name: 'Lower Body', muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
      { day_name: 'Upper Body', muscle_groups: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'] },
      { day_name: 'Lower Body', muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
    ],
  },
  {
    name: 'Bro Split',
    description: '5-day split with one muscle group per day. Classic bodybuilding approach with maximum volume per muscle.',
    days: [
      { day_name: 'Chest', muscle_groups: ['Chest'] },
      { day_name: 'Back', muscle_groups: ['Back'] },
      { day_name: 'Shoulders', muscle_groups: ['Shoulders', 'Traps'] },
      { day_name: 'Legs', muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
      { day_name: 'Arms', muscle_groups: ['Biceps', 'Triceps', 'Forearms'] },
    ],
  },
  {
    name: 'Full Body 3x',
    description: '3-day full body workouts with rest days in between. Ideal for beginners and intermediates.',
    days: [
      { day_name: 'Full Body A', muscle_groups: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms'] },
      { day_name: 'Full Body B', muscle_groups: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms'] },
      { day_name: 'Full Body C', muscle_groups: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms'] },
    ],
  },
  {
    name: 'Full Body 5x',
    description: '5-day full body with different focus each day. High frequency for maximal strength and skill development.',
    days: [
      { day_name: 'Strength Focus', muscle_groups: ['Chest', 'Back', 'Legs'] },
      { day_name: 'Hypertrophy A', muscle_groups: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs'] },
      { day_name: 'Power Focus', muscle_groups: ['Chest', 'Back', 'Legs'] },
      { day_name: 'Hypertrophy B', muscle_groups: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs'] },
      { day_name: 'Volume Focus', muscle_groups: ['Full Body'] },
    ],
  },
  {
    name: 'Arnold Split',
    description: '6-day split made famous by Arnold Schwarzenegger. Pairs chest/back, shoulders/arms, and legs.',
    days: [
      { day_name: 'Chest & Back', muscle_groups: ['Chest', 'Back'] },
      { day_name: 'Shoulders & Arms', muscle_groups: ['Shoulders', 'Biceps', 'Triceps'] },
      { day_name: 'Legs', muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
      { day_name: 'Chest & Back', muscle_groups: ['Chest', 'Back'] },
      { day_name: 'Shoulders & Arms', muscle_groups: ['Shoulders', 'Biceps', 'Triceps'] },
      { day_name: 'Legs', muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
    ],
  },
  {
    name: 'PHUL',
    description: 'Power Hypertrophy Upper Lower. 4 days combining strength and hypertrophy training.',
    days: [
      { day_name: 'Upper Power', muscle_groups: ['Chest', 'Back', 'Shoulders', 'Arms'] },
      { day_name: 'Lower Power', muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
      { day_name: 'Upper Hypertrophy', muscle_groups: ['Chest', 'Back', 'Shoulders', 'Arms'] },
      { day_name: 'Lower Hypertrophy', muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
    ],
  },
  {
    name: 'PHAT',
    description: 'Power Hypertrophy Adaptive Training. 5-day program by Layne Norton combining power and hypertrophy.',
    days: [
      { day_name: 'Upper Power', muscle_groups: ['Chest', 'Back', 'Shoulders'] },
      { day_name: 'Lower Power', muscle_groups: ['Quads', 'Hamstrings', 'Glutes'] },
      { day_name: 'Back & Shoulders Hypertrophy', muscle_groups: ['Back', 'Shoulders', 'Rear Delts'] },
      { day_name: 'Lower Hypertrophy', muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
      { day_name: 'Chest & Arms Hypertrophy', muscle_groups: ['Chest', 'Biceps', 'Triceps'] },
    ],
  },
];

export const CALORIE_MODE_LABELS: Record<string, string> = {
  maintain: 'Maintain',
  light_cut: 'Light Cut (-250)',
  heavy_cut: 'Heavy Cut (-500)',
  light_bulk: 'Light Bulk (+250)',
  heavy_bulk: 'Heavy Bulk (+500)',
};

export const CALORIE_MODE_OFFSETS: Record<string, number> = {
  maintain: 0,
  light_cut: -250,
  heavy_cut: -500,
  light_bulk: 250,
  heavy_bulk: 500,
};

export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core',
  'Traps', 'Forearms', 'Rear Delts', 'Full Body',
];

export function calculateMaintenanceCalories(
  weight_kg: number,
  height_cm: number,
  age: number,
  gender: 'male' | 'female',
  activityMultiplier: number = 1.55
): number {
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }
  return Math.round(bmr * activityMultiplier);
}

export function calculateMacros(targetCalories: number, weight_kg: number) {
  const protein = Math.round(weight_kg * 2); // 2g per kg
  const fat = Math.round((targetCalories * 0.25) / 9); // 25% from fat
  const carbCalories = targetCalories - (protein * 4) - (fat * 9);
  const carbs = Math.round(carbCalories / 4);
  return { protein, carbs, fat };
}
