import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import AnimatedButton from '../../components/ui/AnimatedButton';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import GlowingIcon from '../../components/ui/GlowingIcon';
import { calculateMaintenanceCalories, calculateMacros, CALORIE_MODE_LABELS, CALORIE_MODE_OFFSETS } from '../../constants/splits';
import { CalorieMode } from '../../types';
import Toast from 'react-native-toast-message';

const STEPS = [0, 1, 2, 3];

const MACRO_COLORS: Record<string, string> = {
  Protein: theme.colors.protein,
  Carbs: theme.colors.carbs,
  Fat: theme.colors.fat,
};

export default function OnboardingCalories({ navigation }: any) {
  const { user, saveSettings } = useApp();
  const [selectedMode, setSelectedMode] = useState<CalorieMode>('maintain');
  const [loading, setLoading] = useState(false);

  const maintenance = useMemo(() => {
    if (!user) return 2000;
    return calculateMaintenanceCalories(
      user.current_weight_kg,
      user.height_cm,
      user.age,
      user.gender
    );
  }, [user]);

  const targetCalories = maintenance + (CALORIE_MODE_OFFSETS[selectedMode] || 0);
  const macros = useMemo(() => calculateMacros(targetCalories, user?.current_weight_kg || 70), [targetCalories, user]);

  const modes: CalorieMode[] = ['heavy_cut', 'light_cut', 'maintain', 'light_bulk', 'heavy_bulk'];

  const totalMacroGrams = macros.protein + macros.carbs + macros.fat;

  const handleNext = async () => {
    setLoading(true);
    try {
      await saveSettings({
        calorie_mode: selectedMode,
        maintenance_calories: maintenance,
        target_calories: targetCalories,
        target_protein: macros.protein,
        target_carbs: macros.carbs,
        target_fat: macros.fat,
      });
      navigation.navigate('OnboardingSplit');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInRight.duration(400)}>
          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            {STEPS.map((s) => (
              <View key={s} style={styles.stepDotOuter}>
                {s === 2 ? (
                  <LinearGradient
                    colors={[theme.colors.accentGreen, theme.colors.accentCyan]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.stepDotInner, { width: 24 }]}
                  />
                ) : s < 2 ? (
                  <View style={[styles.stepDotInner, styles.stepDone]} />
                ) : (
                  <View style={styles.stepDotInner} />
                )}
              </View>
            ))}
          </View>

          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.headerContainer}>
            <GlowingIcon icon="flame-outline" size={38} color={theme.colors.accentGreen} bgSize={80} />
            <Text style={styles.title}>Calorie Target</Text>
            <Text style={styles.subtitle}>Based on your profile, your estimated maintenance is</Text>
          </Animated.View>

          {/* Maintenance Highlight */}
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.maintenanceCard}>
            <LinearGradient
              colors={[theme.colors.accentGreen + '15', theme.colors.accentCyan + '08']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.maintenanceGradientBg}
            />
            <Text style={styles.maintenanceValue}>{maintenance}</Text>
            <Text style={styles.maintenanceUnit}>kcal / day</Text>
          </Animated.View>

          {/* Mode Cards */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.glassCard}>
            <Text style={styles.sectionTitle}>Choose Your Goal</Text>
            <View style={styles.modesContainer}>
              {modes.map((mode, index) => {
                const isActive = selectedMode === mode;
                const modeCals = maintenance + CALORIE_MODE_OFFSETS[mode];
                return (
                  <Animated.View key={mode} entering={FadeInDown.delay(250 + index * 60).duration(300)}>
                    <Pressable
                      onPress={() => setSelectedMode(mode)}
                      style={[styles.modeCard, isActive && styles.modeCardActive]}
                      hitSlop={4}
                    >
                      {isActive && (
                        <LinearGradient
                          colors={[theme.colors.accent + '15', theme.colors.accentEnd + '08']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFillObject}
                        />
                      )}
                      <View style={styles.modeHeader}>
                        <View style={styles.modeLeft}>
                          {isActive && (
                            <View style={styles.modeActiveDot}>
                              <LinearGradient
                                colors={[theme.colors.accent, theme.colors.accentEnd]}
                                style={{ width: 8, height: 8, borderRadius: 4 }}
                              />
                            </View>
                          )}
                          <Text style={[styles.modeName, isActive && styles.modeNameActive]}>
                            {CALORIE_MODE_LABELS[mode]}
                          </Text>
                        </View>
                        <Text style={[styles.modeCalories, isActive && styles.modeCaloriesActive]}>
                          {modeCals} kcal
                        </Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* Macro Distribution */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.glassCard}>
            <Text style={styles.sectionTitle}>Macro Breakdown</Text>
            <View style={styles.macroBarContainer}>
              <View style={styles.macroBar}>
                <View style={[styles.macroBarSegment, {
                  flex: macros.protein / totalMacroGrams,
                  backgroundColor: theme.colors.protein,
                  borderTopLeftRadius: 6,
                  borderBottomLeftRadius: 6,
                }]} />
                <View style={[styles.macroBarSegment, {
                  flex: macros.carbs / totalMacroGrams,
                  backgroundColor: theme.colors.carbs,
                }]} />
                <View style={[styles.macroBarSegment, {
                  flex: macros.fat / totalMacroGrams,
                  backgroundColor: theme.colors.fat,
                  borderTopRightRadius: 6,
                  borderBottomRightRadius: 6,
                }]} />
              </View>
            </View>
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <View style={[styles.macroColorDot, { backgroundColor: theme.colors.protein }]} />
                <Text style={[styles.macroValue, { color: theme.colors.protein }]}>{macros.protein}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroColorDot, { backgroundColor: theme.colors.carbs }]} />
                <Text style={[styles.macroValue, { color: theme.colors.carbs }]}>{macros.carbs}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroColorDot, { backgroundColor: theme.colors.fat }]} />
                <Text style={[styles.macroValue, { color: theme.colors.fat }]}>{macros.fat}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
            <Text style={styles.totalCalories}>{targetCalories} kcal / day</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(500)}>
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
  stepDotInner: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceElevated,
  },
  stepDone: {
    backgroundColor: theme.colors.accentGreen,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 16,
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
  maintenanceCard: {
    backgroundColor: theme.colors.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.accentGreen + '30',
    paddingVertical: 20,
    marginBottom: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  maintenanceGradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  maintenanceValue: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.accentGreen,
  },
  maintenanceUnit: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
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
  modesContainer: {
    gap: 8,
  },
  modeCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    backgroundColor: theme.colors.glass,
    overflow: 'hidden',
  },
  modeCardActive: {
    borderColor: theme.colors.accent + '50',
  },
  modeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  modeName: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  modeNameActive: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  modeCalories: {
    color: theme.colors.textTertiary,
    fontSize: 13,
  },
  modeCaloriesActive: {
    color: theme.colors.textSecondary,
  },
  macroBarContainer: {
    marginBottom: 16,
  },
  macroBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
    gap: 2,
  },
  macroBarSegment: {
    height: '100%',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  macroItem: {
    alignItems: 'center',
    gap: 4,
  },
  macroColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  macroLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  totalCalories: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    fontWeight: '500',
  },
});
