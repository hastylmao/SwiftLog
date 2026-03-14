import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../store/AppContext';
import { User, FoodLog, WorkoutLog, UserFullHistory, SleepLog } from '../../types';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import GlowingIcon from '../../components/ui/GlowingIcon';
import { getAchievementById } from '../../constants/achievements';
import { TIER_CONFIG } from '../../constants/icons';

const G = {
  bg: '#020408',
  surface: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#00E5FF',
  green: '#4ADE80',
  orange: '#EC5B13',
  purple: '#A855F7',
  gold: '#FFD700',
  text: '#FFFFFF',
  sub: 'rgba(255,255,255,0.60)',
  mute: 'rgba(255,255,255,0.35)',
};

type TabId = 'overview' | 'workouts' | 'nutrition' | 'vitals' | 'achievements';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function sleepDuration(s: SleepLog) {
  const diff = Math.abs(new Date(s.wake_at).getTime() - new Date(s.sleep_at).getTime());
  const h = Math.floor(diff / 3600000);
  const m = Math.round((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function UserProfileScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const { fetchUserProfile, fetchUserFullHistory, followUser, unfollowUser, isFollowing, session } = useApp();
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<UserFullHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = session?.user?.id === userId;

  useEffect(() => { loadProfile(); }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileData, hist, followStatus] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserFullHistory(userId),
        isFollowing(userId),
      ]);
      setUser(profileData);
      setHistory(hist);
      setFollowing(followStatus);
    } catch {}
    setLoading(false);
  };

  const handleFollowToggle = async () => {
    setFollowLoading(true);
    try {
      if (following) { await unfollowUser(userId); setFollowing(false); }
      else { await followUser(userId); setFollowing(true); }
    } catch {}
    setFollowLoading(false);
  };

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <AnimatedBackground />
      <ActivityIndicator size="large" color={G.accent} />
    </View>
  );

  if (!user) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <AnimatedBackground />
      <Text style={{ color: G.sub, fontSize: 16 }}>User not found</Text>
    </View>
  );

  const totalCals = history?.food?.reduce((s, f) => s + f.calories, 0) || 0;
  const totalProtein = history?.food?.reduce((s, f) => s + f.protein, 0) || 0;
  const totalWorkouts = history?.workouts?.length || 0;
  const achievementCount = history?.achievements?.length || 0;

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'grid-outline' },
    { id: 'workouts', label: 'Workouts', icon: 'barbell-outline' },
    { id: 'nutrition', label: 'Nutrition', icon: 'restaurant-outline' },
    { id: 'vitals', label: 'Vitals', icon: 'pulse-outline' },
    { id: 'achievements', label: 'Awards', icon: 'trophy-outline' },
  ];

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={16}>
        <View style={styles.backBtnInner}>
          <Ionicons name="arrow-back" size={22} color={G.text} />
        </View>
      </Pressable>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.profileHeader}>
          <LinearGradient
            colors={[G.accent, '#4A90FF', G.purple]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          >
            <View style={styles.avatarInner}>
              <LinearGradient colors={[G.accent, '#4A90FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
                <Text style={styles.avatarText}>{(user.username || 'U')[0].toUpperCase()}</Text>
              </LinearGradient>
            </View>
          </LinearGradient>

          <Text style={styles.username}>{(user.username || '').replace(/^\w/, (c: string) => c.toUpperCase())}</Text>
          <Text style={styles.bio}>{user.age}y · {user.gender} · {user.height_cm}cm · {user.current_weight_kg}kg</Text>

          <View style={styles.pillRow}>
            <StatPill icon="flame" color={G.orange} value={`${totalCals.toLocaleString()} kcal`} />
            <StatPill icon="barbell" color={G.green} value={`${totalWorkouts} workouts`} />
            <StatPill icon="trophy" color={G.gold} value={`${achievementCount} badges`} />
          </View>

          {!isOwnProfile && (
            <Pressable onPress={handleFollowToggle} disabled={followLoading} style={[styles.followBtn, following && styles.followBtnActive]}>
              {following
                ? <><Ionicons name="checkmark" size={16} color={G.accent} /><Text style={[styles.followBtnText, { color: G.accent }]}>Following</Text></>
                : <><Ionicons name="person-add-outline" size={16} color={G.text} /><Text style={styles.followBtnText}>Follow</Text></>
              }
            </Pressable>
          )}
        </Animated.View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
          {TABS.map(tab => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            >
              <Ionicons name={tab.icon as any} size={15} color={activeTab === tab.id ? G.accent : G.sub} />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.tabBody}>
          {activeTab === 'overview' && <OverviewTab history={history} totalCals={totalCals} totalProtein={totalProtein} totalWorkouts={totalWorkouts} achievementCount={achievementCount} />}
          {activeTab === 'workouts' && <WorkoutsTab workouts={history?.workouts || []} />}
          {activeTab === 'nutrition' && <NutritionTab food={history?.food || []} />}
          {activeTab === 'vitals' && <VitalsTab history={history} />}
          {activeTab === 'achievements' && <AchievementsTab achievements={history?.achievements || []} />}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

// ─── OVERVIEW TAB ──────────────────────────────────────────────────────────
function OverviewTab({ history, totalCals, totalProtein, totalWorkouts, achievementCount }: any) {
  return (
    <View>
      <View style={styles.statsGrid}>
        <StatCard icon="flame" label="Total Calories" value={totalCals.toLocaleString()} color={G.orange} />
        <StatCard icon="barbell" label="Workouts" value={`${totalWorkouts}`} color={G.green} />
        <StatCard icon="nutrition" label="Protein" value={`${Math.round(totalProtein)}g`} color={G.accent} />
        <StatCard icon="trophy" label="Achievements" value={`${achievementCount}`} color={G.gold} />
      </View>

      {(history?.workouts?.length || 0) > 0 && <SectionHeader title="Recent Workouts" />}
      {(history?.workouts || []).slice(0, 3).map((w: WorkoutLog, i: number) => (
        <Animated.View key={w.id} entering={FadeInDown.delay(i * 60).duration(300)}>
          <WorkoutRow workout={w} />
        </Animated.View>
      ))}

      {(history?.food?.length || 0) > 0 && <SectionHeader title="Recent Meals" />}
      {(history?.food || []).slice(0, 4).map((f: FoodLog, i: number) => (
        <Animated.View key={f.id} entering={FadeInDown.delay(i * 50).duration(300)}>
          <FoodRow food={f} />
        </Animated.View>
      ))}
    </View>
  );
}

// ─── WORKOUTS TAB ──────────────────────────────────────────────────────────
function WorkoutsTab({ workouts }: { workouts: WorkoutLog[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!workouts.length) return <EmptyState icon="barbell-outline" label="No workouts logged yet" />;
  return (
    <View>
      {workouts.map((w, i) => {
        const isExp = expanded === w.id;
        const vol = w.exercises?.reduce((sv, ex) => sv + (ex.sets?.reduce((ss, s) => ss + (s.weight_kg || 0) * (s.reps || 0), 0) || 0), 0) || 0;
        return (
          <Animated.View key={w.id} entering={FadeInDown.delay(Math.min(i, 12) * 50).duration(300)}>
            <Pressable onPress={() => setExpanded(isExp ? null : w.id)} style={styles.workoutCard}>
              <View style={[styles.stripBar, { backgroundColor: G.green }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{w.title || 'Workout'}</Text>
                <Text style={styles.cardMeta}>
                  {formatDate(w.logged_at)}{w.duration_minutes ? ` · ${w.duration_minutes}min` : ''} · {w.exercises?.length || 0} exercises{vol > 0 ? ` · ${vol.toLocaleString()}kg vol` : ''}
                </Text>
              </View>
              <Ionicons name={isExp ? 'chevron-up' : 'chevron-down'} size={18} color={G.sub} />
            </Pressable>
            {isExp && (w.exercises || []).map((ex, ei) => (
              <View key={ex.id} style={styles.exerciseBlock}>
                <Text style={styles.exName}>{ex.exercise_name}{ex.muscle_group ? ` (${ex.muscle_group})` : ''}</Text>
                {(ex.sets || []).map((s, si) => (
                  <Text key={s.id} style={styles.setRow}>
                    Set {si + 1}:{' '}
                    <Text style={{ color: G.accent }}>{s.weight_kg}kg × {s.reps} reps</Text>
                    {s.is_warmup ? <Text style={{ color: G.mute }}> (warmup)</Text> : null}
                  </Text>
                ))}
              </View>
            ))}
          </Animated.View>
        );
      })}
    </View>
  );
}

// ─── NUTRITION TAB ─────────────────────────────────────────────────────────
function NutritionTab({ food }: { food: FoodLog[] }) {
  if (!food.length) return <EmptyState icon="restaurant-outline" label="No food logged yet" />;
  const byDate: Record<string, FoodLog[]> = {};
  food.forEach(f => { const d = f.logged_at.split('T')[0]; if (!byDate[d]) byDate[d] = []; byDate[d].push(f); });
  return (
    <View>
      {Object.entries(byDate).slice(0, 30).map(([date, items]) => {
        const dt = items.reduce((t, f) => ({ cal: t.cal + f.calories, p: t.p + f.protein, c: t.c + f.carbs, fat: t.fat + f.fat }), { cal: 0, p: 0, c: 0, fat: 0 });
        return (
          <View key={date} style={{ marginBottom: 14 }}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{formatDate(date + 'T00:00:00')}</Text>
              <Text style={styles.dayTotals}>{Math.round(dt.cal)} kcal · P{Math.round(dt.p)} C{Math.round(dt.c)} F{Math.round(dt.fat)}</Text>
            </View>
            {items.map((f, i) => (
              <Animated.View key={f.id} entering={FadeInDown.delay(i * 40).duration(280)}>
                <FoodRow food={f} />
              </Animated.View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

// ─── VITALS TAB ────────────────────────────────────────────────────────────
function VitalsTab({ history }: { history: UserFullHistory | null }) {
  const hasAny = (history?.water?.length || 0) + (history?.supplements?.length || 0) +
    (history?.sleep?.length || 0) + (history?.weights?.length || 0) +
    (history?.steps?.length || 0) + (history?.cardio?.length || 0) > 0;
  if (!hasAny) return <EmptyState icon="pulse-outline" label="No vitals logged yet" />;
  return (
    <View>
      {(history?.weights?.length || 0) > 0 && <>
        <SectionHeader title="Weight History" />
        {history!.weights.slice(0, 20).map(w => (
          <View key={w.id} style={styles.vRow}>
            <Ionicons name="scale-outline" size={16} color={G.purple} />
            <Text style={styles.vLabel}>{formatDate(w.logged_at)}</Text>
            <Text style={[styles.vValue, { color: G.purple }]}>{w.weight_kg} kg</Text>
          </View>
        ))}
      </>}

      {(history?.sleep?.length || 0) > 0 && <>
        <SectionHeader title="Sleep Logs" />
        {history!.sleep.slice(0, 20).map(s => (
          <View key={s.id} style={styles.vRow}>
            <Ionicons name="moon-outline" size={16} color={G.accent} />
            <Text style={styles.vLabel}>{formatDate(s.logged_at)}</Text>
            <Text style={[styles.vValue, { color: G.accent }]}>{sleepDuration(s)}</Text>
            <Text style={styles.vSub}>{formatTime(s.sleep_at)}→{formatTime(s.wake_at)}</Text>
          </View>
        ))}
      </>}

      {(history?.water?.length || 0) > 0 && <>
        <SectionHeader title="Water Intake" />
        {(() => {
          const wd: Record<string, number> = {};
          history!.water.forEach(w => { const d = w.logged_at.split('T')[0]; wd[d] = (wd[d] || 0) + w.amount_ml; });
          return Object.entries(wd).slice(0, 20).map(([d, ml]) => (
            <View key={d} style={styles.vRow}>
              <Ionicons name="water-outline" size={16} color="#06B6D4" />
              <Text style={styles.vLabel}>{formatDate(d + 'T00:00:00')}</Text>
              <Text style={[styles.vValue, { color: '#06B6D4' }]}>{ml} ml</Text>
            </View>
          ));
        })()}
      </>}

      {(history?.steps?.length || 0) > 0 && <>
        <SectionHeader title="Steps" />
        {history!.steps.slice(0, 15).map(s => (
          <View key={s.id} style={styles.vRow}>
            <Ionicons name="footsteps-outline" size={16} color={G.green} />
            <Text style={styles.vLabel}>{formatDate(s.logged_at)}</Text>
            <Text style={[styles.vValue, { color: G.green }]}>{s.steps.toLocaleString()}</Text>
          </View>
        ))}
      </>}

      {(history?.cardio?.length || 0) > 0 && <>
        <SectionHeader title="Cardio" />
        {history!.cardio.slice(0, 15).map(c => (
          <View key={c.id} style={styles.vRow}>
            <Ionicons name="bicycle-outline" size={16} color={G.orange} />
            <Text style={styles.vLabel}>{c.cardio_type} · {formatDate(c.logged_at)}</Text>
            <Text style={[styles.vValue, { color: G.orange }]}>{c.duration_minutes}min · {c.calories_burned}kcal</Text>
          </View>
        ))}
      </>}

      {(history?.supplements?.length || 0) > 0 && <>
        <SectionHeader title="Supplements" />
        {history!.supplements.slice(0, 20).map(s => (
          <View key={s.id} style={styles.vRow}>
            <Ionicons name="medkit-outline" size={16} color={G.green} />
            <Text style={styles.vLabel}>{s.supplement_name}</Text>
            <Text style={styles.vSub}>{formatDate(s.taken_at)}</Text>
          </View>
        ))}
      </>}
    </View>
  );
}

// ─── ACHIEVEMENTS TAB ──────────────────────────────────────────────────────
function AchievementsTab({ achievements }: { achievements: any[] }) {
  if (!achievements.length) return <EmptyState icon="trophy-outline" label="No achievements yet" />;
  return (
    <View style={styles.achGrid}>
      {achievements.map((a, i) => {
        const achDef = getAchievementById(a.achievement_id);
        const tier = (TIER_CONFIG as any)[achDef?.tier || 'bronze'] || (TIER_CONFIG as any).bronze;
        return (
          <Animated.View key={a.id} entering={FadeInDown.delay(Math.min(i, 20) * 40).duration(300)} style={styles.achCard}>
            <View style={[styles.achIcon, { backgroundColor: tier.color + '18', borderColor: tier.color + '30' }]}>
              <Ionicons name={(achDef?.icon || 'trophy') as any} size={22} color={tier.color} />
            </View>
            <Text style={[styles.achName, { color: tier.color }]} numberOfLines={2}>{achDef?.name || a.achievement_id}</Text>
            <View style={[styles.achBadge, { backgroundColor: tier.color + '15' }]}>
              <Text style={[styles.achBadgeText, { color: tier.color }]}>{achDef?.tier || 'bronze'}</Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ─── SHARED SUBCOMPONENTS ─────────────────────────────────────────────────
function StatPill({ icon, color, value }: any) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={styles.pillText}>{value}</Text>
    </View>
  );
}
function StatCard({ icon, label, value, color }: any) {
  return (
    <View style={styles.statCard}>
      <GlowingIcon icon={icon} size={22} color={color} bgSize={44} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}
function WorkoutRow({ workout }: { workout: WorkoutLog }) {
  const vol = workout.exercises?.reduce((sv, ex) => sv + (ex.sets?.reduce((ss, s) => ss + (s.weight_kg || 0) * (s.reps || 0), 0) || 0), 0) || 0;
  return (
    <View style={styles.logItem}>
      <View style={[styles.stripBar, { backgroundColor: G.green }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.logName}>{workout.title || 'Workout'}</Text>
        <Text style={styles.logMeta}>{formatDate(workout.logged_at)}{workout.duration_minutes ? ` · ${workout.duration_minutes}min` : ''}{vol > 0 ? ` · ${vol.toLocaleString()}kg` : ''}</Text>
      </View>
    </View>
  );
}
function FoodRow({ food }: { food: FoodLog }) {
  const cols: Record<string, string> = { breakfast: G.orange, lunch: G.green, dinner: G.purple, snack: G.accent };
  const color = cols[food.meal_type] || G.accent;
  return (
    <View style={styles.logItem}>
      <View style={[styles.stripBar, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.logName}>{food.food_name}</Text>
        <Text style={styles.logMeta}>{food.meal_type} · {food.calories}kcal · P{food.protein}g C{food.carbs}g F{food.fat}g</Text>
      </View>
      <Text style={styles.logDate}>{formatDate(food.logged_at)}</Text>
    </View>
  );
}
function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon as any} size={44} color={G.mute} />
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.bg },
  content: { paddingBottom: 30 },
  backBtn: { position: 'absolute', top: 56, left: 20, zIndex: 10 },
  backBtnInner: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: G.border,
    alignItems: 'center', justifyContent: 'center',
  },
  profileHeader: { alignItems: 'center', paddingTop: 110, marginBottom: 8, paddingHorizontal: 20 },
  avatarRing: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', padding: 3, marginBottom: 16 },
  avatarInner: { width: 94, height: 94, borderRadius: 47, backgroundColor: G.bg, alignItems: 'center', justifyContent: 'center', padding: 3 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: '800' },
  username: { color: G.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  bio: { color: G.sub, fontSize: 13, marginTop: 6 },
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: G.surface, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: G.border,
  },
  pillText: { color: G.sub, fontSize: 11, fontWeight: '600' },
  followBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16,
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999,
    borderWidth: 1, borderColor: G.border, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  followBtnActive: { borderColor: '#00E5FF50', backgroundColor: '#00E5FF12' },
  followBtnText: { color: G.text, fontSize: 14, fontWeight: '700' },
  tabsScroll: { marginTop: 20 },
  tabsContent: { paddingHorizontal: 20, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
    borderWidth: 1, borderColor: G.border, backgroundColor: G.surface,
  },
  tabActive: { borderColor: '#00E5FF50', backgroundColor: '#00E5FF12' },
  tabText: { color: G.sub, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: G.accent },
  tabBody: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { color: G.text, fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: G.surface, borderRadius: 20, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: G.border,
  },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  statLabel: { color: G.sub, fontSize: 11, fontWeight: '500', marginTop: 2 },
  logItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: G.surface, borderRadius: 14, marginBottom: 8, padding: 12,
    borderWidth: 1, borderColor: G.border,
  },
  stripBar: { width: 4, borderRadius: 2, marginRight: 12, alignSelf: 'stretch', minHeight: 32 },
  logName: { color: G.text, fontSize: 14, fontWeight: '600' },
  logMeta: { color: G.sub, fontSize: 12, marginTop: 2 },
  logDate: { color: G.mute, fontSize: 11, marginLeft: 8 },
  workoutCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: G.surface, borderRadius: 14,
    marginBottom: 4, padding: 14, borderWidth: 1, borderColor: G.border,
  },
  cardTitle: { color: G.text, fontSize: 14, fontWeight: '600' },
  cardMeta: { color: G.sub, fontSize: 12, marginTop: 2 },
  exerciseBlock: {
    backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 12, marginBottom: 4,
    marginLeft: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  exName: { color: G.text, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  setRow: { color: G.sub, fontSize: 12, marginBottom: 3 },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 6, marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  dayLabel: { color: G.text, fontSize: 14, fontWeight: '700' },
  dayTotals: { color: G.sub, fontSize: 11, fontWeight: '600' },
  vRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: G.surface, borderRadius: 12, marginBottom: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: G.border,
  },
  vLabel: { flex: 1, color: G.text, fontSize: 13, fontWeight: '500' },
  vValue: { fontSize: 13, fontWeight: '700' },
  vSub: { color: G.mute, fontSize: 11 },
  achGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achCard: {
    width: '30%', backgroundColor: G.surface, borderRadius: 14, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: G.border,
  },
  achIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, marginBottom: 6,
  },
  achName: { fontSize: 10, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  achBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  achBadgeText: { fontSize: 8, fontWeight: '600', textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingBottom: 30 },
  emptyText: { color: G.mute, fontSize: 15, marginTop: 12, fontWeight: '500' },
});
