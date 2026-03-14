import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
  Pressable,
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

export default function OnboardingProfile({ navigation }: any) {
  const { createProfile } = useApp();
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [startWeight, setStartWeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!username || !age || !height || !startWeight || !currentWeight || !goalWeight) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill in all fields' });
      return;
    }
    setLoading(true);
    try {
      await createProfile({
        username: username.trim().toLowerCase(),
        age: parseInt(age),
        height_cm: parseFloat(height),
        starting_weight_kg: parseFloat(startWeight),
        current_weight_kg: parseFloat(currentWeight),
        goal_weight_kg: parseFloat(goalWeight),
        gender,
      });
      navigation.navigate('OnboardingApiKey');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error?.message || 'Failed to save profile' });
    } finally {
      setLoading(false);
    }
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
                <View key={s} style={[styles.stepDotOuter, s === 0 && styles.stepDotActiveOuter]}>
                  {s === 0 ? (
                    <LinearGradient
                      colors={[theme.colors.accent, theme.colors.accentEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.stepDotInner, { width: 24 }]}
                    />
                  ) : (
                    <View style={styles.stepDotInner} />
                  )}
                </View>
              ))}
            </View>

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.headerContainer}>
              <GlowingIcon icon="person-outline" size={38} color={theme.colors.accent} bgSize={80} />
              <Text style={styles.title}>Your Profile</Text>
              <Text style={styles.subtitle}>Tell us about yourself to personalize your experience.</Text>
            </Animated.View>

            {/* Glass Form Card */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.glassCard}>
              <Input label="Username" value={username} onChangeText={setUsername} placeholder="fitking42" />

              <View style={styles.genderRow}>
                <Text style={styles.genderLabel}>Gender</Text>
                <View style={styles.genderButtons}>
                  <Pressable
                    onPress={() => setGender('male')}
                    style={[styles.genderBtn, gender === 'male' && styles.genderActive]}
                    hitSlop={8}
                  >
                    {gender === 'male' ? (
                      <LinearGradient
                        colors={[theme.colors.accent, theme.colors.accentEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.genderGradient}
                      >
                        <Ionicons name="male" size={20} color="#fff" />
                        <Text style={styles.genderTextActive}>Male</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.genderInner}>
                        <Ionicons name="male" size={20} color={theme.colors.textSecondary} />
                        <Text style={styles.genderText}>Male</Text>
                      </View>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => setGender('female')}
                    style={[styles.genderBtn, gender === 'female' && styles.genderActive]}
                    hitSlop={8}
                  >
                    {gender === 'female' ? (
                      <LinearGradient
                        colors={[theme.colors.neonPink, theme.colors.accentEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.genderGradient}
                      >
                        <Ionicons name="female" size={20} color="#fff" />
                        <Text style={styles.genderTextActive}>Female</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.genderInner}>
                        <Ionicons name="female" size={20} color={theme.colors.textSecondary} />
                        <Text style={styles.genderText}>Female</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              </View>

              <Input label="Age" value={age} onChangeText={setAge} placeholder="25" keyboardType="numeric" />
              <Input label="Height (cm)" value={height} onChangeText={setHeight} placeholder="175" keyboardType="decimal-pad" />
            </Animated.View>

            {/* Weight Glass Card */}
            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.glassCard}>
              <Text style={styles.sectionTitle}>Weight</Text>
              <Input label="Starting Weight (kg)" value={startWeight} onChangeText={setStartWeight} placeholder="80" keyboardType="decimal-pad" />
              <Input label="Current Weight (kg)" value={currentWeight} onChangeText={setCurrentWeight} placeholder="78" keyboardType="decimal-pad" />
              <Input label="Goal Weight (kg)" value={goalWeight} onChangeText={setGoalWeight} placeholder="72" keyboardType="decimal-pad" />
            </Animated.View>

            {/* Health Disclaimer */}
            <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.disclaimerBox}>
              <Ionicons name="warning-outline" size={18} color={theme.colors.warning} />
              <Text style={styles.disclaimerText}>
                Swift Logger is a fitness tracking tool, not a medical device. AI suggestions are for informational purposes only. Always consult a healthcare professional before starting any diet or exercise program.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(500)}>
              <AnimatedButton
                title="Continue"
                onPress={handleNext}
                loading={loading}
                fullWidth
                size="lg"
                style={{ marginTop: 8, marginBottom: 40 }}
                icon={<Ionicons name="arrow-forward" size={18} color="#fff" />}
              />
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

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
  stepDotOuter: {
    overflow: 'hidden',
    borderRadius: 999,
  },
  stepDotActiveOuter: {
    borderRadius: 999,
  },
  stepDotInner: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceElevated,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  glassCard: {
    backgroundColor: theme.colors.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  genderRow: {
    marginBottom: 16,
  },
  genderLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  genderActive: {
    borderColor: theme.colors.accent,
  },
  genderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  genderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  genderText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  genderTextActive: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  disclaimerBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.15)',
    marginBottom: 8,
  },
  disclaimerText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
