import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import Toast from 'react-native-toast-message';

import { auth, db, storage } from '../services/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  signOut as firebaseSignOut,
  deleteUser,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit,
  getDocs, addDoc, writeBatch,
} from 'firebase/firestore';
import {
  ref as storageRef, uploadBytes, getDownloadURL,
} from 'firebase/storage';

import { cache, getCacheKey, getTodayString, getStartOfDay, getEndOfDay } from '../services/cache';
import { buildStatsFromData, checkNewAchievements } from '../services/achievementChecker';
import { getAchievementById } from '../constants/achievements';

/** Safely convert any value to a finite number */
const safeNum = (v: any, fb = 0): number => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
import {
  User,
  UserSettings,
  FoodLog,
  WorkoutLog,
  WaterLog,
  UserAchievement,
  Split,
  SplitDay,
  Photo,
  WeightLog,
  SupplementLog,
  StepsLog,
  CardioLog,
  SleepLog,
  HistoryDay,
  UserFullHistory,
  LeaderboardEntry,
} from '../types';

const SUPPLEMENT_PLAN_TTL = 1000 * 60 * 60 * 24 * 365;

// ── Firestore helpers ───────────────────────────────────────────────────
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/** Query a collection with filters and return typed array */
async function queryCollection<T>(
  col: string,
  filters: [string, any, any][],
  orderField?: string,
  orderDir: 'asc' | 'desc' = 'desc',
  limitCount?: number
): Promise<T[]> {
  const constraints: any[] = filters.map(([field, op, val]) => where(field, op, val));
  if (orderField) constraints.push(orderBy(orderField, orderDir));
  if (limitCount) constraints.push(limit(limitCount));
  const q = query(collection(db, col), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
}

// ── Session shim ───────────────────────────────────────────────────────
interface SessionShim {
  user: { id: string; email?: string | null };
}

// ── State & Context types ──────────────────────────────────────────────
interface AppState {
  session: SessionShim | null;
  user: User | null;
  settings: UserSettings | null;
  todayFoodLogs: FoodLog[];
  todayWaterLogs: WaterLog[];
  todayWorkoutLogs: WorkoutLog[];
  achievements: UserAchievement[];
  activeSplit: Split | null;
  splitDays: SplitDay[];
  photos: Photo[];
  weightLogs: WeightLog[];
  todaySupplementLogs: SupplementLog[];
  todayStepsLogs: StepsLog[];
  todayCardioLogs: CardioLog[];
  todaySleepLogs: SleepLog[];
  supplementPlan: string[];
  loading: boolean;
  initialized: boolean;
}

interface AppContextType extends AppState {
  signUp: (email: string, password: string) => Promise<{ error: any; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  changePassword: (password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  createProfile: (profile: Partial<User>) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  saveSettings: (settings: Partial<UserSettings>) => Promise<void>;
  saveSplit: (split: Omit<Split, 'id' | 'user_id' | 'created_at'>, days: Omit<SplitDay, 'id' | 'split_id' | 'created_at'>[]) => Promise<void>;
  saveSupplementPlan: (supplements: string[]) => Promise<void>;
  logFood: (food: Omit<FoodLog, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  deleteFood: (id: string) => Promise<void>;
  logWorkout: (workout: any) => Promise<string | null>;
  logWater: (amount_ml: number) => Promise<void>;
  logWeight: (weight_kg: number) => Promise<void>;
  logSupplement: (name: string, dosage?: string) => Promise<boolean>;
  logSteps: (steps: number) => Promise<void>;
  logCardio: (cardio_type: string, duration_minutes: number, calories_burned: number) => Promise<void>;
  logSleep: (sleep_at: string, wake_at: string) => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  refreshTodayData: () => Promise<void>;
  fetchCompleteHistory: () => Promise<HistoryDay[]>;
  fetchUserProfile: (userId: string) => Promise<User | null>;
  searchUsers: (queryStr: string) => Promise<User[]>;
  fetchUserLogs: (userId: string) => Promise<{ food: FoodLog[]; workouts: WorkoutLog[]; photos: Photo[]; achievements: UserAchievement[] }>;
  fetchUserFullHistory: (userId: string) => Promise<UserFullHistory>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  isFollowing: (userId: string) => Promise<boolean>;
  getWeeklyLeaderboard: () => Promise<LeaderboardEntry[]>;
  uploadImage: (uri: string, path: string) => Promise<string>;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

function toIsoDate(value?: string) {
  if (!value) return getTodayString();
  return new Date(value).toISOString().split('T')[0];
}

function sortWorkoutLogs(logs: WorkoutLog[] = []): WorkoutLog[] {
  return [...logs]
    .map((log) => ({
      ...log,
      exercises: [...(log.exercises || [])]
        .sort((a, b) => a.order_index - b.order_index)
        .map((exercise) => ({
          ...exercise,
          sets: [...(exercise.sets || [])].sort((a, b) => a.set_number - b.set_number),
        })),
    }))
    .sort((a, b) => b.logged_at.localeCompare(a.logged_at));
}

function buildHistoryDays(payload: {
  food: FoodLog[];
  workouts: WorkoutLog[];
  water: WaterLog[];
  supplements: SupplementLog[];
  cardio: CardioLog[];
  sleep: SleepLog[];
  steps: StepsLog[];
  weights: WeightLog[];
}): HistoryDay[] {
  const days = new Map<string, HistoryDay>();

  const ensureDay = (date: string) => {
    if (!days.has(date)) {
      days.set(date, {
        date,
        foods: [],
        workouts: [],
        water: [],
        supplements: [],
        cardio: [],
        sleep: [],
        steps: [],
        weights: [],
        totals: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          water_ml: 0,
          steps: 0,
          cardio_minutes: 0,
          cardio_calories: 0,
        },
      });
    }
    return days.get(date)!;
  };

  payload.food.forEach((item) => {
    const day = ensureDay(toIsoDate(item.logged_at));
    day.foods.push(item);
    day.totals.calories += safeNum(item.calories);
    day.totals.protein += safeNum(item.protein);
    day.totals.carbs += safeNum(item.carbs);
    day.totals.fat += safeNum(item.fat);
  });

  payload.workouts.forEach((item) => {
    ensureDay(toIsoDate(item.logged_at)).workouts.push(item);
  });

  payload.water.forEach((item) => {
    const day = ensureDay(toIsoDate(item.logged_at));
    day.water.push(item);
    day.totals.water_ml += Number(item.amount_ml || 0);
  });

  payload.supplements.forEach((item) => {
    ensureDay(toIsoDate(item.taken_at)).supplements.push(item);
  });

  payload.cardio.forEach((item) => {
    const day = ensureDay(toIsoDate(item.logged_at));
    day.cardio.push(item);
    day.totals.cardio_minutes += Number(item.duration_minutes || 0);
    day.totals.cardio_calories += Number(item.calories_burned || 0);
  });

  payload.sleep.forEach((item) => {
    ensureDay(toIsoDate(item.logged_at)).sleep.push(item);
  });

  payload.steps.forEach((item) => {
    const day = ensureDay(toIsoDate(item.logged_at));
    day.steps.push(item);
    day.totals.steps += Number(item.steps || 0);
  });

  payload.weights.forEach((item) => {
    ensureDay(toIsoDate(item.logged_at)).weights.push(item);
  });

  return [...days.values()]
    .map((day) => ({
      ...day,
      foods: day.foods.sort((a, b) => b.logged_at.localeCompare(a.logged_at)),
      workouts: sortWorkoutLogs(day.workouts),
      water: day.water.sort((a, b) => b.logged_at.localeCompare(a.logged_at)),
      supplements: day.supplements.sort((a, b) => b.taken_at.localeCompare(a.taken_at)),
      cardio: day.cardio.sort((a, b) => b.logged_at.localeCompare(a.logged_at)),
      sleep: day.sleep.sort((a, b) => b.logged_at.localeCompare(a.logged_at)),
      steps: day.steps.sort((a, b) => b.logged_at.localeCompare(a.logged_at)),
      weights: day.weights.sort((a, b) => b.logged_at.localeCompare(a.logged_at)),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    session: null,
    user: null,
    settings: null,
    todayFoodLogs: [],
    todayWaterLogs: [],
    todayWorkoutLogs: [],
    achievements: [],
    activeSplit: null,
    splitDays: [],
    photos: [],
    weightLogs: [],
    todaySupplementLogs: [],
    todayStepsLogs: [],
    todayCardioLogs: [],
    todaySleepLogs: [],
    supplementPlan: [],
    loading: true,
    initialized: false,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const update = useCallback((partial: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  // ── Auth listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const session: SessionShim = { user: { id: firebaseUser.uid, email: firebaseUser.email } };
        update({ session, loading: false, initialized: true });
        loadUserData(firebaseUser.uid);
      } else {
        update({
          session: null,
          user: null,
          settings: null,
          todayFoodLogs: [],
          todayWaterLogs: [],
          todayWorkoutLogs: [],
          achievements: [],
          activeSplit: null,
          splitDays: [],
          photos: [],
          weightLogs: [],
          todaySupplementLogs: [],
          todayStepsLogs: [],
          todayCardioLogs: [],
          todaySleepLogs: [],
          supplementPlan: [],
          loading: false,
          initialized: true,
        });
      }
    });

    return () => unsubscribe();
  }, [update]);

  // ── Load user data ─────────────────────────────────────────────────────
  const loadUserData = async (userId: string) => {
    const today = getTodayString();
    const cachedUser = await cache.getStale<User>(getCacheKey(userId, 'profile'));
    const cachedSettings = await cache.getStale<UserSettings>(getCacheKey(userId, 'settings'));
    const cachedFood = await cache.getStale<FoodLog[]>(getCacheKey(userId, 'food', today));
    const cachedWater = await cache.getStale<WaterLog[]>(getCacheKey(userId, 'water', today));
    const cachedWorkouts = await cache.getStale<WorkoutLog[]>(getCacheKey(userId, 'workouts', today));
    const cachedAchievements = await cache.getStale<UserAchievement[]>(getCacheKey(userId, 'achievements'));
    const cachedPlan = await cache.getStale<string[]>(getCacheKey(userId, 'supplement_plan'));

    if (cachedUser) update({ user: cachedUser });
    if (cachedSettings) {
      update({ settings: cachedSettings });
      if (Array.isArray(cachedSettings.supplement_plan) && cachedSettings.supplement_plan.length > 0) {
        update({ supplementPlan: cachedSettings.supplement_plan });
      }
    }
    if (cachedFood) update({ todayFoodLogs: cachedFood });
    if (cachedWater) update({ todayWaterLogs: cachedWater });
    if (cachedWorkouts) update({ todayWorkoutLogs: sortWorkoutLogs(cachedWorkouts) });
    if (cachedAchievements) update({ achievements: cachedAchievements });
    if (cachedPlan) update({ supplementPlan: cachedPlan });

    refreshUserData(userId);
    // Run achievement check regardless of whether refreshUserData succeeds
    setTimeout(() => runAchievementCheck(), 3000);
  };

  // ── Refresh user data from Firestore ───────────────────────────────────
  const refreshUserData = async (userId: string) => {
    try {
      const today = getTodayString();
      const startOfDay = getStartOfDay(today);
      const endOfDay = getEndOfDay(today);

      const [
        profileSnap,
        settingsSnap,
        foodData,
        waterData,
        workoutData,
        achieveData,
        suppsData,
        stepsData,
        cardioData,
        sleepData,
        photosData,
        weightData,
      ] = await Promise.all([
        getDoc(doc(db, 'users', userId)),
        getDoc(doc(db, 'user_settings', userId)),
        queryCollection<FoodLog>('food_logs', [['user_id', '==', userId], ['logged_at', '>=', startOfDay], ['logged_at', '<=', endOfDay]], 'logged_at', 'desc'),
        queryCollection<WaterLog>('water_logs', [['user_id', '==', userId], ['logged_at', '>=', startOfDay], ['logged_at', '<=', endOfDay]], 'logged_at', 'desc'),
        queryCollection<WorkoutLog>('workout_logs', [['user_id', '==', userId], ['logged_at', '>=', startOfDay], ['logged_at', '<=', endOfDay]], 'logged_at', 'desc'),
        queryCollection<UserAchievement>('user_achievements', [['user_id', '==', userId]]),
        queryCollection<SupplementLog>('supplement_logs', [['user_id', '==', userId], ['taken_at', '>=', startOfDay], ['taken_at', '<=', endOfDay]], 'taken_at', 'desc'),
        queryCollection<StepsLog>('step_logs', [['user_id', '==', userId], ['logged_at', '>=', startOfDay], ['logged_at', '<=', endOfDay]], 'logged_at', 'desc'),
        queryCollection<CardioLog>('cardio_logs', [['user_id', '==', userId], ['logged_at', '>=', startOfDay], ['logged_at', '<=', endOfDay]], 'logged_at', 'desc'),
        queryCollection<SleepLog>('sleep_logs', [['user_id', '==', userId], ['logged_at', '>=', startOfDay], ['logged_at', '<=', endOfDay]], 'logged_at', 'desc'),
        queryCollection<Photo>('photos', [['user_id', '==', userId]], 'created_at', 'desc', 50),
        queryCollection<WeightLog>('weight_logs', [['user_id', '==', userId]], 'logged_at', 'desc', 30),
      ]);

      const updates: Partial<AppState> = {};

      if (profileSnap.exists()) {
        const profile = { id: profileSnap.id, ...profileSnap.data() } as User;
        updates.user = profile;
        cache.set(getCacheKey(userId, 'profile'), profile);
      }
      if (settingsSnap.exists()) {
        const settings = { id: settingsSnap.id, user_id: userId, ...settingsSnap.data() } as UserSettings;
        updates.settings = settings;
        cache.set(getCacheKey(userId, 'settings'), settings);
        if (Array.isArray(settings.supplement_plan) && settings.supplement_plan.length > 0) {
          updates.supplementPlan = settings.supplement_plan;
        }
      }

      updates.todayFoodLogs = foodData;
      cache.set(getCacheKey(userId, 'food', today), foodData);

      updates.todayWaterLogs = waterData;
      cache.set(getCacheKey(userId, 'water', today), waterData);

      const sortedWorkouts = sortWorkoutLogs(workoutData);
      updates.todayWorkoutLogs = sortedWorkouts;
      cache.set(getCacheKey(userId, 'workouts', today), sortedWorkouts);

      updates.achievements = achieveData;
      cache.set(getCacheKey(userId, 'achievements'), achieveData);

      updates.todaySupplementLogs = suppsData;
      updates.todayStepsLogs = stepsData;
      updates.todayCardioLogs = cardioData;
      updates.todaySleepLogs = sleepData;
      updates.photos = photosData;
      updates.weightLogs = weightData;

      // Active split
      const splitsData = await queryCollection<Split>('splits', [['user_id', '==', userId], ['is_active', '==', true]], undefined, 'desc', 1);
      if (splitsData.length > 0) {
        updates.activeSplit = splitsData[0];
        const daysData = await queryCollection<SplitDay>('split_days', [['split_id', '==', splitsData[0].id]], 'day_number', 'asc');
        updates.splitDays = daysData;
      } else {
        updates.activeSplit = null;
        updates.splitDays = [];
      }

      update(updates);
      setTimeout(() => runAchievementCheck(), 2000);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // ── Auth methods ───────────────────────────────────────────────────────
  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return { error: null, needsConfirmation: false };
    } catch (e: any) {
      return { error: { message: e.message || 'Sign up failed' }, needsConfirmation: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (e: any) {
      return { error: { message: e.message || 'Sign in failed' } };
    }
  };

  const changePassword = async (password: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      await updatePassword(user, password);
      Toast.show({ type: 'success', text1: 'Password Updated', text2: 'Your account password has been changed.' });
      return { error: null };
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message || 'Failed to update password' });
      return { error: { message: e.message } };
    }
  };

  const doSignOut = async () => {
    await cache.clear();
    await firebaseSignOut(auth);
    update({
      session: null,
      user: null,
      settings: null,
      todayFoodLogs: [],
      todayWaterLogs: [],
      todayWorkoutLogs: [],
      achievements: [],
      activeSplit: null,
      splitDays: [],
      photos: [],
      weightLogs: [],
      todaySupplementLogs: [],
      todayStepsLogs: [],
      todayCardioLogs: [],
      todaySleepLogs: [],
      supplementPlan: [],
    });
  };

  const deleteAccount = async () => {
    const userId = stateRef.current.session?.user?.id;
    const firebaseUser = auth.currentUser;
    if (!userId || !firebaseUser) throw new Error('Not signed in');

    const collections = [
      'food_logs', 'workout_logs', 'water_logs', 'weight_logs',
      'sleep_logs', 'supplement_logs', 'cardio_logs', 'step_logs',
      'split_days', 'splits', 'photos', 'follows', 'user_settings',
    ];

    for (const col of collections) {
      const snap = await getDocs(
        query(collection(db, col), where('user_id', '==', userId))
      );
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      if (snap.docs.length > 0) await batch.commit();
    }

    // Delete follows where this user is the target
    const followedSnap = await getDocs(
      query(collection(db, 'follows'), where('following_id', '==', userId))
    );
    if (followedSnap.docs.length > 0) {
      const batch = writeBatch(db);
      followedSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // Delete user profile doc
    await deleteDoc(doc(db, 'users', userId));

    // Clear local state
    await cache.clear();
    update({
      session: null, user: null, settings: null,
      todayFoodLogs: [], todayWaterLogs: [], todayWorkoutLogs: [],
      achievements: [], activeSplit: null, splitDays: [],
      photos: [], weightLogs: [], todaySupplementLogs: [],
      todayStepsLogs: [], todayCardioLogs: [], todaySleepLogs: [],
      supplementPlan: [],
    });

    // Delete Firebase auth user last
    await deleteUser(firebaseUser);
  };

  // ── Profile ────────────────────────────────────────────────────────────
  const createProfile = async (profile: Partial<User>) => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return;

    const fullProfile = {
      ...profile,
      username_lower: (profile.username || '').toLowerCase(),
      onboarding_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', userId), fullProfile, { merge: true });
    const savedProfile = { id: userId, ...fullProfile } as User;
    update({ user: savedProfile });
    cache.set(getCacheKey(userId, 'profile'), savedProfile);
  };

  const updateProfile = async (updates: Partial<User>) => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return;

    const prev = stateRef.current.user;
    const optimistic = { ...prev, ...updates } as User;
    update({ user: optimistic });

    try {
      const firestoreUpdates: any = { ...updates, updated_at: new Date().toISOString() };
      if (updates.username) {
        firestoreUpdates.username_lower = updates.username.toLowerCase();
      }
      await updateDoc(doc(db, 'users', userId), firestoreUpdates);
      cache.set(getCacheKey(userId, 'profile'), optimistic);
    } catch {
      update({ user: prev });
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update profile' });
    }
  };

  // ── Settings ───────────────────────────────────────────────────────────
  const saveSettings = async (settingsUpdate: Partial<UserSettings>) => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return;

    const prev = stateRef.current.settings;
    const optimistic = { ...prev, ...settingsUpdate, user_id: userId } as UserSettings;
    update({ settings: optimistic });

    try {
      await setDoc(doc(db, 'user_settings', userId), { ...settingsUpdate, updated_at: new Date().toISOString() }, { merge: true });
      cache.set(getCacheKey(userId, 'settings'), optimistic);
    } catch (e: any) {
      update({ settings: prev });
      Toast.show({ type: 'error', text1: 'Error', text2: e.message || 'Failed to save settings' });
    }
  };

  // ── Split ──────────────────────────────────────────────────────────────
  const saveSplit = async (
    split: Omit<Split, 'id' | 'user_id' | 'created_at'>,
    days: Omit<SplitDay, 'id' | 'split_id' | 'created_at'>[]
  ) => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return;

    // Deactivate old splits
    const oldSplits = await queryCollection<Split>('splits', [['user_id', '==', userId], ['is_active', '==', true]]);
    const batch = writeBatch(db);
    for (const s of oldSplits) {
      batch.update(doc(db, 'splits', s.id), { is_active: false });
    }
    await batch.commit();

    // Create new split
    const splitId = genId();
    const now = new Date().toISOString();
    const splitDoc = { ...split, user_id: userId, is_active: true, created_at: now };
    await setDoc(doc(db, 'splits', splitId), splitDoc);

    // Create days
    const savedDays: SplitDay[] = [];
    for (let i = 0; i < days.length; i++) {
      const dayId = genId();
      const dayDoc = { ...days[i], split_id: splitId, day_number: i, created_at: now };
      await setDoc(doc(db, 'split_days', dayId), dayDoc);
      savedDays.push({ id: dayId, ...dayDoc } as SplitDay);
    }

    update({ activeSplit: { id: splitId, ...splitDoc } as Split, splitDays: savedDays });
    setTimeout(() => runAchievementCheck(), 500);
  };

  // ── Supplement plan ────────────────────────────────────────────────────
  const saveSupplementPlan = async (supplements: string[]) => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return;

    const normalized = [...new Set(supplements.map((item) => item.trim()).filter(Boolean))];
    const nextSettings = { ...(stateRef.current.settings || {}), user_id: userId, supplement_plan: normalized } as UserSettings;
    update({ supplementPlan: normalized, settings: nextSettings });
    await cache.set(getCacheKey(userId, 'supplement_plan'), normalized, SUPPLEMENT_PLAN_TTL);
    await cache.set(getCacheKey(userId, 'settings'), nextSettings);

    try {
      await setDoc(doc(db, 'user_settings', userId), { supplement_plan: normalized, updated_at: new Date().toISOString() }, { merge: true });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Supplement stack error', text2: e.message || 'Failed to save' });
    }
  };

  // ── Food logs ──────────────────────────────────────────────────────────
  const logFood = async (food: Omit<FoodLog, 'id' | 'user_id' | 'created_at'>) => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return;

    // Sanitize numeric fields
    const sanitized = {
      ...food,
      calories: safeNum(food.calories),
      protein: safeNum(food.protein),
      carbs: safeNum(food.carbs),
      fat: safeNum(food.fat),
    };

    const tempId = 'temp_' + Date.now();
    const now = new Date().toISOString();
    const optimistic: FoodLog = { ...sanitized, id: tempId, user_id: userId, created_at: now } as FoodLog;

    const prevLogs = [...stateRef.current.todayFoodLogs];
    update({ todayFoodLogs: [optimistic, ...prevLogs] });

    try {
      const docId = genId();
      const docData = { ...sanitized, user_id: userId, created_at: now };
      await setDoc(doc(db, 'food_logs', docId), docData);
      const saved: FoodLog = { id: docId, ...docData } as FoodLog;
      const updated = stateRef.current.todayFoodLogs.map((item) => item.id === tempId ? saved : item);
      update({ todayFoodLogs: updated });
      cache.set(getCacheKey(userId, 'food', getTodayString()), updated);
      setTimeout(() => runAchievementCheck(), 500);
    } catch {
      update({ todayFoodLogs: prevLogs });
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to log food' });
    }
  };

  const deleteFood = async (id: string) => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return;

    const prevLogs = [...stateRef.current.todayFoodLogs];
    update({ todayFoodLogs: prevLogs.filter((item) => item.id !== id) });

    try {
      await deleteDoc(doc(db, 'food_logs', id));
    } catch {
      update({ todayFoodLogs: prevLogs });
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete food log' });
    }
  };

  // ── Workout logs (denormalized: exercises + sets stored inside the doc) ──
  const logWorkout = async (workout: any): Promise<string | null> => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return null;

    try {
      const { exercises, ...workoutData } = workout;
      const now = new Date().toISOString();
      const docId = genId();

      // Denormalize exercises + sets into the workout document
      const exercisesWithIds = (exercises || []).map((ex: any, exIdx: number) => {
        const exId = genId();
        const setsWithIds = (ex.sets || []).map((s: any, sIdx: number) => ({
          id: genId(),
          workout_exercise_id: exId,
          set_number: sIdx + 1,
          weight_kg: s.weight_kg || 0,
          reps: s.reps || 0,
          is_warmup: s.is_warmup || false,
          created_at: now,
        }));
        return {
          id: exId,
          workout_log_id: docId,
          exercise_name: ex.exercise_name || ex.name || '',
          muscle_group: ex.muscle_group || '',
          order_index: ex.order_index ?? exIdx,
          created_at: now,
          sets: setsWithIds,
        };
      });

      const docData = {
        ...workoutData,
        user_id: userId,
        logged_at: now,
        created_at: now,
        exercises: exercisesWithIds,
      };

      await setDoc(doc(db, 'workout_logs', docId), docData);

      if (stateRef.current.settings && stateRef.current.splitDays.length > 0) {
        const nextDay = ((stateRef.current.settings.current_split_day || 0) + 1) % stateRef.current.splitDays.length;
        await saveSettings({ current_split_day: nextDay });
      }

      const savedWorkout: WorkoutLog = { id: docId, ...docData } as any;
      const prevWorkouts = [...stateRef.current.todayWorkoutLogs];
      update({ todayWorkoutLogs: sortWorkoutLogs([savedWorkout, ...prevWorkouts]) });
      setTimeout(() => runAchievementCheck(), 500);
      return docId;
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to log workout' });
      return null;
    }
  };

  // ── Water logs ─────────────────────────────────────────────────────────
  const logWater = async (amount_ml: number) => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return;

    const tempId = 'temp_' + Date.now();
    const now = new Date().toISOString();
    const optimistic: WaterLog = { id: tempId, user_id: userId, amount_ml, logged_at: now, created_at: now };

    const prevLogs = [...stateRef.current.todayWaterLogs];
    update({ todayWaterLogs: [optimistic, ...prevLogs] });

    try {
      const docId = genId();
      const docData = { user_id: userId, amount_ml, logged_at: now, created_at: now };
      await setDoc(doc(db, 'water_logs', docId), docData);
      const saved: WaterLog = { id: docId, ...docData };
      const updated = stateRef.current.todayWaterLogs.map((item) => item.id === tempId ? saved : item);
      update({ todayWaterLogs: updated });
      cache.set(getCacheKey(userId, 'water', getTodayString()), updated);
      setTimeout(() => runAchievementCheck(), 500);
    } catch {
      update({ todayWaterLogs: prevLogs });
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to log water' });
    }
  };

  // ── Weight logs ────────────────────────────────────────────────────────
  const logWeight = async (weight_kg: number) => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return;
    weight_kg = safeNum(weight_kg);
    if (weight_kg <= 0 || weight_kg > 500) return;

    const now = new Date().toISOString();
    try {
      const docId = genId();
      const docData = { user_id: userId, weight_kg, logged_at: now, created_at: now };
      await setDoc(doc(db, 'weight_logs', docId), docData);
      await updateProfile({ current_weight_kg: weight_kg });
      const entry: WeightLog = { id: docId, ...docData };
      update({ weightLogs: [entry, ...stateRef.current.weightLogs] });
      setTimeout(() => runAchievementCheck(), 500);
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to log weight' });
    }
  };

  // ── Supplement logs ────────────────────────────────────────────────────
  const logSupplement = async (name: string, dosage?: string): Promise<boolean> => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return false;

    const normalizedName = name.trim();
    if (!normalizedName) return false;

    try {
      const docId = genId();
      const now = new Date().toISOString();
      const docData = {
        user_id: userId,
        supplement_name: normalizedName,
        dosage: dosage?.trim() || 'Taken',
        taken_at: now,
        created_at: now,
      };
      await setDoc(doc(db, 'supplement_logs', docId), docData);
      const saved: SupplementLog = { id: docId, ...docData };
      update({ todaySupplementLogs: [saved, ...stateRef.current.todaySupplementLogs] });
      return true;
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Supplement error', text2: e.message || 'Failed to log supplement' });
      return false;
    }
  };

  // ── Steps logs ─────────────────────────────────────────────────────────
  const logSteps = async (steps: number) => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return;
    steps = safeNum(steps);
    if (steps < 0 || steps > 200000) return;

    try {
      const docId = genId();
      const now = new Date().toISOString();
      const docData = { user_id: userId, steps, logged_at: now, created_at: now };
      await setDoc(doc(db, 'step_logs', docId), docData);
      const saved: StepsLog = { id: docId, ...docData };
      update({ todayStepsLogs: [saved, ...stateRef.current.todayStepsLogs] });
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to log steps' });
    }
  };

  // ── Cardio logs ────────────────────────────────────────────────────────
  const logCardio = async (cardio_type: string, duration_minutes: number, calories_burned: number) => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return;
    duration_minutes = safeNum(duration_minutes);
    calories_burned = safeNum(calories_burned);

    try {
      const docId = genId();
      const now = new Date().toISOString();
      const docData = { cardio_type, duration_minutes, calories_burned, user_id: userId, logged_at: now, created_at: now };
      await setDoc(doc(db, 'cardio_logs', docId), docData);
      const saved: CardioLog = { id: docId, ...docData };
      update({ todayCardioLogs: [saved, ...stateRef.current.todayCardioLogs] });
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to log cardio' });
    }
  };

  // ── Sleep logs ─────────────────────────────────────────────────────────
  const logSleep = async (sleep_at: string, wake_at: string) => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return;

    try {
      const docId = genId();
      const now = new Date().toISOString();
      const docData = { sleep_at, wake_at, user_id: userId, logged_at: now, created_at: now };
      await setDoc(doc(db, 'sleep_logs', docId), docData);
      const saved: SleepLog = { id: docId, ...docData };
      update({ todaySleepLogs: [saved, ...stateRef.current.todaySleepLogs] });
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to log sleep' });
    }
  };

  // ── Achievements ───────────────────────────────────────────────────────
  const unlockAchievement = async (achievementId: string) => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return;

    const already = stateRef.current.achievements.find((item) => item.achievement_id === achievementId);
    if (already) return;

    try {
      const docId = genId();
      const now = new Date().toISOString();
      const docData = { user_id: userId, achievement_id: achievementId, unlocked_at: now };
      await setDoc(doc(db, 'user_achievements', docId), docData);
      const saved: UserAchievement = { id: docId, ...docData };
      const updated = [...stateRef.current.achievements, saved];
      update({ achievements: updated });
      cache.set(getCacheKey(userId, 'achievements'), updated);

      const achievement = getAchievementById(achievementId);
      if (achievement) {
        Toast.show({
          type: 'success',
          text1: 'Achievement Unlocked!',
          text2: `${achievement.name} - ${achievement.description}`,
          visibilityTime: 3500,
          topOffset: 60,
        });
      }
    } catch (err) {
      console.warn('[unlockAchievement] failed:', achievementId, err);
    }
  };

  // ── Achievement check ──────────────────────────────────────────────────
  const runAchievementCheck = async () => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return;

    try {
      const [allFood, allWorkouts, allWater, allWeight, photosSnap] = await Promise.all([
        queryCollection<FoodLog>('food_logs', [['user_id', '==', userId]]),
        queryCollection<WorkoutLog>('workout_logs', [['user_id', '==', userId]]),
        queryCollection<WaterLog>('water_logs', [['user_id', '==', userId]]),
        queryCollection<WeightLog>('weight_logs', [['user_id', '==', userId]]),
        queryCollection<Photo>('photos', [['user_id', '==', userId]]),
      ]);

      const todayWater = stateRef.current.todayWaterLogs.reduce((sum, item) => sum + item.amount_ml, 0);
      const todayProtein = stateRef.current.todayFoodLogs.reduce((sum, item) => sum + Number(item.protein || 0), 0);
      const settings = stateRef.current.settings;

      const stats = buildStatsFromData({
        allFoodLogs: allFood,
        allWorkoutLogs: sortWorkoutLogs(allWorkouts),
        allWaterLogs: allWater,
        allWeightLogs: allWeight,
        photoCount: photosSnap.length,
        onboardingComplete: !!stateRef.current.user?.onboarding_completed,
        profileComplete: !!stateRef.current.user?.username,
        splitCreated: !!stateRef.current.activeSplit,
        todayWater,
        todayProtein,
        dailyCalorieTarget: settings?.target_calories || 2000,
        dailyWaterTarget: settings?.water_goal_ml || 2500,
        dailyProteinTarget: settings?.target_protein || 120,
      });

      const unlockedIds = new Set(stateRef.current.achievements.map((item) => item.achievement_id));
      const newlyUnlocked = checkNewAchievements(stats, unlockedIds);

      for (const achievement of newlyUnlocked) {
        await unlockAchievement(achievement.id);
      }
    } catch (error) {
      console.warn('[AchievementCheck] error (non-critical):', error);
    }
  };

  // ── Refresh helper ─────────────────────────────────────────────────────
  const refreshTodayData = async () => {
    const userId = stateRef.current.session?.user?.id;
    if (userId) await refreshUserData(userId);
  };

  // ── Complete history ───────────────────────────────────────────────────
  const fetchCompleteHistory = async (): Promise<HistoryDay[]> => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return [];

    const [food, workouts, water, supplements, cardio, sleep, steps, weights] = await Promise.all([
      queryCollection<FoodLog>('food_logs', [['user_id', '==', userId]], 'logged_at', 'desc'),
      queryCollection<WorkoutLog>('workout_logs', [['user_id', '==', userId]], 'logged_at', 'desc'),
      queryCollection<WaterLog>('water_logs', [['user_id', '==', userId]], 'logged_at', 'desc'),
      queryCollection<SupplementLog>('supplement_logs', [['user_id', '==', userId]], 'taken_at', 'desc'),
      queryCollection<CardioLog>('cardio_logs', [['user_id', '==', userId]], 'logged_at', 'desc'),
      queryCollection<SleepLog>('sleep_logs', [['user_id', '==', userId]], 'logged_at', 'desc'),
      queryCollection<StepsLog>('step_logs', [['user_id', '==', userId]], 'logged_at', 'desc'),
      queryCollection<WeightLog>('weight_logs', [['user_id', '==', userId]], 'logged_at', 'desc'),
    ]);

    return buildHistoryDays({
      food,
      workouts: sortWorkoutLogs(workouts),
      water,
      supplements,
      cardio,
      sleep,
      steps,
      weights,
    });
  };

  // ── Social features ────────────────────────────────────────────────────
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as User : null;
  };

  const searchUsers = async (queryStr: string): Promise<User[]> => {
    if (!queryStr.trim()) return [];
    const lowerQ = queryStr.toLowerCase();
    const endStr = lowerQ.slice(0, -1) + String.fromCharCode(lowerQ.charCodeAt(lowerQ.length - 1) + 1);
    const q = query(
      collection(db, 'users'),
      where('username_lower', '>=', lowerQ),
      where('username_lower', '<', endStr),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
  };

  const fetchUserLogs = async (userId: string) => {
    const [food, workouts, photos, achievements] = await Promise.all([
      queryCollection<FoodLog>('food_logs', [['user_id', '==', userId]], 'logged_at', 'desc', 20),
      queryCollection<WorkoutLog>('workout_logs', [['user_id', '==', userId]], 'logged_at', 'desc', 20),
      queryCollection<Photo>('photos', [['user_id', '==', userId]], 'created_at', 'desc', 20),
      queryCollection<UserAchievement>('user_achievements', [['user_id', '==', userId]]),
    ]);
    return { food, workouts: sortWorkoutLogs(workouts), photos, achievements };
  };

  const fetchUserFullHistory = async (userId: string): Promise<UserFullHistory> => {
    const [food, workouts, water, supplements, cardio, sleep, steps, weights, achievements] = await Promise.all([
      queryCollection<FoodLog>('food_logs', [['user_id', '==', userId]], 'logged_at', 'desc'),
      queryCollection<WorkoutLog>('workout_logs', [['user_id', '==', userId]], 'logged_at', 'desc'),
      queryCollection<WaterLog>('water_logs', [['user_id', '==', userId]], 'logged_at', 'desc'),
      queryCollection<SupplementLog>('supplement_logs', [['user_id', '==', userId]], 'taken_at', 'desc'),
      queryCollection<CardioLog>('cardio_logs', [['user_id', '==', userId]], 'logged_at', 'desc'),
      queryCollection<SleepLog>('sleep_logs', [['user_id', '==', userId]], 'logged_at', 'desc'),
      queryCollection<StepsLog>('step_logs', [['user_id', '==', userId]], 'logged_at', 'desc'),
      queryCollection<WeightLog>('weight_logs', [['user_id', '==', userId]], 'logged_at', 'desc'),
      queryCollection<UserAchievement>('user_achievements', [['user_id', '==', userId]]),
    ]);
    return {
      food,
      workouts: sortWorkoutLogs(workouts),
      water,
      supplements,
      cardio,
      sleep,
      steps,
      weights,
      achievements,
    };
  };

  const followUser = async (targetUserId: string) => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return;
    const followId = `${userId}_${targetUserId}`;
    await setDoc(doc(db, 'follows', followId), {
      follower_id: userId,
      following_id: targetUserId,
      created_at: new Date().toISOString(),
    });
  };

  const unfollowUser = async (targetUserId: string) => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return;
    const followId = `${userId}_${targetUserId}`;
    await deleteDoc(doc(db, 'follows', followId));
  };

  const isFollowing = async (targetUserId: string): Promise<boolean> => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return false;
    const followId = `${userId}_${targetUserId}`;
    const snap = await getDoc(doc(db, 'follows', followId));
    return snap.exists();
  };

  const getWeeklyLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const userId = stateRef.current.session?.user?.id;
    if (!userId) return [];

    const followsData = await queryCollection<{ following_id: string }>('follows', [['follower_id', '==', userId]]);
    const followingIds = [userId, ...followsData.map(f => f.following_id)];

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString();

    const entries: LeaderboardEntry[] = await Promise.all(
      followingIds.map(async (uid) => {
        const [profileSnap, workouts, foodData] = await Promise.all([
          getDoc(doc(db, 'users', uid)),
          queryCollection<WorkoutLog>('workout_logs', [['user_id', '==', uid], ['logged_at', '>=', weekStartStr]]),
          queryCollection<FoodLog>('food_logs', [['user_id', '==', uid], ['logged_at', '>=', weekStartStr]]),
        ]);

        const sorted = sortWorkoutLogs(workouts);
        let totalVolume = 0;
        sorted.forEach(w => w.exercises?.forEach(ex => ex.sets?.forEach(s => { totalVolume += (s.weight_kg || 0) * (s.reps || 0); })));

        const caloriesLogged = foodData.reduce((s, f) => s + (f.calories || 0), 0);
        const proteinConsumed = foodData.reduce((s, f) => s + (f.protein || 0), 0);

        const days = new Set([
          ...sorted.map(w => w.logged_at.split('T')[0]),
          ...foodData.map(f => f.logged_at?.split?.('T')?.[0] || ''),
        ].filter(Boolean));

        const profile = profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } as User : null;

        return {
          user: profile as User,
          totalVolume: Math.round(totalVolume),
          workoutsCompleted: sorted.length,
          proteinConsumed: Math.round(proteinConsumed),
          caloriesLogged: Math.round(caloriesLogged),
          daysLogged: days.size,
          rank: 0,
        };
      })
    );

    return entries
      .filter(e => e.user)
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  };

  // ── Image upload ───────────────────────────────────────────────────────
  const uploadImage = async (uri: string, path: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const imageRef = storageRef(storage, path);
    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  };

  return (
    <AppContext.Provider value={{
      ...state,
      signUp,
      signIn,
      changePassword,
      signOut: doSignOut,
      deleteAccount,
      createProfile,
      updateProfile,
      saveSettings,
      saveSplit,
      saveSupplementPlan,
      logFood,
      deleteFood,
      logWorkout,
      logWater,
      logWeight,
      logSupplement,
      logSteps,
      logCardio,
      logSleep,
      unlockAchievement,
      refreshTodayData,
      fetchCompleteHistory,
      fetchUserProfile,
      searchUsers,
      fetchUserLogs,
      fetchUserFullHistory,
      followUser,
      unfollowUser,
      isFollowing,
      getWeeklyLeaderboard,
      uploadImage,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
