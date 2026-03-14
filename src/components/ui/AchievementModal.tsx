import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withSequence, withDelay, FadeIn, FadeOut, runOnJS,
} from 'react-native-reanimated';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
}

interface Props {
  visible: boolean;
  achievement: {
    title: string;
    description: string;
    icon: string;
    tier: string;
  } | null;
  onDismiss: () => void;
}

export default function AchievementModal({ visible, achievement, onDismiss }: Props) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withSpring(1.1, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
      glowOpacity.value = withSequence(
        withDelay(300, withTiming(0.8, { duration: 300 })),
        withTiming(0.3, { duration: 1000 }),
        withTiming(0.8, { duration: 1000 }),
      );
      const timeout = setTimeout(onDismiss, 4000);
      return () => clearTimeout(timeout);
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const tierColors: Record<string, string[]> = {
    bronze: ['#CD7F32', '#A0522D'],
    silver: ['#C0C0C0', '#808080'],
    gold: ['#FFD700', '#FFA500'],
    diamond: ['#B9F2FF', '#4FC3F7'],
  };

  if (!visible || !achievement) return null;

  const colors = tierColors[achievement.tier] || tierColors.gold;

  return (
    <Animated.View style={[styles.overlay, containerStyle]}>
      {/* Confetti particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <ConfettiPieceView key={i} index={i} />
      ))}

      <Animated.View style={[styles.glowCircle, glowStyle, { backgroundColor: colors[0] }]} />

      <Animated.View style={[styles.badge, badgeStyle]}>
        <View style={[styles.iconCircle, { backgroundColor: colors[0] }]}>
          <Ionicons name={achievement.icon as any || 'trophy'} size={48} color="#fff" />
        </View>
        <Text style={styles.unlocked}>ACHIEVEMENT UNLOCKED!</Text>
        <Text style={styles.title}>{achievement.title}</Text>
        <Text style={styles.description}>{achievement.description}</Text>
        <View style={[styles.tierBadge, { backgroundColor: colors[0] + '30' }]}>
          <Text style={[styles.tierText, { color: colors[0] }]}>
            {achievement.tier.toUpperCase()}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function ConfettiPieceView({ index }: { index: number }) {
  const translateX = useSharedValue(SCREEN_WIDTH / 2);
  const translateY = useSharedValue(SCREEN_HEIGHT / 2);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  const colors = ['#FF6B6B', '#4A90FF', '#FFD93D', '#6BCB77', '#7B61FF', '#FF9F0A'];
  const color = colors[index % colors.length];

  useEffect(() => {
    const angle = (index / 30) * Math.PI * 2;
    const distance = 150 + Math.random() * 200;

    translateX.value = withDelay(
      200 + Math.random() * 300,
      withTiming(SCREEN_WIDTH / 2 + Math.cos(angle) * distance, { duration: 800 })
    );
    translateY.value = withSequence(
      withDelay(
        200 + Math.random() * 300,
        withTiming(SCREEN_HEIGHT / 2 - 100 - Math.random() * 200, { duration: 500 })
      ),
      withTiming(SCREEN_HEIGHT + 50, { duration: 1500 })
    );
    rotation.value = withTiming(Math.random() * 720, { duration: 2000 });
    opacity.value = withDelay(1500, withTiming(0, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return <Animated.View style={style} />;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 999,
  },
  glowCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.3,
  },
  badge: {
    alignItems: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  unlocked: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 3,
    marginBottom: 8,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: theme.fontWeight.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 32,
  },
  tierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tierText: {
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
  },
});
