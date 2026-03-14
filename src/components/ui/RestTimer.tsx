import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, Easing,
  FadeIn, FadeOut, useAnimatedStyle, interpolate,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Props {
  visible: boolean;
  durationSeconds?: number;
  onDismiss: () => void;
  onComplete?: () => void;
}

const DURATIONS = [60, 90, 120, 180];

export default function RestTimer({ visible, durationSeconds = 90, onDismiss, onComplete }: Props) {
  const [duration, setDuration] = useState(durationSeconds);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [running, setRunning] = useState(true);
  const progress = useSharedValue(1);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback((dur = duration) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const startTime = Date.now();
    progress.value = withTiming(0, { duration: dur * 1000, easing: Easing.linear });
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const left = Math.max(0, dur - elapsed);
      setTimeLeft(Math.ceil(left));
      if (left <= 0) {
        clearInterval(intervalRef.current!);
        setRunning(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        onComplete?.();
      }
    }, 250);
    setRunning(true);
  }, [duration]);

  useEffect(() => {
    if (visible) {
      setDuration(durationSeconds);
      setTimeLeft(durationSeconds);
      progress.value = 1;
      start(durationSeconds);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [visible, durationSeconds]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const pct = timeLeft / duration;
  const ringColor = pct > 0.5 ? '#4ADE80' : pct > 0.25 ? '#EAB308' : '#EF4444';

  const handleSetDuration = (d: number) => {
    setDuration(d);
    setTimeLeft(d);
    progress.value = 1;
    start(d);
    Haptics.selectionAsync().catch(() => {});
  };

  const togglePause = () => {
    if (running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      Haptics.selectionAsync().catch(() => {});
    } else {
      const remaining = timeLeft;
      progress.value = remaining / duration;
      start(remaining);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)} style={styles.sheet}>
          <Pressable onPress={e => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Rest Timer</Text>
              <Pressable onPress={onDismiss} hitSlop={16}>
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>

            {/* Ring */}
            <View style={styles.ringWrap}>
              <Svg width={190} height={190} style={{ transform: [{ rotate: '-90deg' }] }}>
                {/* Background ring */}
                <Circle
                  cx={95} cy={95} r={RADIUS}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={10}
                  fill="none"
                />
                {/* Progress ring */}
                <AnimatedCircle
                  cx={95} cy={95} r={RADIUS}
                  stroke={ringColor}
                  strokeWidth={10}
                  fill="none"
                  strokeDasharray={CIRCUMFERENCE}
                  animatedProps={animatedProps}
                  strokeLinecap="round"
                />
              </Svg>
              <View style={StyleSheet.absoluteFill}>
                <View style={styles.ringInner}>
                  <Text style={[styles.timeText, { color: running ? '#fff' : 'rgba(255,255,255,0.5)' }]}>
                    {formatTime(timeLeft)}
                  </Text>
                  <Text style={styles.restLabel}>{timeLeft <= 0 ? "Go!" : "resting"}</Text>
                </View>
              </View>
            </View>

            {/* Duration presets */}
            <View style={styles.presetsRow}>
              {DURATIONS.map(d => (
                <Pressable
                  key={d}
                  onPress={() => handleSetDuration(d)}
                  style={[styles.presetBtn, duration === d && styles.presetBtnActive]}
                >
                  <Text style={[styles.presetText, duration === d && styles.presetTextActive]}>
                    {d < 60 ? `${d}s` : `${d / 60}m`}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <Pressable onPress={() => { handleSetDuration(duration); }} style={styles.ctrlBtn}>
                <Ionicons name="refresh-outline" size={20} color="rgba(255,255,255,0.5)" />
              </Pressable>
              <Pressable onPress={togglePause} style={styles.playBtn}>
                <Ionicons name={running ? 'pause' : 'play'} size={28} color="#fff" />
              </Pressable>
              <Pressable onPress={onDismiss} style={styles.ctrlBtn}>
                <Ionicons name="checkmark-outline" size={20} color="#4ADE80" />
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%', backgroundColor: '#0D1117',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: 40, paddingHorizontal: 28, paddingTop: 20,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  ringWrap: { alignSelf: 'center', width: 190, height: 190, marginBottom: 24 },
  ringInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  timeText: { fontSize: 44, fontWeight: '800', letterSpacing: -1 },
  restLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600', marginTop: 4 },
  presetsRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 28 },
  presetBtn: {
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  presetBtnActive: { borderColor: '#00E5FF60', backgroundColor: '#00E5FF15' },
  presetText: { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: '700' },
  presetTextActive: { color: '#00E5FF' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  playBtn: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  ctrlBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
});
