import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  Easing, interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

interface Props {
  progress: number; // 0 to 1
  height?: number;
  colors?: string[];
  label?: string;
  value?: string;
  showPercentage?: boolean;
  animated?: boolean;
}

export default function ProgressBar({
  progress, height = 8, colors, label, value,
  showPercentage, animated = true,
}: Props) {
  const animProgress = useSharedValue(0);

  useEffect(() => {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    if (animated) {
      animProgress.value = withTiming(clampedProgress, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      animProgress.value = clampedProgress;
    }
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${interpolate(animProgress.value, [0, 1], [0, 100])}%`,
  }));

  const gradientColors = colors || [theme.colors.accent, theme.colors.accentEnd];

  return (
    <View style={styles.container}>
      {(label || value) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {value && <Text style={styles.value}>{value}</Text>}
            {showPercentage && (
              <Text style={styles.percentage}>{Math.round(progress * 100)}%</Text>
            )}
          </View>
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <Animated.View style={[styles.barWrapper, barStyle, { height }]}>
          <LinearGradient
            colors={gradientColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.bar, { height }]}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  percentage: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
  },
  track: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 100,
    overflow: 'hidden',
  },
  barWrapper: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  bar: {
    borderRadius: 100,
    width: '100%',
  },
});
