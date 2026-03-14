import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  style,
  textStyle,
  fullWidth,
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 12, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSequence(
      withSpring(1.02, { damping: 9, stiffness: 420 }),
      withSpring(1, { damping: 12, stiffness: 280 })
    );
  };

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 18 },
    md: { paddingVertical: 14, paddingHorizontal: 26 },
    lg: { paddingVertical: 18, paddingHorizontal: 34 },
  };

  const fontSizes = { sm: 13, md: 15, lg: 17 };

  const content = loading ? (
    <ActivityIndicator color="#fff" size="small" />
  ) : (
    <>
      {icon && <>{icon}</>}
      <Text
        style={[
          styles.text,
          { fontSize: fontSizes[size] },
          variant === 'outline' && { color: theme.colors.accent },
          variant === 'ghost' && { color: theme.colors.accent },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </>
  );

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[animStyle, fullWidth && { width: '100%' }]}
        hitSlop={8}
      >
        <View style={styles.glowWrap}>
          <View style={styles.glowShadow} />
          <LinearGradient
            colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.primaryBorder, disabled && styles.disabled, style]}
          >
            <LinearGradient
              colors={['#1FE0FF', '#0DB9E5', '#4F8BFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.base, sizeStyles[size], styles.primaryInner]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.22)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primarySheen}
              />
              {content}
            </LinearGradient>
          </LinearGradient>
        </View>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animStyle, fullWidth && { width: '100%' }]}
      hitSlop={8}
    >
      {variant === 'ghost' ? (
        <View
          style={[
            styles.base,
            sizeStyles[size],
            styles.ghost,
            disabled && styles.disabled,
            fullWidth && { width: '100%' },
            style,
          ]}
        >
          {content}
        </View>
      ) : (
        <BlurView
          tint="dark"
          intensity={20}
          style={[
            styles.base,
            sizeStyles[size],
            variant === 'secondary' && styles.secondary,
            variant === 'outline' && styles.outline,
            disabled && styles.disabled,
            fullWidth && { width: '100%' },
            style,
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.12)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.secondarySheen}
          />
          {content}
        </BlurView>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    gap: 8,
  },
  primaryInner: {
    overflow: 'hidden',
  },
  primarySheen: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: '45%',
    borderRadius: theme.borderRadius.lg,
  },
  text: {
    color: '#fff',
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.3,
  },
  glowWrap: {
    position: 'relative',
  },
  glowShadow: {
    position: 'absolute',
    top: 8,
    bottom: -8,
    left: '12%',
    right: '12%',
    backgroundColor: 'transparent',
    borderRadius: 28,
    opacity: 0,
  },
  primaryBorder: {
    borderRadius: theme.borderRadius.lg,
    padding: 1,
    overflow: 'hidden',
  },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    overflow: 'hidden',
  },
  outline: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    overflow: 'hidden',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  secondarySheen: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
  },
  disabled: {
    opacity: 0.45,
  },
});
