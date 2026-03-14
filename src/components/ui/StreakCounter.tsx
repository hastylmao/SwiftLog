import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, FadeIn, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

interface Props {
  count: number;
  label?: string;
}

export default function StreakCounter({ count, label = 'Day Streak' }: Props) {
  const pulseScale = useSharedValue(1);
  const flameY = useSharedValue(0);

  useEffect(() => {
    if (count > 0) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1, true,
      );
      flameY.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1, true,
      );
    }
  }, [count]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: flameY.value }],
  }));

  if (count <= 0) return null;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      <Animated.View style={[styles.iconWrap, pulseStyle]}>
        <LinearGradient
          colors={['#FF8A00', '#FF4757']}
          style={styles.iconBg}
        >
          <Animated.View style={flameStyle}>
            <Ionicons name="flame" size={22} color="#fff" />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
      <View>
        <Text style={styles.count}>{count}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,138,0,0.08)',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,138,0,0.15)',
  },
  iconWrap: {},
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    color: '#FF8A00',
    fontSize: 20,
    fontWeight: theme.fontWeight.heavy,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.medium,
  },
});
