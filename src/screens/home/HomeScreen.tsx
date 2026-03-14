import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Image, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import MultiMacroRing from '../../components/ui/MultiMacroRing';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import { getDailyAdvice, checkAutoRegulation, matchMacros, parseVoiceLog } from '../../services/gemini';
import { getMuscleIcon } from '../../constants/icons';
import { AutoRegulation, MacroMatch, VoiceLogResult } from '../../types';
import { Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

function getSleepMetrics(sleepAt?: string, wakeAt?: string) {
  if (!sleepAt || !wakeAt) {
    return { label: 'No sleep logged', hours: 0 };
  }

  const diff = Math.max(0, new Date(wakeAt).getTime() - new Date(sleepAt).getTime());
  const totalMinutes = Math.round(diff / 60000);
  const hours = totalMinutes / 60;
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    label: `${wholeHours}h ${minutes}m`,
    hours,
  };
}

function formatTime(value?: string) {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function HomeScreen({ navigation }: any) {
  const {
    user,
    settings,
    todayFoodLogs,
    todayWaterLogs,
    todayWorkoutLogs,
    todaySupplementLogs,
    todayStepsLogs,
    todayCardioLogs,
    todaySleepLogs,
    splitDays,
    refreshTodayData,
    weightLogs,
    achievements,
    activeSplit,
    supplementPlan,
    logSupplement,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [autoReg, setAutoReg] = useState<AutoRegulation | null>(null);
  const [autoRegDismissed, setAutoRegDismissed] = useState(false);
  const [macroMatches, setMacroMatches] = useState<MacroMatch[]>([]);
  const [macroMatchLoading, setMacroMatchLoading] = useState(false);
  const [macroMatchModal, setMacroMatchModal] = useState(false);
  const [voiceModal, setVoiceModal] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceResult, setVoiceResult] = useState<VoiceLogResult | null>(null);
  const [isListening, setIsListening] = useState(false);
  const micPulse = useSharedValue(1);

  const openTab = useCallback((tabName: string, screen?: string, params?: Record<string, any>) => {
    const parent = navigation.getParent?.();
    if (screen) {
      if (parent) {
        parent.navigate(tabName, { screen, params });
        return;
      }
      navigation.navigate(tabName, { screen, params });
      return;
    }

    if (parent) {
      parent.navigate(tabName);
      return;
    }

    navigation.navigate(tabName);
  }, [navigation]);

  const fetchAdvice = useCallback(async () => {
    if (!user) return;
    setLoadingAdvice(true);
    try {
      const response = await getDailyAdvice({
        user,
        settings,
        todayFoodLogs,
        todayWaterLogs,
        todayWorkoutLogs,
        weightLogs,
        activeSplit,
        splitDays,
        achievements,
        todaySupplementLogs,
        todayStepsLogs,
        todayCardioLogs,
        todaySleepLogs,
      }, settings?.gemini_api_key || '');
      setAdvice(response);
    } catch (error) {
      console.warn('Advice error:', error);
    } finally {
      setLoadingAdvice(false);
    }
  }, [
    activeSplit,
    achievements,
    settings,
    splitDays,
    todayCardioLogs,
    todayFoodLogs,
    todaySleepLogs,
    todayStepsLogs,
    todaySupplementLogs,
    todayWaterLogs,
    todayWorkoutLogs,
    user,
    weightLogs,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshTodayData();
    await fetchAdvice();
    setRefreshing(false);
  }, [fetchAdvice, refreshTodayData]);

  useEffect(() => {
    if (user && !advice) {
      fetchAdvice();
    }
  }, [advice, fetchAdvice, user]);

  // Auto-regulation check
  useEffect(() => {
    if (!user || autoRegDismissed || autoReg) return;
    const latestSleepLocal = todaySleepLogs[0];
    const sleepHours = latestSleepLocal
      ? Math.abs(new Date(latestSleepLocal.wake_at).getTime() - new Date(latestSleepLocal.sleep_at).getTime()) / 3600000
      : undefined;
    const calsSoFar = todayFoodLogs.reduce((s, f) => s + f.calories, 0);
    checkAutoRegulation(
      {
        sleepHours,
        caloriesToday: calsSoFar,
        targetCalories: settings?.target_calories || 2000,
        workoutsToday: todayWorkoutLogs.length,
      },
      settings?.gemini_api_key || '',
    ).then(r => { if (r) setAutoReg(r); }).catch(() => {});
  }, [user]);

  const handleMacroMatch = async () => {
    setMacroMatchModal(true);
    if (macroMatches.length > 0) return;
    setMacroMatchLoading(true);
    try {
      const remaining = {
        calories: Math.max(0, (settings?.target_calories || 2000) - totals.calories),
        protein: Math.max(0, (settings?.target_protein || 150) - totals.protein),
        carbs: Math.max(0, (settings?.target_carbs || 250) - totals.carbs),
        fat: Math.max(0, (settings?.target_fat || 65) - totals.fat),
      };
      const matches = await matchMacros(remaining, { diet_type: settings?.diet_type || 'standard' }, settings?.gemini_api_key || '');
      setMacroMatches(matches);
    } catch {}
    setMacroMatchLoading(false);
  };

  const handleVoiceParse = async () => {
    if (!voiceText.trim()) return;
    setVoiceLoading(true);
    try {
      const result = await parseVoiceLog(voiceText, settings?.gemini_api_key || '');
      setVoiceResult(result);
    } catch {}
    setVoiceLoading(false);
  };

  const handleVoiceToggle = async () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
    } else {
      setVoiceText('');
      setVoiceResult(null);
      try {
        if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
          Alert.alert('Not Available', 'Speech recognition is not available on this device. Please install Google Speech Services from the Play Store.');
          return;
        }
        const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Denied', 'Microphone permission is required for voice logging.');
          return;
        }
        ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: true, continuous: false });
      } catch (err: any) {
        Alert.alert('Voice Error', err?.message || 'Could not start speech recognition.');
      }
    }
  };

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    micPulse.value = withRepeat(withTiming(1.22, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    micPulse.value = withTiming(1, { duration: 200 });
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript ?? '';
    setVoiceText(transcript);
  });

  useSpeechRecognitionEvent('error', () => {
    setIsListening(false);
    micPulse.value = withTiming(1, { duration: 200 });
  });

  const micPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micPulse.value }],
  }));

  const totals = useMemo(() => {
    const calories = todayFoodLogs.reduce((sum, item) => sum + Number(item.calories || 0), 0);
    const protein = todayFoodLogs.reduce((sum, item) => sum + Number(item.protein || 0), 0);
    const carbs = todayFoodLogs.reduce((sum, item) => sum + Number(item.carbs || 0), 0);
    const fat = todayFoodLogs.reduce((sum, item) => sum + Number(item.fat || 0), 0);
    const water = todayWaterLogs.reduce((sum, item) => sum + Number(item.amount_ml || 0), 0);
    const steps = todayStepsLogs.reduce((sum, item) => sum + Number(item.steps || 0), 0);
    const cardioCalories = todayCardioLogs.reduce((sum, item) => sum + Number(item.calories_burned || 0), 0);
    const cardioMinutes = todayCardioLogs.reduce((sum, item) => sum + Number(item.duration_minutes || 0), 0);

    return { calories, protein, carbs, fat, water, steps, cardioCalories, cardioMinutes };
  }, [todayCardioLogs, todayFoodLogs, todayStepsLogs, todayWaterLogs]);

  const targets = {
    calories: settings?.target_calories || 2000,
    protein: settings?.target_protein || 150,
    carbs: settings?.target_carbs || 250,
    fat: settings?.target_fat || 65,
    water: settings?.water_goal_ml || 3000,
    steps: 10000,
    cardioMinutes: 30,
    sleepHours: 8,
  };

  const macroData = [
    { progress: totals.calories / Math.max(targets.calories, 1), color: '#a78bfa', label: 'Calories', value: `${totals.calories}` },
    { progress: totals.protein / Math.max(targets.protein, 1), color: '#00E5FF', label: 'Protein', value: `${totals.protein}g` },
    { progress: totals.carbs / Math.max(targets.carbs, 1), color: '#FFFFFF', label: 'Carbs', value: `${totals.carbs}g` },
  ];

  const currentSplitDay = useMemo(() => {
    if (!splitDays.length || !settings) return null;
    const dayIndex = (settings.current_split_day || 0) % splitDays.length;
    return splitDays[dayIndex];
  }, [settings, splitDays]);

  const latestSleep = todaySleepLogs[0];
  const sleepMetrics = getSleepMetrics(latestSleep?.sleep_at, latestSleep?.wake_at);
  const checkedSupplements = new Set(todaySupplementLogs.map((item) => item.supplement_name.trim().toLowerCase()));
  const remainingCalories = Math.max(0, targets.calories - totals.calories);
  const workoutTitle = todayWorkoutLogs[0]?.title || (currentSplitDay ? `${currentSplitDay.day_name}: ${currentSplitDay.muscle_groups.join(', ')}` : 'Recovery Day');
  const workoutMeta = todayWorkoutLogs.length > 0
    ? `${todayWorkoutLogs.length} workout logged today`
    : currentSplitDay
      ? 'Scheduled for today'
      : 'No split scheduled';

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      >
        {/* ── Auto-Regulation Banner ── */}
        {autoReg && !autoRegDismissed && (
          <View style={[styles.autoRegBanner, autoReg.type === 'sleep' ? styles.bannerSleep : autoReg.type === 'calories' ? styles.bannerCal : styles.bannerRec]}>
            <Ionicons name={autoReg.type === 'sleep' ? 'moon' : autoReg.type === 'calories' ? 'flame' : 'fitness'} size={18} color="#fff" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>{autoReg.message}</Text>
              <Text style={styles.bannerSub}>{autoReg.suggestion}</Text>
              {autoReg.volumeReductionPercent ? <Text style={styles.bannerCta}>Reduce today's volume by {autoReg.volumeReductionPercent}%</Text> : null}
            </View>
            <Pressable onPress={() => setAutoRegDismissed(true)} hitSlop={12}>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>
        )}

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}</Text>
            <Text style={styles.username}>{(user?.username || 'Athlete').replace(/^\w/, (c: string) => c.toUpperCase())}</Text>
            <Text style={styles.headerMeta}>{settings?.calorie_mode?.replace('_', ' ') || 'maintain'} mode · {achievements.length} trophies</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerCircle} onPress={() => openTab('Chat')}>
              <Ionicons name="sparkles-outline" size={20} color="#fff" />
            </Pressable>
            <Pressable style={styles.avatarButton} onPress={() => openTab('Profile')}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <Ionicons name="person" size={22} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.ringCard}>
          <MultiMacroRing
            macros={macroData}
            centerValue={`${remainingCalories}`}
            centerLabel="kcal left"
          />
          <View style={styles.macroLegendRow}>
            <LegendDot color={theme.colors.protein} label="Protein" value={`${totals.protein}g`} />
            <LegendDot color={theme.colors.carbs} label="Carbs" value={`${totals.carbs}g`} />
            <LegendDot color={theme.colors.fat} label="Fat" value={`${totals.fat}g`} />
          </View>
        </View>

        <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} style={styles.workoutCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Target</Text>
            <Pressable onPress={() => openTab('Log', 'WorkoutLog')}>
              <Text style={styles.linkText}>Log workout</Text>
            </Pressable>
          </View>
          <View style={styles.workoutRow}>
            <View style={styles.workoutIconWrap}>
              <MaterialCommunityIcons
                name={(currentSplitDay ? getMuscleIcon(currentSplitDay.muscle_groups[0] as any).icon : 'weight-lifter') as any}
                size={24}
                color={theme.colors.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.workoutTitle}>{workoutTitle}</Text>
              <Text style={styles.workoutMeta}>{workoutMeta}</Text>
              <Text style={styles.workoutSubMeta}>Next focus: {currentSplitDay?.muscle_groups?.join(', ') || 'Mobility and recovery'}</Text>
            </View>
            <Pressable style={styles.playButton} onPress={() => openTab('Log', 'WorkoutLog')}>
              <Ionicons name="play" size={16} color="#000" />
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.metricGrid}>
          <MetricCard
            icon="water"
            tint={theme.colors.accentCyan}
            label="Hydration"
            value={`${totals.water} ml`}
            meta={`Goal ${targets.water} ml`}
            progress={totals.water / Math.max(targets.water, 1)}
            onPress={() => openTab('Log', 'WaterLog')}
          />
          <MetricCard
            icon="moon"
            tint={theme.colors.accentPurple}
            label="Sleep"
            value={sleepMetrics.label}
            meta={latestSleep ? `Logged ${formatTime(latestSleep.logged_at)}` : 'Tap to log sleep'}
            progress={sleepMetrics.hours / targets.sleepHours}
            onPress={() => openTab('Log', 'VitalsLog')}
          />
          <MetricCard
            icon="footsteps"
            tint={theme.colors.accentEmerald}
            label="Steps Today"
            value={totals.steps.toLocaleString()}
            meta={totals.steps > 0 ? 'Manual steps logged' : 'Health sync not wired yet'}
            progress={totals.steps / targets.steps}
            onPress={() => openTab('Log', 'VitalsLog')}
          />
          <MetricCard
            icon="flame"
            tint={theme.colors.accentOrange}
            label="Cardio Burn"
            value={`${totals.cardioCalories} kcal`}
            meta={totals.cardioMinutes > 0 ? `${totals.cardioMinutes} min logged` : 'Add cardio session'}
            progress={totals.cardioMinutes / targets.cardioMinutes}
            onPress={() => openTab('Log', 'CardioLog')}
          />
        </View>

        <View style={styles.habitsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Dashboard</Text>
            <Pressable onPress={() => openTab('Profile', 'CompleteHistory')}>
              <Text style={styles.linkText}>See history</Text>
            </Pressable>
          </View>
          <ProgressRow label="Water progress" value={`${totals.water} / ${targets.water} ml`} progress={totals.water / Math.max(targets.water, 1)} color={theme.colors.accentCyan} />
          <ProgressRow label="Protein target" value={`${totals.protein} / ${targets.protein} g`} progress={totals.protein / Math.max(targets.protein, 1)} color={theme.colors.protein} />
          <ProgressRow label="Steps goal" value={`${totals.steps.toLocaleString()} / ${targets.steps.toLocaleString()}`} progress={totals.steps / targets.steps} color={theme.colors.accentEmerald} />
          <ProgressRow label="Cardio minutes" value={`${totals.cardioMinutes} / ${targets.cardioMinutes} min`} progress={totals.cardioMinutes / targets.cardioMinutes} color={theme.colors.accentOrange} />
        </View>

        <View style={styles.stackCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Supplement Checklist</Text>
            <Pressable onPress={() => openTab('Log', 'SupplementsLog')}>
              <Text style={styles.linkText}>Manage stack</Text>
            </Pressable>
          </View>
          {supplementPlan.length === 0 ? (
            <Pressable style={styles.emptySupplements} onPress={() => openTab('Log', 'SupplementsLog')}>
              <Ionicons name="medkit-outline" size={20} color={theme.colors.accentEmerald} />
              <Text style={styles.emptySupplementsText}>Set your daily pills in Supplements, then check them off here on home.</Text>
            </Pressable>
          ) : (
            <View style={styles.supplementList}>
              {supplementPlan.map((supplement) => {
                const checked = checkedSupplements.has(supplement.toLowerCase());
                return (
                  <Pressable
                    key={supplement}
                    style={[styles.supplementItem, checked && styles.supplementItemChecked]}
                    onPress={() => !checked && logSupplement(supplement)}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked ? <Ionicons name="checkmark" size={14} color="#000" /> : null}
                    </View>
                    <Text style={[styles.supplementName, checked && styles.supplementNameChecked]}>{supplement}</Text>
                    <Ionicons name={checked ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={checked ? theme.colors.accentEmerald : theme.colors.textTertiary} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.featuredRow}>
          <Pressable style={styles.featuredCard} onPress={() => openTab('Log', 'GroceryList')}>
            <LinearGradient colors={['rgba(5,150,105,0.22)', 'rgba(13,148,136,0.32)']} style={styles.featuredCardInner}>
              <View style={styles.featuredIconWrap}>
                <Ionicons name="list-circle" size={26} color={theme.colors.accentEmerald} />
              </View>
              <Text style={styles.featuredTitle}>Grocery List</Text>
              <Text style={styles.featuredSub}>AI-powered list</Text>
              <Ionicons name="arrow-forward-circle" size={20} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', bottom: 14, right: 14 }} />
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.featuredCard} onPress={handleMacroMatch}>
            <LinearGradient colors={['rgba(79,70,229,0.22)', 'rgba(147,51,234,0.32)']} style={styles.featuredCardInner}>
              <View style={styles.featuredIconWrap}>
                <Ionicons name="nutrition" size={26} color={theme.colors.accentPurple} />
              </View>
              <Text style={styles.featuredTitle}>Macro Match</Text>
              <Text style={styles.featuredSub}>What should I eat?</Text>
              <Ionicons name="arrow-forward-circle" size={20} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', bottom: 14, right: 14 }} />
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Insight</Text>
            <Pressable onPress={() => openTab('Chat')}>
              <Text style={styles.linkText}>Ask AI</Text>
            </Pressable>
          </View>
          <Text style={styles.insightText}>
            {loadingAdvice ? 'Analyzing your recent logs...' : advice || 'Log meals, steps, cardio, sleep, and supplements to make this coach feed smarter.'}
          </Text>
          <View style={styles.promptRow}>
            <PromptPill label="Meal fix" onPress={() => openTab('Chat')} />
            <PromptPill label="Recovery check" onPress={() => openTab('Chat')} />
            <PromptPill label="Plan cardio" onPress={() => openTab('Chat')} />
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Voice FAB ── */}
      <Pressable onPress={() => { setVoiceText(''); setVoiceResult(null); setVoiceModal(true); }} style={styles.voiceFab}>
        <LinearGradient colors={isListening ? ['#FF4444', '#FF0000'] : ['#00E5FF', '#4A90FF']} style={styles.voiceFabInner}>
          <Ionicons name={isListening ? 'stop' : 'mic'} size={24} color="#fff" />
        </LinearGradient>
      </Pressable>

      {/* ── Macro Matcher Modal ── */}
      <Modal visible={macroMatchModal} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={() => setMacroMatchModal(false)}>
            <View style={styles.modalSheet}>
              <Pressable onPress={e => e.stopPropagation()}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>What Should I Eat?</Text>
                <Text style={styles.modalSub}>AI-matched foods to hit your remaining macros</Text>
                {macroMatchLoading ? (
                  <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                    <Ionicons name="sparkles" size={28} color="#00E5FF" />
                    <Text style={styles.loadingText}>Analyzing your macros...</Text>
                  </View>
                ) : macroMatches.length > 0 ? (
                  macroMatches.map((m, i) => (
                    <View key={i} style={styles.matchRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.matchName}>{m.food_name}</Text>
                        <Text style={styles.matchSub}>{m.serving_size} · {m.calories}kcal</Text>
                      </View>
                      <View style={styles.matchMacros}>
                        <Text style={styles.matchMacro}>P{Math.round(m.protein)}g</Text>
                        <Text style={styles.matchMacro}>C{Math.round(m.carbs)}g</Text>
                        <Text style={styles.matchMacro}>F{Math.round(m.fat)}g</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Text style={styles.loadingText}>No suggestions loaded yet</Text>
                    <Pressable onPress={handleMacroMatch} style={styles.modalBtn}>
                      <Text style={styles.modalBtnText}>Generate</Text>
                    </Pressable>
                  </View>
                )}
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Voice Log Modal ── */}
      <Modal visible={voiceModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => { if (isListening) ExpoSpeechRecognitionModule.stop(); setVoiceModal(false); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={() => { if (isListening) ExpoSpeechRecognitionModule.stop(); setVoiceModal(false); }}>
            <View style={styles.modalSheet}>
              <Pressable onPress={e => e.stopPropagation()}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Voice to Log</Text>
                <Text style={styles.modalSub}>{isListening ? 'Listening… speak now' : 'Tap the mic and speak'}</Text>

                {/* Mic button */}
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Pressable onPress={handleVoiceToggle}>
                    <Animated.View style={[styles.micRing, isListening && styles.micRingActive, micPulseStyle]}>
                      <LinearGradient
                        colors={isListening ? ['#FF4444', '#FF0000'] : ['#00E5FF', '#4A90FF']}
                        style={styles.micBtn}
                      >
                        <Ionicons name={isListening ? 'stop' : 'mic'} size={34} color="#fff" />
                      </LinearGradient>
                    </Animated.View>
                  </Pressable>
                  <Text style={styles.micHint}>{isListening ? 'Tap to stop' : voiceText ? 'Tap to re-record' : 'Tap to start'}</Text>
                </View>

                {/* Live transcript */}
                {voiceText ? (
                  <View style={styles.transcriptBox}>
                    <Text style={styles.transcriptLabel}>Heard:</Text>
                    <Text style={styles.transcriptText}>{voiceText}</Text>
                  </View>
                ) : null}

                {/* Results */}
                {voiceResult ? (
                  <View style={styles.voiceResultBox}>
                    <Text style={styles.voiceResultTitle}>Parsed Results:</Text>
                    {voiceResult.workouts?.map((w, i) => (
                      <Text key={i} style={styles.voiceResultItem}>🏋️ {w.name} — {w.sets.length} sets</Text>
                    ))}
                    {voiceResult.food?.map((f, i) => (
                      <Text key={i} style={styles.voiceResultItem}>🍗 {f.food_name} ({f.calories}kcal)</Text>
                    ))}
                    {voiceResult.water && (
                      <Text style={styles.voiceResultItem}>💧 {voiceResult.water.amount_ml}ml water</Text>
                    )}
                    {voiceResult.supplements?.map((s, i) => (
                      <Text key={i} style={styles.voiceResultItem}>💊 {s}</Text>
                    ))}
                    <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 6 }}>Review above then log via the Log tab</Text>
                  </View>
                ) : null}

                {voiceText && !isListening ? (
                  <Pressable
                    onPress={handleVoiceParse}
                    disabled={voiceLoading}
                    style={[styles.modalBtn, { marginTop: 14, opacity: voiceLoading ? 0.55 : 1 }]}
                  >
                    {voiceLoading ? (
                      <Text style={styles.modalBtnText}>Parsing...</Text>
                    ) : (
                      <Text style={styles.modalBtnText}>{voiceResult ? 'Re-Parse' : 'Parse with AI'}</Text>
                    )}
                  </Pressable>
                ) : null}
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

function LegendDot({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendValue}>{value}</Text>
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function MetricCard({
  icon,
  tint,
  label,
  value,
  meta,
  progress,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  value: string;
  meta: string;
  progress: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.metricCard} onPress={onPress}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon} size={18} color={tint} />
        <Text style={styles.metricMeta}>{meta}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: tint }]} />
      </View>
    </Pressable>
  );
}

function ProgressRow({ label, value, progress, color }: { label: string; value: string; progress: number; color: string }) {
  return (
    <View style={styles.progressRowBlock}>
      <View style={styles.progressRowHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}</Text>
      </View>
      <View style={styles.progressTrackLarge}>
        <View style={[styles.progressFillLarge, { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function ActionButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.actionButton} onPress={onPress}>
      <Ionicons name={icon} size={22} color="#fff" />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function PromptPill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.promptPill} onPress={onPress}>
      <Text style={styles.promptPillText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  greeting: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontWeight: '700',
  },
  username: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  headerMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  ringCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    marginBottom: 16,
  },
  macroLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  legendItem: {
    alignItems: 'center',
    gap: 3,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  legendLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  workoutCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  linkText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  workoutIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  workoutMeta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  workoutSubMeta: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginTop: 4,
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: '48.2%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  metricMeta: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  metricValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 14,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  habitsCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    marginBottom: 16,
  },
  progressRowBlock: {
    marginBottom: 14,
  },
  progressRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  progressValue: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrackLarge: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFillLarge: {
    height: '100%',
    borderRadius: 999,
  },
  stackCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    marginBottom: 16,
  },
  emptySupplements: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(16,185,129,0.08)',
    padding: 14,
  },
  emptySupplementsText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  supplementList: {
    gap: 10,
  },
  supplementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  supplementItemChecked: {
    backgroundColor: 'rgba(16,185,129,0.14)',
    borderColor: 'rgba(16,185,129,0.25)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.accentEmerald,
    borderColor: theme.colors.accentEmerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplementName: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  supplementNameChecked: {
    color: '#d1fae5',
  },
  featuredRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  featuredCard: {
    flex: 1,
  },
  featuredCardInner: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 18,
    minHeight: 130,
    overflow: 'hidden',
  },
  featuredIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  featuredSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  quickActionBoard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    width: '31.5%',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  insightCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    marginBottom: 16,
  },
  insightText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
  },
  promptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  promptPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  promptPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  /* ── Auto-Regulation Banner ── */
  autoRegBanner: {
    flexDirection: 'row', alignItems: 'flex-start', margin: 16, marginBottom: 0,
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  bannerSleep: { backgroundColor: '#1E293B', borderColor: '#3B82F6' },
  bannerCal: { backgroundColor: '#1C1407', borderColor: '#F59E0B' },
  bannerRec: { backgroundColor: '#0D1F12', borderColor: '#22C55E' },
  bannerTitle: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  bannerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 17 },
  bannerCta: { color: '#00E5FF', fontSize: 11, fontWeight: '700', marginTop: 4 },

  /* ── Voice FAB ── */
  voiceFab: { position: 'absolute', right: 22, bottom: 100, zIndex: 10 },
  voiceFabInner: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10,
  },

  /* ── Modals ── */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#0D1117', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  modalSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 12, textAlign: 'center' },
  matchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  matchName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  matchSub: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  matchMacros: { flexDirection: 'row', gap: 6 },
  matchMacro: { color: '#00E5FF', fontSize: 11, fontWeight: '700' },
  modalBtn: {
    backgroundColor: '#00E5FF15', borderWidth: 1, borderColor: '#00E5FF40',
    borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnText: { color: '#00E5FF', fontSize: 15, fontWeight: '700' },
  micRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: 'rgba(0,229,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  micRingActive: { borderColor: 'rgba(255,68,68,0.5)' },
  micBtn: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
  },
  micHint: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 10 },
  transcriptBox: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: 14, marginBottom: 4,
  },
  transcriptLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  transcriptText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  voiceResultBox: {
    backgroundColor: 'rgba(0,229,255,0.06)', borderRadius: 14,
    borderWidth: 1, borderColor: '#00E5FF30', padding: 14, marginTop: 14,
  },
  voiceResultTitle: { color: '#00E5FF', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  voiceResultItem: { color: '#fff', fontSize: 13, marginBottom: 4 },
});
