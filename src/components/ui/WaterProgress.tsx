import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  Easing, interpolate, interpolateColor,
} from 'react-native-reanimated';
import { theme } from '../../theme';

interface Props {
  progress: number; // 0-1
  height?: number;
  goal?: number;
  current?: number;
  style?: ViewStyle;
}

export default function WaterProgress({ progress, height = 200, goal = 3000, current = 0, style }: Props) {
  const animProgress = useSharedValue(0);

  useEffect(() => {
    animProgress.value = withTiming(Math.min(Math.max(progress, 0), 1), {
      duration: 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [progress]);

  const waterStyle = useAnimatedStyle(() => ({
    height: `${interpolate(animProgress.value, [0, 1], [0, 100])}%`,
  }));

  return (
    <View style={[styles.container, { height }, style]}>
      <View style={styles.glass}>
        <Animated.View style={[styles.water, waterStyle]}>
          <View style={styles.waterSurface} />
        </Animated.View>
        <View style={styles.labelContainer}>
          <Text style={styles.currentText}>{current}ml</Text>
          <Text style={styles.goalText}>/ {goal}ml</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glass: {
    width: 80,
    height: '100%',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.water + '40',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  water: {
    width: '100%',
    backgroundColor: theme.colors.water + '60',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    position: 'relative',
  },
  waterSurface: {
    position: 'absolute',
    top: -3,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: theme.colors.water + '80',
    borderRadius: 3,
  },
  labelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
  },
  goalText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.medium,
  },
});
