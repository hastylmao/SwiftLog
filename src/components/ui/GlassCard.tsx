import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  index?: number;
  glowColor?: string;
  variant?: 'default' | 'accent' | 'glow';
}

export default function GlassCard({
  children, style, delay, index = 0, glowColor, variant = 'default',
}: Props) {
  const borderColor = variant === 'accent'
    ? theme.colors.borderAccent
    : variant === 'glow' && glowColor
      ? glowColor + '25'
      : theme.colors.glassBorder;

  return (
    <Animated.View
      entering={FadeInDown.delay((delay ?? index * 100) + 100).duration(500).springify()}
      style={[styles.card, { borderColor }, style]}
    >
      {/* Top highlight line */}
      <View style={styles.highlightLine}>
        <LinearGradient
          colors={['transparent', theme.colors.glassHighlight, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.highlightGradient}
        />
      </View>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
  },
  highlightLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
  },
  highlightGradient: {
    height: 1,
    width: '100%',
  },
});
