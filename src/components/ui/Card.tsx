import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  index?: number;
  glowColor?: string;
}

export default function Card({ children, style, delay, index = 0, glowColor }: Props) {
  const borderGlow = glowColor || theme.colors.accent;

  return (
    <Animated.View
      entering={FadeInDown.delay((delay ?? index * 100) + 100).duration(500).springify()}
      style={[styles.shadowLayer, { shadowColor: borderGlow }, style]}
    >
      <LinearGradient
        colors={[`${borderGlow}26`, 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.borderShell}
      >
        <BlurView tint="dark" intensity={24} style={styles.card}>
          <LinearGradient
            colors={['rgba(255,255,255,0.14)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topHighlight}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.cornerGlow}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)', 'transparent']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.edgeWash}
          />
          {children}
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowLayer: {
    borderRadius: theme.borderRadius.xl,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    marginBottom: theme.spacing.lg,
  },
  borderShell: {
    borderRadius: theme.borderRadius.xl,
    padding: 1,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: 'rgba(8,12,18,0.64)',
    borderRadius: theme.borderRadius.xl - 1,
    padding: theme.spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
  },
  cornerGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 90,
  },
  edgeWash: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
});
