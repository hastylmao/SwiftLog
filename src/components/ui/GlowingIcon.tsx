import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  icon: string;
  size?: number;
  color: string;
  bgSize?: number;
  gradient?: boolean;
  gradientColors?: string[];
}

/** An icon with a subtle glow halo behind it */
export default function GlowingIcon({
  icon, size = 22, color, bgSize, gradient = false, gradientColors,
}: Props) {
  const bg = bgSize || size * 2;

  if (gradient && gradientColors) {
    return (
      <View style={[styles.container, { width: bg, height: bg, borderRadius: bg / 2 }]}>
        <View style={[styles.glow, { backgroundColor: color, width: bg, height: bg, borderRadius: bg / 2 }]} />
        <LinearGradient colors={gradientColors as any} style={[styles.inner, { width: bg, height: bg, borderRadius: bg / 2 }]}>
          <Ionicons name={icon as any} size={size} color="#fff" />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: bg, height: bg, borderRadius: bg / 2 }]}>
      <View style={[styles.glow, { backgroundColor: color, width: bg, height: bg, borderRadius: bg / 2 }]} />
      <View style={[styles.inner, { width: bg, height: bg, borderRadius: bg / 2, backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={size} color={color} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    opacity: 0.15,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
