import React, { useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, ScrollView, Dimensions,
} from 'react-native';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  useAnimatedProps, withSpring, withTiming, Easing, interpolate,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import GlowingIcon from '../../components/ui/GlowingIcon';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RING_SIZE = 220;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ MAIN SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function WaterLogScreen({ navigation }: any) {
  const { logWater, todayWaterLogs, settings } = useApp();
  const waterGoal = settings?.water_goal_ml || 3000;

  const totalWater = useMemo(
    () => todayWaterLogs.reduce((sum, l) => sum + (l.amount_ml || 0), 0),
    [todayWaterLogs],
  );

  const progress = Math.min(totalWater / waterGoal, 1);

  const handleLog = async (amount: number) => {
    try {
      await logWater(amount);
      Toast.show({ type: 'success', text1: `ðŸ’§ +${amount}ml`, text2: 'Water logged!' });
    } catch (error) {
      // handled by context
    }
  };

  const quickAmounts = [
    { ml: 150, label: '150ml', icon: 'water-outline' as const },
    { ml: 250, label: '250ml', icon: 'water-outline' as const },
    { ml: 350, label: '350ml', icon: 'water' as const },
    { ml: 500, label: '500ml', icon: 'water' as const },
  ];

  return (
    <View style={styles.container}>
      <AnimatedBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* â”€â”€ Header â”€â”€ */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <GlowingIcon
            icon="water"
            size={26}
            color={theme.colors.accentCyan}
            bgSize={52}
          />
          <View style={{ marginLeft: 14 }}>
            <Text style={styles.headerTitle}>Water Intake</Text>
            <Text style={styles.headerSub}>Stay hydrated today</Text>
          </View>
        </Animated.View>

        {/* â”€â”€ Giant Circular Progress â”€â”€ */}
        <Animated.View entering={FadeIn.duration(600).delay(100)} style={styles.ringCard}>
          <View style={styles.ringWrapper}>
            <WaterRing progress={progress} />
            <View style={styles.ringCenter}>
              <Text style={styles.ringCurrent}>{totalWater}</Text>
              <Text style={styles.ringUnit}>ml</Text>
              <View style={styles.ringDivider} />
              <Text style={styles.ringGoal}>of {waterGoal} ml</Text>
            </View>
          </View>

          <View style={styles.ringStats}>
            <View style={styles.statPill}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.accentGreen} />
              <Text style={styles.statPillText}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
            <View style={styles.statPill}>
              <Ionicons name="water-outline" size={16} color={theme.colors.accentCyan} />
              <Text style={styles.statPillText}>
                {Math.max(0, waterGoal - totalWater)} ml left
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* â”€â”€ Quick Add â”€â”€ */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={styles.sectionTitle}>QUICK ADD</Text>
          <View style={styles.quickGrid}>
            {quickAmounts.map((item, index) => (
              <WaterButton
                key={item.ml}
                amount={item.ml}
                label={item.label}
                icon={item.icon}
                onPress={() => handleLog(item.ml)}
                index={index}
              />
            ))}
          </View>
        </Animated.View>

        {/* â”€â”€ Custom Input â”€â”€ */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <Text style={styles.sectionTitle}>CUSTOM AMOUNT</Text>
          <CustomWaterInput onLog={handleLog} />
        </Animated.View>

        {/* â”€â”€ Today's Logs â”€â”€ */}
        {todayWaterLogs.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.logsSection}>
            <Text style={styles.sectionTitle}>TODAY'S LOGS</Text>
            {todayWaterLogs.slice().reverse().map((log, index) => (
              <Animated.View key={log.id} entering={FadeInDown.delay(index * 60).duration(250)}>
                <View style={styles.logItem}>
                  <View style={styles.logLeftBorder} />
                  <Ionicons name="water" size={18} color={theme.colors.accentCyan} />
                  <Text style={styles.logAmount}>{log.amount_ml} ml</Text>
                  <Text style={styles.logTime}>
                    {new Date(log.logged_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ WATER RING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function WaterRing({ progress }: { progress: number }) {
  const animVal = useSharedValue(0);

  useEffect(() => {
    animVal.value = withTiming(progress, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const animProps = useAnimatedProps(() => {
    const offset = CIRCUMFERENCE * (1 - animVal.value);
    return { strokeDashoffset: offset };
  });

  return (
    <Svg width={RING_SIZE} height={RING_SIZE}>
      <Defs>
        <SvgGradient id="waterGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={theme.colors.accentCyan} />
          <Stop offset="100%" stopColor="#4A90FF" />
        </SvgGradient>
      </Defs>
      {/* Background track */}
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RADIUS}
        stroke="rgba(0,212,255,0.08)"
        strokeWidth={STROKE_WIDTH}
        fill="none"
      />
      {/* Animated fill */}
      <AnimatedCircle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RADIUS}
        stroke="url(#waterGrad)"
        strokeWidth={STROKE_WIDTH}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        animatedProps={animProps}
        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
      />
    </Svg>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ QUICK-ADD BUTTON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function WaterButton({ amount, label, icon, onPress, index }: {
  amount: number; label: string; icon: string; onPress: () => void; index: number;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(150 + index * 80).duration(350)}
      style={[styles.quickBtnOuter, animStyle]}
    >
      <Pressable
        onPress={() => {
          scale.value = withSpring(0.88, { damping: 12, stiffness: 200 });
          setTimeout(() => { scale.value = withSpring(1, { damping: 10, stiffness: 180 }); }, 120);
          onPress();
        }}
        style={styles.quickBtn}
        hitSlop={4}
      >
        <View style={styles.quickBtnIconWrap}>
          <Ionicons name={icon as any} size={24} color={theme.colors.accentCyan} />
        </View>
        <Text style={styles.quickBtnLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ CUSTOM INPUT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function CustomWaterInput({ onLog }: { onLog: (ml: number) => void }) {
  const [custom, setCustom] = React.useState('');

  const handleCustomLog = () => {
    const ml = parseInt(custom);
    if (ml > 0) {
      onLog(ml);
      setCustom('');
    }
  };

  return (
    <View style={styles.customRow}>
      <View style={styles.customInputWrapper}>
        <Ionicons name="water-outline" size={18} color={theme.colors.accentCyan} />
        <TextInput
          value={custom}
          onChangeText={setCustom}
          placeholder="Enter ml..."
          placeholderTextColor={theme.colors.textTertiary}
          keyboardType="numeric"
          style={styles.customTextInput}
        />
      </View>
      <Pressable onPress={handleCustomLog} style={styles.customLogBtn} hitSlop={8}>
        <Ionicons name="add" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ STYLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: 20,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.textPrimary,
  },
  headerSub: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  /* Ring card */
  ringCard: {
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringCurrent: {
    fontSize: theme.fontSize.mega,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
    lineHeight: 52,
  },
  ringUnit: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.accentCyan,
    marginTop: 2,
  },
  ringDivider: {
    width: 40,
    height: 2,
    backgroundColor: theme.colors.glassBorder,
    borderRadius: 1,
    marginVertical: 8,
  },
  ringGoal: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  ringStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  statPillText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },

  /* Section title */
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  /* Quick add grid */
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickBtnOuter: {
    width: (SCREEN_WIDTH - 32 - 36) / 4, // 4 cols with gaps
    minWidth: 72,
    flexGrow: 1,
  },
  quickBtn: {
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.12)',
  },
  quickBtnIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,212,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },

  /* Custom input */
  customRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  customInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  customTextInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    paddingVertical: 12,
  },
  customLogBtn: {
    backgroundColor: theme.colors.accentCyan,
    borderRadius: theme.borderRadius.lg,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Logs */
  logsSection: {
    marginTop: 4,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    overflow: 'hidden',
  },
  logLeftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: theme.colors.accentCyan,
    borderTopLeftRadius: theme.borderRadius.md,
    borderBottomLeftRadius: theme.borderRadius.md,
  },
  logAmount: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    flex: 1,
    marginLeft: 2,
  },
  logTime: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
});

