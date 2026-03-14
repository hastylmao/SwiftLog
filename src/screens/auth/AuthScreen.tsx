import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Pressable, ActivityIndicator, TextInput,
} from 'react-native';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withSpring, withSequence, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import Toast from 'react-native-toast-message';

/* ------------------------------------------------------------------ */
/*  Gradient Submit Button with bounce                                */
/* ------------------------------------------------------------------ */
function GradientSubmitButton({
  title,
  onPress,
  loading,
}: {
  title: string;
  onPress: () => void;
  loading: boolean;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 12, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSequence(
      withSpring(1.04, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
  };

  return (
    <Animated.View style={[{ marginTop: 12 }, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading}
        style={{ borderRadius: theme.borderRadius.lg, overflow: 'hidden' }}
      >
        <LinearGradient
          colors={[theme.colors.accent, theme.colors.accentEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBtn}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.gradientBtnText}>{title}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  Glass Input                                                       */
/* ------------------------------------------------------------------ */
function GlassInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address' | 'default';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.glassInputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          style={styles.glassInput}
        />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Auth Screen                                                       */
/* ------------------------------------------------------------------ */
export default function AuthScreen() {
  const { signIn, signUp } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!email || !password) {
      const msg = 'Please fill in all fields';
      setError(msg);
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      const msg = 'Passwords do not match';
      setError(msg);
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { error: err } = await signIn(email, password);
        if (err) {
          setError(err.message);
          Toast.show({ type: 'error', text1: 'Error', text2: err.message });
        }
      } else {
        const { error: err, needsConfirmation } = await signUp(email, password);
        if (err) {
          setError(err.message);
          Toast.show({ type: 'error', text1: 'Error', text2: err.message });
        } else if (needsConfirmation) {
          Toast.show({
            type: 'success',
            text1: 'Check your email',
            text2: 'A confirmation link has been sent to your email.',
          });
        }
      }
    } catch (e: any) {
      console.warn('[Auth] handleSubmit error:', e);
      const msg = e?.message || 'Something went wrong';
      setError(msg);
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setLoading(false);
    }
  }, [email, password, confirmPassword, isLogin, signIn, signUp]);

  return (
    <View style={styles.container}>
      {/* Living animated background */}
      <AnimatedBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ----- LOGO / TITLE AREA ----- */}
          <Animated.View entering={FadeInDown.delay(100).duration(700)} style={styles.header}>
            <LinearGradient
              colors={[theme.colors.accent, theme.colors.accentEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <Ionicons name="fitness" size={44} color="#fff" />
            </LinearGradient>

            <Text style={styles.appName}>Swift Logger</Text>
            <Text style={styles.tagline}>Your AI-Powered Fitness Companion</Text>
          </Animated.View>

          {/* ----- MODE TOGGLE (Login / Sign Up) ----- */}
          <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.toggleRow}>
            <View style={styles.toggleContainer}>
              <Pressable
                onPress={() => { setIsLogin(true); setError(null); }}
                style={styles.toggleHalf}
              >
                {isLogin && (
                  <LinearGradient
                    colors={[theme.colors.accent, theme.colors.accentEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.togglePill}
                  />
                )}
                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Login</Text>
              </Pressable>

              <Pressable
                onPress={() => { setIsLogin(false); setError(null); }}
                style={styles.toggleHalf}
              >
                {!isLogin && (
                  <LinearGradient
                    colors={[theme.colors.accent, theme.colors.accentEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.togglePill}
                  />
                )}
                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                  Sign Up
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* ----- GLASS FORM CARD ----- */}
          <Animated.View entering={FadeInUp.delay(400).duration(700)} style={styles.form}>
            <Text style={styles.formTitle}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={styles.formSubtitle}>
              {isLogin
                ? 'Sign in to continue your journey'
                : 'Start your fitness transformation'}
            </Text>

            {/* Error banner */}
            {error && (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={theme.colors.accentRed} />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            {/* Inputs */}
            <Animated.View entering={FadeInDown.delay(500).duration(500)}>
              <GlassInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(600).duration(500)}>
              <GlassInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                secureTextEntry
              />
            </Animated.View>

            {!isLogin && (
              <Animated.View entering={FadeInDown.delay(700).duration(500)}>
                <GlassInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter password"
                  secureTextEntry
                />
              </Animated.View>
            )}

            {/* Submit */}
            <Animated.View entering={FadeInDown.delay(750).duration(500)}>
              <GradientSubmitButton
                title={isLogin ? 'Sign In' : 'Sign Up'}
                onPress={handleSubmit}
                loading={loading}
              />
            </Animated.View>

            {/* Switch mode link */}
            <Animated.View entering={FadeInDown.delay(850).duration(500)}>
              <Pressable
                onPress={() => { setIsLogin(!isLogin); setError(null); }}
                style={styles.switchBtn}
                hitSlop={12}
              >
                <Text style={styles.switchText}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <Text style={styles.switchAccent}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  /* Root */
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xxxl,
  },

  /* ---- Header / Logo ---- */
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    // glow
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  appName: {
    fontSize: theme.fontSize.mega,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.accent,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: 4,
    letterSpacing: 0.5,
  },

  /* ---- Mode Toggle ---- */
  toggleRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    overflow: 'hidden',
    width: 220,
  },
  toggleHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  togglePill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.borderRadius.full,
  },
  toggleText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textTertiary,
    zIndex: 1,
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: theme.fontWeight.bold,
  },

  /* ---- Form Area ---- */
  form: {
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  formTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },

  /* ---- Error Banner ---- */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,69,58,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.25)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: theme.colors.accentRed,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },

  /* ---- Glass Input ---- */
  inputWrapper: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    marginLeft: 2,
  },
  glassInputContainer: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  glassInput: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
  },

  /* ---- Gradient Submit Button ---- */
  gradientBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
  },
  gradientBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.5,
  },

  /* ---- Switch link ---- */
  switchBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  switchText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  switchAccent: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.bold,
  },
});

