import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../theme';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import { useApp } from '../../store/AppContext';
import { getTodayString } from '../../services/cache';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SPACING = 14;
const CONTENT_WIDTH = SCREEN_WIDTH - SPACING * 2;
const COLUMN_WIDTH = (CONTENT_WIDTH - SPACING) / 2;
const ROW_HEIGHT = 130;

export default function LoggerMainScreen({ navigation }: any) {
  const {
    todayFoodLogs,
    todayWaterLogs,
    todayWorkoutLogs,
    settings,
    supplementPlan,
    todaySupplementLogs,
    todayCardioLogs,
    todaySleepLogs,
    splitDays,
    markWorkoutSkippedToday,
  } = useApp();

  const totalCalories = useMemo(() => todayFoodLogs.reduce((sum, item) => sum + Number(item.calories || 0), 0), [todayFoodLogs]);
  const totalWater = useMemo(() => todayWaterLogs.reduce((sum, item) => sum + Number(item.amount_ml || 0), 0), [todayWaterLogs]);
  const waterGoal = settings?.water_goal_ml || 3000;
  const calorieGoal = settings?.target_calories || 2000;
  const cardioCalories = useMemo(() => todayCardioLogs.reduce((sum, item) => sum + Number(item.calories_burned || 0), 0), [todayCardioLogs]);
  const lastSleep = todaySleepLogs[0];
  const currentSplitDay = useMemo(() => {
    if (!settings || splitDays.length === 0) return null;
    return splitDays[(settings.current_split_day || 0) % splitDays.length];
  }, [settings, splitDays]);
  const workoutDeferredToday = settings?.split_deferred_local_date === getTodayString();

  const openProfileHistory = () => {
    const parent = navigation.getParent?.();
    if (parent) {
      parent.navigate('Profile', { screen: 'CompleteHistory' });
      return;
    }
    navigation.navigate('CompleteHistory');
  };

  const handleMarkMissedToday = () => {
    if (!currentSplitDay) return;
    Alert.alert(
      'Missed gym today?',
      `${currentSplitDay.day_name} will be moved to tomorrow instead of being skipped.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Move it', onPress: () => { markWorkoutSkippedToday(); } },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />

      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Daily AI Log</Text>
          <Text style={styles.title}>Ready to optimize?</Text>
        </View>
        <Pressable style={styles.headerButton} onPress={openProfileHistory}>
          <Ionicons name="notifications" size={20} color="#fff" />
          <View style={styles.headerDot} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          <View style={styles.leftColumn}>
            <LogTile
              title={'Log\nWorkout'}
              subtitle={workoutDeferredToday ? 'Moved to tomorrow' : 'AI synced'}
              icon="barbell-outline"
              colors={['rgba(79,70,229,0.30)', 'rgba(147,51,234,0.54)']}
              borderColor="rgba(99,102,241,0.38)"
              height={ROW_HEIGHT * 3 + SPACING * 2}
              onPress={() => navigation.navigate('WorkoutLog')}
            />

            <Pressable style={styles.sleepTile} onPress={() => navigation.navigate('VitalsLog')}>
              <LinearGradient colors={['rgba(30,41,59,0.92)', 'rgba(30,27,75,0.92)']} style={styles.sleepTileInner}>
                <View style={styles.sleepIconWrap}>
                  <Ionicons name="moon" size={18} color="#a5b4fc" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sleepTitle}>Sleep Data</Text>
                  <Text style={styles.sleepMeta}>{lastSleep ? 'Logged today' : 'Open vitals'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.55)" />
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.rightColumn}>
            <LogTile
              title="Log Meal"
              subtitle={`${Math.min(100, Math.round((totalCalories / Math.max(calorieGoal, 1)) * 100))}%`}
              icon="restaurant-outline"
              colors={['rgba(234,88,12,0.25)', 'rgba(153,27,27,0.58)']}
              borderColor="rgba(249,115,22,0.34)"
              height={ROW_HEIGHT * 2 + SPACING}
              progress={totalCalories / Math.max(calorieGoal, 1)}
              onPress={() => navigation.navigate('FoodLog')}
            />

            <LogTile
              title="Hydrate"
              subtitle={`${(totalWater / 1000).toFixed(1)}L / ${(waterGoal / 1000).toFixed(1)}L`}
              icon="water"
              colors={['rgba(8,145,178,0.26)', 'rgba(37,99,235,0.54)']}
              borderColor="rgba(34,211,238,0.28)"
              height={ROW_HEIGHT * 2 + SPACING}
              onPress={() => navigation.navigate('WaterLog')}
            />
          </View>
        </View>

        <Pressable style={styles.supplementTileWrap} onPress={() => navigation.navigate('SupplementsLog')}>
          <LinearGradient colors={['rgba(5,150,105,0.18)', 'rgba(13,148,136,0.26)']} style={styles.supplementTile}>
            <View style={styles.supplementLeft}>
              <Ionicons name="medkit" size={22} color={theme.colors.accentEmerald} />
              <View>
                <Text style={styles.supplementTitle}>Supplements</Text>
                <Text style={styles.supplementMeta}>
                  {supplementPlan.length > 0
                    ? `${todaySupplementLogs.length}/${supplementPlan.length} checked on home`
                    : 'Set your stack'}
                </Text>
              </View>
            </View>
            <View style={styles.supplementCta}>
              <Text style={styles.supplementCtaText}>{supplementPlan.length > 0 ? 'Manage' : 'Log now'}</Text>
            </View>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }, styles.deferTileWrap]}
          onPress={handleMarkMissedToday}
          disabled={!currentSplitDay || workoutDeferredToday || todayWorkoutLogs.length > 0}
        >
          <LinearGradient colors={['rgba(71,85,105,0.16)', 'rgba(30,41,59,0.32)']} style={[styles.deferTile, (!currentSplitDay || workoutDeferredToday || todayWorkoutLogs.length > 0) && styles.deferTileDisabled]}>
            <View style={styles.deferLeft}>
              <View style={styles.deferIconWrap}>
                <Ionicons name={workoutDeferredToday ? 'checkmark-circle' : 'calendar-outline'} size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deferTitle}>
                  {workoutDeferredToday ? 'Workout moved to tomorrow' : 'Didn’t hit the gym today?'}
                </Text>
                <Text style={styles.deferMeta}>
                  {todayWorkoutLogs.length > 0
                    ? 'You already logged a workout today.'
                    : workoutDeferredToday
                      ? `${currentSplitDay?.day_name || 'Today’s split'} is queued for tomorrow.`
                      : currentSplitDay
                        ? `Push ${currentSplitDay.day_name} to tomorrow instead of skipping it.`
                        : 'Set up a split to use rollover scheduling.'}
                </Text>
              </View>
            </View>
            <Text style={styles.deferCta}>{workoutDeferredToday ? 'Queued' : 'Move it'}</Text>
          </LinearGradient>
        </Pressable>

        <View style={styles.insightSection}>
          <Text style={styles.insightEyebrow}>Daily Insight</Text>
          <View style={styles.insightCard}>
            <View style={styles.insightIconBox}>
              <Ionicons name="sparkles-outline" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightText}>
                {cardioCalories > 0
                  ? `Cardio is already burning ${cardioCalories} kcal today. Keep food and water logs tight so the AI can adjust recovery and macros.`
                  : 'Your logging depth powers the AI coach. Meals, water, steps, cardio, supplements, and skipped-day rollover all feed smarter planning.'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomRail}>
          <RailPill icon="pulse-outline" label="Vitals" onPress={() => navigation.navigate('VitalsLog')} />
          <RailPill icon="heart-outline" label="Cardio" onPress={() => navigation.navigate('CardioLog')} />
          <RailPill icon="document-text-outline" label="History" onPress={openProfileHistory} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function LogTile({
  title,
  subtitle,
  icon,
  colors,
  borderColor,
  height,
  onPress,
  progress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: string[];
  borderColor: string;
  height: number;
  onPress: () => void;
  progress?: number;
}) {
  return (
    <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]} onPress={onPress}>
      <LinearGradient colors={colors as any} style={[styles.tile, { height, borderColor }]}>
        <View style={styles.reflection} />
        <View style={styles.tileContent}>
          <View style={styles.tileIconWrap}>
            <Ionicons name={icon} size={title.includes('Workout') ? 26 : 22} color="#fff" />
          </View>
          <View>
            <Text style={[styles.tileTitle, title.includes('Workout') && styles.tileTitleLarge]}>{title}</Text>
            {typeof progress === 'number' ? (
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
                </View>
                <Text style={styles.progressText}>{subtitle}</Text>
              </View>
            ) : (
              <Text style={styles.tileSubtitle}>{subtitle}</Text>
            )}
          </View>
        </View>
        {title.includes('Workout') ? <Ionicons name="flash" size={54} color="rgba(255,255,255,0.12)" style={styles.tileGlyph} /> : null}
        {title === 'Log Meal' ? <Ionicons name="nutrition" size={46} color="rgba(255,255,255,0.10)" style={styles.cornerGlyph} /> : null}
      </LinearGradient>
    </Pressable>
  );
}

function RailPill({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.railPill} onPress={onPress}>
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={styles.railPillText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING,
    paddingTop: 60,
    paddingBottom: 20,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: SPACING,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    gap: SPACING,
  },
  leftColumn: {
    width: COLUMN_WIDTH,
    gap: SPACING,
  },
  rightColumn: {
    width: COLUMN_WIDTH,
    gap: SPACING,
  },
  tile: {
    borderRadius: 34,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  reflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 34,
  },
  tileContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tileIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  tileTitleLarge: {
    fontSize: 32,
    lineHeight: 36,
    marginBottom: 8,
  },
  tileSubtitle: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '700',
    marginTop: 8,
  },
  progressRow: {
    marginTop: 10,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 999,
  },
  progressText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  tileGlyph: {
    position: 'absolute',
    right: 18,
    bottom: 14,
  },
  cornerGlyph: {
    position: 'absolute',
    right: 18,
    top: 18,
  },
  sleepTile: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  sleepTileInner: {
    height: ROW_HEIGHT,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 14,
  },
  sleepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  sleepMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  supplementTileWrap: {
    marginTop: SPACING,
    borderRadius: 30,
    overflow: 'hidden',
  },
  supplementTile: {
    minHeight: 94,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.20)',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  supplementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  supplementTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  supplementMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 2,
  },
  supplementCta: {
    borderRadius: 999,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  supplementCtaText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  deferTileWrap: {
    marginTop: SPACING,
    borderRadius: 30,
    overflow: 'hidden',
  },
  deferTile: {
    minHeight: 98,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  deferTileDisabled: {
    opacity: 0.72,
  },
  deferLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deferIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deferTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  deferMeta: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 18,
  },
  deferCta: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  insightSection: {
    marginTop: 26,
  },
  insightEyebrow: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  insightCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  insightIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 22,
  },
  bottomRail: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  railPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
  },
  railPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
