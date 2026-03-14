import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming,
  useDerivedValue, Easing,
} from 'react-native-reanimated';
import { theme } from '../../theme';

interface Props {
  value: number;
  duration?: number;
  style?: TextStyle;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export default function AnimatedCounter({
  value, duration = 800, style, suffix = '', prefix = '', decimals = 0,
}: Props) {
  const animValue = useSharedValue(0);

  useEffect(() => {
    animValue.value = withTiming(value, {
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [value]);

  // For simplicity in RN, we use a simulated counter with state
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    let startTime: number;
    let startVal = displayValue;
    const targetVal = value;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      setDisplayValue(Math.round((startVal + (targetVal - startVal) * eased) * Math.pow(10, decimals)) / Math.pow(10, decimals));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <Text style={[styles.text, style]}>
      {prefix}{decimals > 0 ? displayValue.toFixed(decimals) : displayValue}{suffix}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
  },
});
