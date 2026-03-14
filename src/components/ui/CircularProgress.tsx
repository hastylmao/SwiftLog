import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  value?: string;
  children?: React.ReactNode;
}

export default function CircularProgress({
  progress, size = 80, strokeWidth = 6, color = theme.colors.accent,
  bgColor = theme.colors.surfaceElevated, label, value, children,
}: Props) {
  const animProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    animProgress.value = withTiming(Math.min(Math.max(progress, 0), 1), {
      duration: 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animProgress.value),
  }));

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      <View style={[styles.content, { width: size, height: size }]}>
        {children || (
          <>
            {value && <Text style={[styles.value, { fontSize: size * 0.2 }]}>{value}</Text>}
            {label && <Text style={[styles.label, { fontSize: size * 0.12 }]}>{label}</Text>}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.bold,
  },
  label: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    marginTop: 2,
  },
});
