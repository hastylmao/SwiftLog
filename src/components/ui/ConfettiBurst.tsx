import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSequence,
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');

const COLORS = ['#FF6B6B', '#4A90FF', '#FFD93D', '#6BCB77', '#7B61FF', '#FF8A00', '#00E5A0', '#FF6EC7'];
const PARTICLE_COUNT = 40;

interface Props {
  trigger: boolean;
  onDone?: () => void;
}

export default function ConfettiBurst({ trigger, onDone }: Props) {
  if (!trigger) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Particle key={i} index={i} onDone={i === 0 ? onDone : undefined} />
      ))}
    </View>
  );
}

function Particle({ index, onDone }: { index: number; onDone?: () => void }) {
  const x = useSharedValue(SW / 2);
  const y = useSharedValue(SH * 0.4);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  const color = COLORS[index % COLORS.length];
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5);
  const speed = 120 + Math.random() * 200;
  const size = 6 + Math.random() * 6;
  const isRect = index % 3 !== 0;

  useEffect(() => {
    const delay = Math.random() * 200;
    scale.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0.6, { duration: 1500 }),
    ));
    x.value = withDelay(delay,
      withTiming(SW / 2 + Math.cos(angle) * speed, { duration: 800 })
    );
    y.value = withDelay(delay, withSequence(
      withTiming(SH * 0.4 - 80 - Math.random() * 150, { duration: 500 }),
      withTiming(SH + 20, { duration: 1200 }),
    ));
    rotate.value = withDelay(delay,
      withTiming(Math.random() * 720 - 360, { duration: 2000 })
    );
    opacity.value = withDelay(1200 + delay,
      withTiming(0, { duration: 600 })
    );
    if (onDone) {
      setTimeout(onDone, 2200);
    }
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    width: isRect ? size * 1.5 : size,
    height: size,
    borderRadius: isRect ? 2 : size / 2,
    backgroundColor: color,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return <Animated.View style={style} />;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 999,
  },
});
