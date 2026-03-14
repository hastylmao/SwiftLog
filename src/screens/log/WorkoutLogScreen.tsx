import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, FlatList, TextInput,
  KeyboardAvoidingView, Platform, Modal, Image,
} from 'react-native';
import Animated, { FadeInDown, FadeIn, SlideInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import AnimatedButton from '../../components/ui/AnimatedButton';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import GlowingIcon from '../../components/ui/GlowingIcon';
import { searchExercises, getMuscleGroups } from '../../constants/exercises';
import { parseWorkout } from '../../services/gemini';
import { ExerciseDB } from '../../types';
import { MUSCLE_ICONS, getMuscleIcon, ACTIVITY_ICONS } from '../../constants/icons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import RestTimer from '../../components/ui/RestTimer';

interface ExerciseEntry {
  name: string;
  muscle_group: string;
  sets: { weight_kg: string; reps: string; completed?: boolean }[];
  superset_group?: number | null;
}

/** Check if all sets in an exercise have non-empty weight & reps */
function isExerciseComplete(exercise: ExerciseEntry): boolean {
  return exercise.sets.length > 0 && exercise.sets.every(
    s => s.weight_kg.trim() !== '' && s.reps.trim() !== '',
  );
}

export default function WorkoutLogScreen({ navigation }: any) {
  const { logWorkout, settings, splitDays } = useApp();
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [title, setTitle] = useState('');
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiParsed, setAiParsed] = useState(false);
  const [workoutImage, setWorkoutImage] = useState<string | null>(null);
  const [restTimerVisible, setRestTimerVisible] = useState(false);
  const [restTimerDuration, setRestTimerDuration] = useState(90);

  const muscleGroups = getMuscleGroups();

  const filteredExercises = searchExercises(searchQuery, selectedMuscle || undefined);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!res.canceled) {
      const manip = await ImageManipulator.manipulateAsync(res.assets[0].uri, [{ resize: { width: 800 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
      setWorkoutImage(manip.uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled) {
      const manip = await ImageManipulator.manipulateAsync(res.assets[0].uri, [{ resize: { width: 800 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
      setWorkoutImage(manip.uri);
    }
  };

  const addExercise = (exercise: ExerciseDB) => {
    setExercises([...exercises, {
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      sets: [{ weight_kg: '', reps: '' }],
    }]);
    setShowExercisePicker(false);
    setSearchQuery('');
    setSelectedMuscle(null);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...exercises];
    const lastSet = updated[exerciseIndex].sets[updated[exerciseIndex].sets.length - 1];
    updated[exerciseIndex].sets.push({
      weight_kg: lastSet?.weight_kg || '',
      reps: lastSet?.reps || '',
      completed: false,
    });
    setExercises(updated);
  };

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex].completed = !updated[exerciseIndex].sets[setIndex].completed;
    setExercises(updated);
    if (!updated[exerciseIndex].sets[setIndex].completed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const dur = restTimerDuration || 90;
    setRestTimerDuration(dur);
    setRestTimerVisible(true);
  };

  const toggleSuperset = (exerciseIndex: number) => {
    const updated = [...exercises];
    const nextIndex = exerciseIndex + 1;
    if (nextIndex >= updated.length) return;
    const currentGroup = updated[exerciseIndex].superset_group;
    if (currentGroup != null) {
      // Unlink
      updated[exerciseIndex].superset_group = null;
      updated[nextIndex].superset_group = null;
    } else {
      // Link with next exercise
      const newGroup = Date.now();
      updated[exerciseIndex].superset_group = newGroup;
      updated[nextIndex].superset_group = newGroup;
    }
    setExercises(updated);
    Haptics.selectionAsync().catch(() => {});
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    if (updated[exerciseIndex].sets.length > 1) {
      updated[exerciseIndex].sets.splice(setIndex, 1);
      setExercises(updated);
    }
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'weight_kg' | 'reps', value: string) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setExercises(updated);
  };

  const handleAIParse = async () => {
    if (!aiPrompt.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Describe your workout' });
      return;
    }
    const apiKey = settings?.gemini_api_key || '';
    setLoading(true);
    try {
      const result = await parseWorkout(aiPrompt, apiKey);
      if (result.exercises?.length) {
        setExercises(result.exercises.map(e => ({
          name: e.name,
          muscle_group: '',
          sets: e.sets.map(s => ({
            weight_kg: String(s.weight_kg || 0),
            reps: String(s.reps || 0),
          })),
        })));
        setAiParsed(true);
        Toast.show({ type: 'success', text1: 'Parsed!', text2: 'Review and confirm your workout' });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'AI Error', text2: error.message || 'Failed to parse workout' });
    } finally {
      setLoading(false);
    }
  };

  const handleLog = async () => {
    if (exercises.length === 0) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Add at least one exercise' });
      return;
    }
    setLoading(true);
    try {
      const currentDay = splitDays.length > 0
        ? splitDays[(settings?.current_split_day || 0) % splitDays.length]
        : null;

      await logWorkout({
        title: title || currentDay?.day_name || 'Workout',
        split_day_id: currentDay?.id,
        exercises: exercises.map((e, i) => ({
          exercise_name: e.name,
          muscle_group: e.muscle_group,
          order_index: i,
          sets: e.sets.map(s => ({
            weight_kg: parseFloat(s.weight_kg) || 0,
            reps: parseInt(s.reps) || 0,
          })),
        })),
      });

      Toast.show({ type: 'success', text1: 'ðŸ”¥ Workout Logged!', text2: 'Great session!' });
      setExercises([]);
      setTitle('');
      setAiPrompt('');
      setAiParsed(false);
      navigation.goBack();
    } catch (error) {
      // Handled by context
    } finally {
      setLoading(false);
    }
  };

  const strengthIcon = ACTIVITY_ICONS.workout || { icon: 'barbell', color: '#4A90FF' };

  return (
    <View style={styles.container}>
      <AnimatedBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeIn.duration(400)}>
            {/* Header with GlowingIcon */}
            <View style={styles.headerRow}>
              <GlowingIcon
                icon={strengthIcon.icon}
                color={strengthIcon.color}
                size={24}
                bgSize={48}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.title}>LOG WORKOUT</Text>
                <Text style={styles.subtitle}>Track your gains</Text>
              </View>
            </View>

            {/* Mode Toggle */}
            <View style={styles.modeToggle}>
              <Pressable
                onPress={() => setMode('manual')}
                style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
                hitSlop={8}
              >
                {mode === 'manual' ? (
                  <LinearGradient
                    colors={[theme.colors.accent, theme.colors.accentEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modeBtnGradient}
                  >
                    <Ionicons name="list-outline" size={18} color="#fff" />
                    <Text style={styles.modeTextActive}>Manual</Text>
                  </LinearGradient>
                ) : (
                  <>
                    <Ionicons name="list-outline" size={18} color={theme.colors.textSecondary} />
                    <Text style={styles.modeText}>Manual</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                onPress={() => setMode('ai')}
                style={[styles.modeBtn, mode === 'ai' && styles.modeBtnActive]}
                hitSlop={8}
              >
                {mode === 'ai' ? (
                  <LinearGradient
                    colors={[theme.colors.accentOrange, theme.colors.neonPink]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modeBtnGradient}
                  >
                    <Ionicons name="sparkles" size={18} color="#fff" />
                    <Text style={styles.modeTextActive}>AI Powered</Text>
                  </LinearGradient>
                ) : (
                  <>
                    <Ionicons name="sparkles-outline" size={18} color={theme.colors.textSecondary} />
                    <Text style={styles.modeText}>AI Powered</Text>
                  </>
                )}
              </Pressable>
            </View>

            {mode === 'ai' && !aiParsed ? (
              <View>
                {/* Section Title */}
                <Text style={styles.sectionTitle}>AI WORKOUT PARSER</Text>

                <Input
                  label="Describe your workout"
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                  placeholder="Did 4 sets of bench press, first set 60kg 12 reps, then 80kg for 8, 8, 6. Then did incline dumbbell press 3x12 at 20kg..."
                  multiline
                  numberOfLines={5}
                />

                {/* Gradient Parse Button */}
                <Pressable onPress={handleAIParse} disabled={loading} style={{ marginTop: 8 }}>
                  <LinearGradient
                    colors={[theme.colors.accentOrange, theme.colors.neonPink]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Ionicons name="sparkles" size={20} color="#fff" />
                    <Text style={styles.gradientButtonText}>
                      {loading ? 'Parsing...' : 'Parse with AI'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            ) : (
              <View>
                <Input
                  label="Workout Title (optional)"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Push Day #23"
                />

                {/* Exercises Section Title */}
                {exercises.length > 0 && (
                  <Text style={styles.sectionTitle}>EXERCISES</Text>
                )}

                {exercises.map((exercise, exIndex) => {
                  const muscleInfo = getMuscleIcon(exercise.muscle_group);
                  const complete = isExerciseComplete(exercise);

                  return (
                    <Animated.View
                      key={exIndex}
                      entering={FadeInDown.delay(exIndex * 80).duration(300)}
                    >
                      {/* Superset bracket */}
                      {exercise.superset_group != null && exIndex > 0 && exercises[exIndex - 1].superset_group === exercise.superset_group && (
                        <View style={styles.supersetBracket}>
                          <View style={styles.supersetLine} />
                          <View style={styles.supersetChip}>
                            <Ionicons name="link" size={10} color="#00E5FF" />
                            <Text style={styles.supersetChipText}>SUPERSET</Text>
                          </View>
                          <View style={styles.supersetLine} />
                        </View>
                      )}
                      <View
                        style={[
                          styles.exerciseCard,
                          { borderLeftColor: exercise.superset_group != null ? '#00E5FF' : muscleInfo.color },
                          complete && styles.exerciseCardComplete,
                        ]}
                      >
                        <View style={styles.exerciseHeader}>
                          <View style={styles.exerciseIconWrap}>
                            <Ionicons
                              name={muscleInfo.icon as any}
                              size={18}
                              color={muscleInfo.color}
                            />
                          </View>
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.exerciseName}>{exercise.name}</Text>
                            {exercise.muscle_group ? (
                              <View style={[styles.muscleChip, { backgroundColor: muscleInfo.color + '18' }]}>
                                <Text style={[styles.muscleChipText, { color: muscleInfo.color }]}>
                                  {exercise.muscle_group}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          {complete && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={theme.colors.accentGreen}
                              style={{ marginRight: 8 }}
                            />
                          )}
                          <Pressable
                            onPress={() => toggleSuperset(exIndex)}
                            hitSlop={12}
                            style={styles.supersetBtn}
                          >
                            <Ionicons
                              name={exercise.superset_group != null ? 'link' : 'link-outline'}
                              size={16}
                              color={exercise.superset_group != null ? '#00E5FF' : theme.colors.textTertiary}
                            />
                          </Pressable>
                          <Pressable onPress={() => removeExercise(exIndex)} hitSlop={12}>
                            <Ionicons name="close-circle" size={22} color={theme.colors.error} />
                          </Pressable>
                        </View>

                        {/* Sets header */}
                        <View style={styles.setHeader}>
                          <Text style={[styles.setLabel, { width: 40 }]}>SET</Text>
                          <Text style={[styles.setLabel, { flex: 1 }]}>WEIGHT (KG)</Text>
                          <Text style={[styles.setLabel, { flex: 1 }]}>REPS</Text>
                          <View style={{ width: 52 }} />
                        </View>

                        {exercise.sets.map((set, setIndex) => (
                          <View key={setIndex} style={styles.setRow}>
                            <View style={styles.setNumberBadge}>
                              <Text style={styles.setNumber}>{setIndex + 1}</Text>
                            </View>
                            <TextInput
                              value={set.weight_kg}
                              onChangeText={(v) => updateSet(exIndex, setIndex, 'weight_kg', v)}
                              style={[
                                styles.setInput,
                                set.weight_kg.trim() !== '' && styles.setInputFilled,
                              ]}
                              keyboardType="decimal-pad"
                              placeholder="0"
                              placeholderTextColor={theme.colors.textTertiary}
                            />
                            <TextInput
                              value={set.reps}
                              onChangeText={(v) => updateSet(exIndex, setIndex, 'reps', v)}
                              style={[
                                styles.setInput,
                                set.reps.trim() !== '' && styles.setInputFilled,
                              ]}
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor={theme.colors.textTertiary}
                            />
                            <View style={{ flexDirection: 'row', gap: 4 }}>
                              <Pressable onPress={() => completeSet(exIndex, setIndex)} hitSlop={8}>
                                <Ionicons
                                  name={set.completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
                                  size={20}
                                  color={set.completed ? '#4ADE80' : theme.colors.textTertiary}
                                />
                              </Pressable>
                              <Pressable onPress={() => removeSet(exIndex, setIndex)} hitSlop={8}>
                                <Ionicons name="remove-circle-outline" size={20} color={theme.colors.textTertiary} />
                              </Pressable>
                            </View>
                          </View>
                        ))}

                        <Pressable onPress={() => addSet(exIndex)} style={styles.addSetBtn} hitSlop={8}>
                          <Ionicons name="add-circle-outline" size={18} color={theme.colors.accent} />
                          <Text style={styles.addSetText}>Add Set</Text>
                        </Pressable>
                      </View>
                    </Animated.View>
                  );
                })}

                {/* Gradient Add Exercise Button */}
                <Pressable onPress={() => setShowExercisePicker(true)} style={{ marginTop: 4, marginBottom: 16 }}>
                  <LinearGradient
                    colors={[theme.colors.accent, theme.colors.accentEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.gradientButtonText}>Add Exercise</Text>
                  </LinearGradient>
                </Pressable>                {/* Post-Workout Photo */}
                <View style={styles.photoSection}>
                  <Text style={styles.sectionTitle}>POST-WORKOUT PHOTO</Text>
                  {workoutImage ? (
                    <View style={styles.imagePreview}>
                      <Image source={{ uri: workoutImage }} style={styles.previewImage} />
                      <Pressable
                        onPress={() => setWorkoutImage(null)}
                        style={styles.removeImage}
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle" size={28} color={theme.colors.error} />
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.photoButtonsInner}>
                      <Pressable onPress={takePhoto} style={styles.photoBtn} hitSlop={8}>
                        <Ionicons name="camera" size={28} color={theme.colors.accent} />
                        <Text style={styles.photoBtnText}>Camera</Text>
                      </Pressable>
                      <View style={styles.photoDivider} />
                      <Pressable onPress={pickImage} style={styles.photoBtn} hitSlop={8}>
                        <Ionicons name="image" size={28} color={theme.colors.accentCyan} />
                        <Text style={styles.photoBtnText}>Gallery</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {exercises.length > 0 && (
                  <Pressable onPress={handleLog} disabled={loading}>
                    <LinearGradient
                      colors={[theme.colors.accentGreen, '#00B880']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.gradientButton, { marginBottom: 8 }]}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.gradientButtonText}>
                        {loading ? 'Logging...' : 'Log Workout'}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                )}
              </View>
            )}
          </Animated.View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Rest Timer */}
      <RestTimer
        visible={restTimerVisible}
        durationSeconds={restTimerDuration}
        onDismiss={() => setRestTimerVisible(false)}
        onComplete={() => setRestTimerVisible(false)}
      />

      {/* Exercise Picker Modal */}
      <Modal visible={showExercisePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal handle bar */}
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <GlowingIcon icon="barbell" color={theme.colors.accent} size={18} bgSize={36} />
                <Text style={styles.modalTitle}>SELECT EXERCISE</Text>
              </View>
              <Pressable
                onPress={() => setShowExercisePicker(false)}
                hitSlop={12}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search exercises..."
                placeholderTextColor={theme.colors.textTertiary}
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
                </Pressable>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.muscleFilter}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              <Pressable
                onPress={() => setSelectedMuscle(null)}
                style={[styles.muscleFilterBtn, !selectedMuscle && styles.muscleFilterActive]}
                hitSlop={4}
              >
                <Ionicons name="grid-outline" size={14} color={!selectedMuscle ? '#fff' : theme.colors.textSecondary} />
                <Text style={[styles.muscleFilterText, !selectedMuscle && styles.muscleFilterTextActive]}>All</Text>
              </Pressable>
              {muscleGroups.map(mg => {
                const mgIcon = getMuscleIcon(mg);
                const isActive = selectedMuscle === mg;
                return (
                  <Pressable
                    key={mg}
                    onPress={() => setSelectedMuscle(mg === selectedMuscle ? null : mg)}
                    style={[
                      styles.muscleFilterBtn,
                      isActive && { backgroundColor: mgIcon.color + '30', borderColor: mgIcon.color + '60' },
                    ]}
                    hitSlop={4}
                  >
                    <Ionicons name={mgIcon.icon as any} size={14} color={isActive ? mgIcon.color : theme.colors.textSecondary} />
                    <Text style={[
                      styles.muscleFilterText,
                      isActive && { color: mgIcon.color },
                    ]}>{mg}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <FlatList
              data={filteredExercises}
              keyExtractor={(item, i) => `${item.name}_${i}`}
              style={{ flex: 1 }}
              renderItem={({ item }) => {
                const itemIcon = getMuscleIcon(item.muscle_group);
                return (
                  <Pressable onPress={() => addExercise(item)} style={styles.exerciseListItem} hitSlop={4}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={[styles.listItemIcon, { backgroundColor: itemIcon.color + '15' }]}>
                        <Ionicons name={itemIcon.icon as any} size={16} color={itemIcon.color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.exerciseListName}>{item.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          <View style={[styles.listMetaChip, { backgroundColor: itemIcon.color + '12' }]}>
                            <Text style={[styles.exerciseListMeta, { color: itemIcon.color }]}>{item.muscle_group}</Text>
                          </View>
                          <Text style={styles.exerciseListEquipment}>Â· {item.equipment}</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="add-circle" size={24} color={theme.colors.accent} />
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: 60,
  },

  /* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },

  /* â”€â”€ Mode Toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modeBtnActive: {},
  modeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    width: '100%',
  },
  modeText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontSize: theme.fontSize.sm,
  },
  modeTextActive: {
    color: '#fff',
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.sm,
  },

  /* â”€â”€ Exercise Card (glass + colored left border) â”€â”€ */
  exerciseCard: {
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent,
    padding: 16,
    marginBottom: 14,
  },
  exerciseCardComplete: {
    borderColor: theme.colors.accentGreen + '40',
    shadowColor: theme.colors.accentGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.glassHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseName: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
  },
  muscleChip: {
    alignSelf: 'flex-start',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  muscleChipText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 0.4,
  },

  /* â”€â”€ Sets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  setLabel: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  setNumberBadge: {
    width: 32,
    height: 28,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  setNumber: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    textAlign: 'center',
  },
  setInput: {
    flex: 1,
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  setInputFilled: {
    borderColor: theme.colors.accent + '50',
    backgroundColor: theme.colors.borderAccent,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  addSetText: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: theme.fontWeight.semibold,
  },

  /* ── Superset ─────────────────────────────────── */
  supersetBracket: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 2, paddingHorizontal: 8,
  },
  supersetLine: { flex: 1, height: 1, backgroundColor: '#00E5FF30' },
  supersetChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999,
    backgroundColor: '#00E5FF15', borderWidth: 1, borderColor: '#00E5FF30',
    marginHorizontal: 8,
  },
  supersetChipText: { color: '#00E5FF', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  supersetBtn: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', marginRight: 8,
  },

  /* â”€â”€ Gradient Button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
  },
  gradientButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.4,
  },

  /* â”€â”€ Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    height: '85%',
    paddingTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.glassHighlight,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.8,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
  },
  muscleFilter: {
    maxHeight: 42,
    marginBottom: 10,
  },
  muscleFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  muscleFilterActive: {
    backgroundColor: theme.colors.accent + '25',
    borderColor: theme.colors.accent + '50',
  },
  muscleFilterText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.medium,
  },
  muscleFilterTextActive: {
    color: '#fff',
    fontWeight: theme.fontWeight.semibold,
  },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glassBorder,
  },
  listItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listMetaChip: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  exerciseListName: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: theme.fontWeight.semibold,
  },
  exerciseListMeta: {
    fontSize: 11,
    fontWeight: theme.fontWeight.medium,
  },
  exerciseListEquipment: {
    color: theme.colors.textTertiary,
    fontSize: 11,
  },
  /* â”€â”€ Photo Section â”€â”€ */
  photoSection: { marginBottom: 20 },
  photoButtonsInner: {
    flexDirection: 'row',
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderStyle: 'dashed',
  },
  photoBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoDivider: { width: 1, height: 30, backgroundColor: theme.colors.glassBorder },
  photoBtnText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600' },
  imagePreview: { position: 'relative', borderRadius: 16, overflow: 'hidden' },
  previewImage: { width: '100%', height: 200, borderRadius: 16 },
  removeImage: { position: 'absolute', top: 10, right: 10 },
});

