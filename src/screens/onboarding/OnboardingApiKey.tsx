import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
  Pressable, Linking,
} from 'react-native';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import AnimatedButton from '../../components/ui/AnimatedButton';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import GlowingIcon from '../../components/ui/GlowingIcon';
import Input from '../../components/ui/Input';
import Toast from 'react-native-toast-message';

const STEPS = [0, 1, 2, 3];

export default function OnboardingApiKey({ navigation }: any) {
  const { saveSettings } = useApp();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      Toast.show({ type: 'error', text1: 'Empty Key', text2: 'Please enter your API key or tap Skip' });
      return;
    }
    setLoading(true);
    try {
      await saveSettings({ gemini_api_key: apiKey.trim() });
      Toast.show({ type: 'success', text1: 'Key Saved!', text2: 'Using your personal Gemini key' });
      navigation.navigate('OnboardingCalories');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save API key' });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    // Navigate without saving a key — the app will use the default key
    navigation.navigate('OnboardingCalories');
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInRight.duration(400)}>
            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
              {STEPS.map((s) => (
                <View key={s} style={styles.stepDotOuter}>
                  {s === 1 ? (
                    <LinearGradient
                      colors={[theme.colors.accent, theme.colors.accentEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.stepDotInner, { width: 24 }]}
                    />
                  ) : s < 1 ? (
                    <View style={[styles.stepDotInner, styles.stepDone]} />
                  ) : (
                    <View style={styles.stepDotInner} />
                  )}
                </View>
              ))}
            </View>

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.headerContainer}>
              <GlowingIcon icon="key-outline" size={38} color={theme.colors.accentOrange} bgSize={80} />
              <Text style={styles.title}>AI-Powered Features</Text>
              <Text style={styles.subtitle}>
                The app works out of the box — bring your own key for higher limits.
              </Text>
            </Animated.View>

            {/* Default Key Notice */}
            <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.defaultKeyCard}>
              <LinearGradient
                colors={[theme.colors.accentGreen + '18', theme.colors.accentCyan + '10']}
                style={styles.defaultKeyGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.defaultKeyHeader}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.accentGreen} />
                  <Text style={styles.defaultKeyTitle}>Ready to Go!</Text>
                </View>
                <Text style={styles.defaultKeyText}>
                  Swift Logger includes a shared AI key so you can start logging immediately. All AI features work right away.
                </Text>
                <View style={styles.featureList}>
                  <FeatureRow icon="sparkles" color={theme.colors.accentOrange} text="AI food analysis from photos" />
                  <FeatureRow icon="barbell-outline" color={theme.colors.accentGreen} text="Natural language workout parsing" />
                  <FeatureRow icon="chatbubble-ellipses-outline" color={theme.colors.accent} text="Personal AI fitness coach" />
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Personal Key Section */}
            <Animated.View entering={FadeInDown.delay(260).duration(500)} style={styles.glassCard}>
              <View style={styles.optionalHeader}>
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
                </View>
                <Text style={styles.optionalTitle}>Your Own Gemini Key</Text>
              </View>
              <Text style={styles.optionalDesc}>
                Add your personal key for unlimited usage and higher rate limits with Gemini 2.5 Flash.
              </Text>

              <Text style={styles.inputLabel}>API Key</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={18} color={theme.colors.textTertiary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Input
                    value={apiKey}
                    onChangeText={setApiKey}
                    placeholder="AIzaSy... (optional)"
                    autoCapitalize="none"
                    secureTextEntry={!showKey}
                    style={{ marginBottom: 0 }}
                  />
                </View>
                <Pressable onPress={() => setShowKey(!showKey)} hitSlop={12} style={{ marginLeft: 8 }}>
                  <Ionicons
                    name={showKey ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              </View>

              <Pressable
                onPress={() => Linking.openURL('https://aistudio.google.com/apikey')}
                style={styles.linkRow}
              >
                <Ionicons name="open-outline" size={14} color={theme.colors.accent} />
                <Text style={styles.linkText}>Get your free key at Google AI Studio →</Text>
              </Pressable>
            </Animated.View>

            {/* Buttons */}
            <Animated.View entering={FadeInDown.delay(340).duration(500)} style={styles.buttonGroup}>
              {apiKey.trim().length > 0 ? (
                <AnimatedButton
                  title="Save Key & Continue"
                  onPress={handleSaveKey}
                  loading={loading}
                  fullWidth
                  size="lg"
                  style={{ marginBottom: 12 }}
                  icon={<Ionicons name="arrow-forward" size={18} color="#fff" />}
                />
              ) : null}
              <Pressable onPress={handleSkip} style={styles.skipBtn}>
                <Text style={styles.skipBtnText}>
                  {apiKey.trim().length > 0 ? 'Skip for now' : 'Continue without personal key →'}
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FeatureRow({ icon, color, text }: { icon: string; color: string; text: string }) {
  return (
    <View style={featureStyles.row}>
      <View style={[featureStyles.dot, { backgroundColor: color + '20', borderColor: color + '30' }]}>
        <Ionicons name={icon as any} size={14} color={color} />
      </View>
      <Text style={featureStyles.text}>{text}</Text>
    </View>
  );
}

const featureStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  dot: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  text: { color: theme.colors.textSecondary, fontSize: 13, flex: 1 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  stepDotOuter: { overflow: 'hidden', borderRadius: 999 },
  stepDotInner: {
    width: 8, height: 8, borderRadius: 999,
    backgroundColor: theme.colors.surfaceElevated,
  },
  stepDone: { backgroundColor: theme.colors.accentGreen },
  headerContainer: { alignItems: 'center', marginBottom: 24 },
  title: {
    fontSize: 26, fontWeight: '700', color: theme.colors.textPrimary,
    textAlign: 'center', marginTop: 16, marginBottom: 8,
  },
  subtitle: {
    fontSize: 14, color: theme.colors.textSecondary,
    textAlign: 'center', lineHeight: 21, paddingHorizontal: 8,
  },
  defaultKeyCard: {
    borderRadius: 20, borderWidth: 1,
    borderColor: theme.colors.accentGreen + '30', marginBottom: 16, overflow: 'hidden',
  },
  defaultKeyGrad: { padding: 18 },
  defaultKeyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  defaultKeyTitle: {
    color: theme.colors.textPrimary, fontSize: 15, fontWeight: '700',
  },
  defaultKeyText: {
    color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 14,
  },
  featureList: { gap: 2 },
  glassCard: {
    backgroundColor: theme.colors.glass,
    borderRadius: 20, borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    padding: 20, marginBottom: 16,
  },
  optionalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  optionalBadge: {
    backgroundColor: theme.colors.accentOrange + '20',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: theme.colors.accentOrange + '30',
  },
  optionalBadgeText: {
    color: theme.colors.accentOrange, fontSize: 10, fontWeight: '700', letterSpacing: 0.8,
  },
  optionalTitle: {
    color: theme.colors.textPrimary, fontSize: 15, fontWeight: '600',
  },
  optionalDesc: {
    color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 14,
  },
  inputLabel: {
    color: theme.colors.textSecondary, fontSize: 12,
    fontWeight: '500', marginBottom: 8,
  },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: theme.colors.accent + '12',
    borderRadius: 10, alignSelf: 'center', marginTop: 4,
  },
  linkText: { color: theme.colors.accent, fontSize: 12, fontWeight: '600' },
  buttonGroup: { marginTop: 4, marginBottom: 40 },
  skipBtn: {
    alignItems: 'center', paddingVertical: 14,
  },
  skipBtnText: {
    color: theme.colors.textSecondary, fontSize: 14,
    fontWeight: '500',
  },
});
