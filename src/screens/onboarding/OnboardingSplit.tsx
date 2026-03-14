import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
} from 'react-native';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import AnimatedButton from '../../components/ui/AnimatedButton';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import GlowingIcon from '../../components/ui/GlowingIcon';
import { SPLIT_PRESETS, MUSCLE_GROUPS } from '../../constants/splits';
import Toast from 'react-native-toast-message';

const STEPS = [0, 1, 2, 3];

const MUSCLE_CHIP_COLORS: Record<string, string> = {
  Chest: '#FF6B6B',
  Back: '#4A90FF',
  Shoulders: '#FF8A00',
  Biceps: '#FF6EC7',
  Triceps: '#7B61FF',
  Quads: '#00E5A0',
  Hamstrings: '#00D4FF',
  Glutes: '#FFD93D',
  Calves: '#39FF14',
  Core: '#FF453A',
  Traps: '#6BCB77',
  Forearms: '#00D4FF',
  'Rear Delts': '#FF9F0A',
  'Full Body': '#4A90FF',
  Arms: '#FF6EC7',
  Legs: '#00E5A0',
};

export default function OnboardingSplit({ navigation }: any) {
  const { saveSplit, updateProfile } = useApp();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customDays, setCustomDays] = useState([
    { day_name: '', muscle_groups: [] as string[] },
  ]);
  const [loading, setLoading] = useState(false);

  const addCustomDay = () => {
    setCustomDays([...customDays, { day_name: '', muscle_groups: [] }]);
  };

  const removeCustomDay = (index: number) => {
    setCustomDays(customDays.filter((_, i) => i !== index));
  };

  const toggleMuscle = (dayIndex: number, muscle: string) => {
    const updated = [...customDays];
    const groups = updated[dayIndex].muscle_groups;
    if (groups.includes(muscle)) {
      updated[dayIndex].muscle_groups = groups.filter(g => g !== muscle);
    } else {
      updated[dayIndex].muscle_groups = [...groups, muscle];
    }
    setCustomDays(updated);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      if (isCustom) {
        const validDays = customDays.filter(d => d.day_name && d.muscle_groups.length > 0);
        if (validDays.length === 0) {
          Toast.show({ type: 'error', text1: 'Error', text2: 'Add at least one day' });
          setLoading(false);
          return;
        }
        await saveSplit(
          { name: 'Custom Split', type: 'custom', is_active: true },
          validDays.map((d, i) => ({ ...d, day_number: i }))
        );
      } else if (selectedPreset !== null) {
        const preset = SPLIT_PRESETS[selectedPreset];
        await saveSplit(
          { name: preset.name, type: 'preset', is_active: true },
          preset.days.map((d, i) => ({ ...d, day_number: i }))
        );
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Please select a split' });
        setLoading(false);
        return;
      }

      await updateProfile({ onboarding_completed: true });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save split' });
    } finally {
      setLoading(false);
    }
  };

  const getMuscleColor = (muscle: string) => MUSCLE_CHIP_COLORS[muscle] || theme.colors.accent;

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInRight.duration(400)}>
          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            {STEPS.map((s) => (
              <View key={s} style={styles.stepDotOuter}>
                {s === 3 ? (
                  <LinearGradient
                    colors={[theme.colors.accentEnd, theme.colors.neonPink]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.stepDotInner, { width: 24 }]}
                  />
                ) : s < 3 ? (
                  <View style={[styles.stepDotInner, styles.stepDone]} />
                ) : (
                  <View style={styles.stepDotInner} />
                )}
              </View>
            ))}
          </View>

          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.headerContainer}>
            <GlowingIcon icon="calendar-outline" size={38} color={theme.colors.accentEnd} bgSize={80} />
            <Text style={styles.title}>Workout Split</Text>
            <Text style={styles.subtitle}>Choose how you want to organize your training days.</Text>
          </Animated.View>

          {/* Toggle */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.toggleContainer}>
            <Pressable
              onPress={() => setIsCustom(false)}
              style={[styles.toggleBtn, !isCustom && styles.toggleBtnActive]}
              hitSlop={8}
            >
              {!isCustom ? (
                <LinearGradient
                  colors={[theme.colors.accent, theme.colors.accentEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.toggleGradient}
                >
                  <Ionicons name="layers-outline" size={16} color="#fff" />
                  <Text style={styles.toggleTextActive}>Presets</Text>
                </LinearGradient>
              ) : (
                <View style={styles.toggleInner}>
                  <Ionicons name="layers-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.toggleText}>Presets</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => setIsCustom(true)}
              style={[styles.toggleBtn, isCustom && styles.toggleBtnActive]}
              hitSlop={8}
            >
              {isCustom ? (
                <LinearGradient
                  colors={[theme.colors.accent, theme.colors.accentEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.toggleGradient}
                >
                  <Ionicons name="create-outline" size={16} color="#fff" />
                  <Text style={styles.toggleTextActive}>Custom</Text>
                </LinearGradient>
              ) : (
                <View style={styles.toggleInner}>
                  <Ionicons name="create-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.toggleText}>Custom</Text>
                </View>
              )}
            </Pressable>
          </Animated.View>

          {!isCustom ? (
            <View style={styles.presetsContainer}>
              {SPLIT_PRESETS.map((preset, index) => {
                const isActive = selectedPreset === index;
                return (
                  <Animated.View key={preset.name} entering={FadeInDown.delay(300 + index * 60).duration(300)}>
                    <Pressable
                      onPress={() => setSelectedPreset(index)}
                      style={[styles.presetCard, isActive && styles.presetCardActive]}
                      hitSlop={2}
                    >
                      {isActive && (
                        <LinearGradient
                          colors={[theme.colors.accentEnd + '12', theme.colors.accent + '06']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFillObject}
                        />
                      )}
                      <View style={styles.presetHeader}>
                        <Text style={[styles.presetName, isActive && styles.presetNameActive]}>
                          {preset.name}
                        </Text>
                        {isActive && (
                          <View style={styles.checkCircle}>
                            <LinearGradient
                              colors={[theme.colors.accent, theme.colors.accentEnd]}
                              style={styles.checkGradient}
                            >
                              <Ionicons name="checkmark" size={14} color="#fff" />
                            </LinearGradient>
                          </View>
                        )}
                      </View>
                      <Text style={styles.presetDesc}>{preset.description}</Text>
                      <View style={styles.daysRow}>
                        {preset.days.map((day, i) => (
                          <View key={i} style={styles.dayChip}>
                            <Text style={styles.dayChipText} numberOfLines={1}>{day.day_name}</Text>
                          </View>
                        ))}
                      </View>
                      {isActive && (
                        <View style={styles.selectedMusclesRow}>
                          {[...new Set(preset.days.flatMap(d => d.muscle_groups))].map((mg) => (
                            <View
                              key={mg}
                              style={[styles.muscleTag, { backgroundColor: getMuscleColor(mg) + '20', borderColor: getMuscleColor(mg) + '40' }]}
                            >
                              <Text style={[styles.muscleTagText, { color: getMuscleColor(mg) }]}>{mg}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <View style={styles.customContainer}>
              {customDays.map((day, dayIndex) => (
                <Animated.View key={dayIndex} entering={FadeInDown.delay(300 + dayIndex * 80).duration(300)}>
                  <View style={styles.customDayCard}>
                    <View style={styles.customDayHeader}>
                      <View style={styles.dayBadge}>
                        <LinearGradient
                          colors={[theme.colors.accent, theme.colors.accentEnd]}
                          style={styles.dayBadgeGradient}
                        >
                          <Text style={styles.dayBadgeText}>{dayIndex + 1}</Text>
                        </LinearGradient>
                      </View>
                      <TextInput
                        value={day.day_name}
                        onChangeText={(text) => {
                          const updated = [...customDays];
                          updated[dayIndex].day_name = text;
                          setCustomDays(updated);
                        }}
                        placeholder={`Day ${dayIndex + 1} name`}
                        placeholderTextColor={theme.colors.textTertiary}
                        style={styles.customDayInput}
                      />
                      {customDays.length > 1 && (
                        <Pressable onPress={() => removeCustomDay(dayIndex)} hitSlop={12}>
                          <View style={styles.removeBtn}>
                            <Ionicons name="close" size={16} color={theme.colors.error} />
                          </View>
                        </Pressable>
                      )}
                    </View>
                    <View style={styles.muscleGrid}>
                      {MUSCLE_GROUPS.map(muscle => {
                        const isSelected = day.muscle_groups.includes(muscle);
                        const chipColor = getMuscleColor(muscle);
                        return (
                          <Pressable
                            key={muscle}
                            onPress={() => toggleMuscle(dayIndex, muscle)}
                            style={[
                              styles.muscleChip,
                              isSelected && { backgroundColor: chipColor + '20', borderColor: chipColor + '50' },
                            ]}
                            hitSlop={2}
                          >
                            <Text style={[
                              styles.muscleChipText,
                              isSelected && { color: chipColor },
                            ]}>
                              {muscle}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </Animated.View>
              ))}
              <AnimatedButton
                title="Add Day"
                onPress={addCustomDay}
                variant="outline"
                size="sm"
                icon={<Ionicons name="add" size={16} color={theme.colors.accent} />}
                style={{ alignSelf: 'center', marginTop: 8 }}
              />
            </View>
          )}

          <Animated.View entering={FadeInDown.delay(600).duration(500)}>
            <AnimatedButton
              title="Finish Setup"
              onPress={handleFinish}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: 24, marginBottom: 40 }}
              icon={<Ionicons name="checkmark" size={18} color="#fff" />}
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
    marginBottom: 24,
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.glass,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  toggleBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  toggleBtnActive: {},
  toggleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  toggleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  toggleText: {
    color: theme.colors.textSecondary,
    fontWeight: '500',
    fontSize: 15,
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  presetsContainer: {
    gap: 12,
  },
  presetCard: {
    backgroundColor: theme.colors.glass,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    overflow: 'hidden',
  },
  presetCardActive: {
    borderColor: theme.colors.accentEnd + '50',
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  presetName: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
  presetNameActive: {
    color: theme.colors.accentEnd,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetDesc: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayChip: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  dayChipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  selectedMusclesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glassBorder,
  },
  muscleTag: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  muscleTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  customContainer: {
    gap: 12,
  },
  customDayCard: {
    backgroundColor: theme.colors.glass,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  customDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  dayBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  dayBadgeGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  customDayInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    backgroundColor: theme.colors.glass,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  muscleChip: {
    backgroundColor: theme.colors.glass,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  muscleChipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});
