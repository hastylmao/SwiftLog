import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import { HistoryDay, WorkoutExercise, WorkoutSet } from '../../types';

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(value?: string) {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDurationMinutes(sleepAt: string, wakeAt: string) {
  const diff = Math.max(0, new Date(wakeAt).getTime() - new Date(sleepAt).getTime());
  const totalMinutes = Math.round(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function CompleteHistoryScreen({ navigation }: any) {
  const { fetchCompleteHistory } = useApp();
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const data = await fetchCompleteHistory();
    setHistory(data);
    setLoading(false);
  }, [fetchCompleteHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadHistory} tintColor={theme.colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerEyebrow}>Every logged detail</Text>
            <Text style={styles.headerTitle}>Complete History</Text>
          </View>
        </View>

        {history.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="documents-outline" size={32} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptyText}>Once you start logging meals, workouts, water, supplements, and vitals, every day will appear here.</Text>
          </View>
        ) : null}

        {history.map((day) => (
          <View key={day.date} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <View>
                <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                <Text style={styles.dayMeta}>{day.workouts.length} workouts · {day.foods.length} meals · {day.supplements.length} supplements</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <MetricChip label="Calories" value={`${day.totals.calories}`} />
              <MetricChip label="Protein" value={`${day.totals.protein.toFixed(0)}g`} />
              <MetricChip label="Water" value={`${day.totals.water_ml}ml`} />
              <MetricChip label="Steps" value={`${day.totals.steps}`} />
            </View>

            {day.foods.length > 0 && (
              <Section title="Nutrition">
                {day.foods.map((food) => (
                  <Row
                    key={food.id}
                    title={food.food_name}
                    subtitle={`${food.meal_type} · P ${food.protein} / C ${food.carbs} / F ${food.fat}`}
                    meta={`${food.calories} kcal · ${formatTime(food.logged_at)}`}
                  />
                ))}
              </Section>
            )}

            {day.workouts.length > 0 && (
              <Section title="Workouts">
                {day.workouts.map((workout) => (
                  <View key={workout.id} style={styles.blockCard}>
                    <Text style={styles.blockTitle}>{workout.title || 'Workout session'}</Text>
                    <Text style={styles.blockMeta}>{workout.duration_minutes || 0} min · {formatTime(workout.logged_at)}</Text>
                    {(workout.exercises || []).map((exercise: WorkoutExercise) => (
                      <View key={exercise.id} style={styles.exerciseBlock}>
                        <Text style={styles.exerciseTitle}>{exercise.exercise_name}</Text>
                        <Text style={styles.exerciseSets}>
                          {(exercise.sets || [])
                            .map((set: WorkoutSet) => `S${set.set_number}: ${set.weight_kg}kg x ${set.reps}`)
                            .join('  ·  ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </Section>
            )}

            {(day.cardio.length > 0 || day.sleep.length > 0 || day.weights.length > 0 || day.steps.length > 0) && (
              <Section title="Vitals and Recovery">
                {day.cardio.map((entry) => (
                  <Row
                    key={entry.id}
                    title={`Cardio · ${entry.cardio_type}`}
                    subtitle={`${entry.duration_minutes} min · ${entry.calories_burned} kcal`}
                    meta={formatTime(entry.logged_at)}
                  />
                ))}
                {day.sleep.map((entry) => (
                  <Row
                    key={entry.id}
                    title="Sleep"
                    subtitle={`${formatDurationMinutes(entry.sleep_at, entry.wake_at)} · ${formatTime(entry.sleep_at)} to ${formatTime(entry.wake_at)}`}
                    meta={formatTime(entry.logged_at)}
                  />
                ))}
                {day.weights.map((entry) => (
                  <Row
                    key={entry.id}
                    title="Weight"
                    subtitle={`${entry.weight_kg} kg`}
                    meta={formatTime(entry.logged_at)}
                  />
                ))}
                {day.steps.map((entry) => (
                  <Row
                    key={entry.id}
                    title="Steps"
                    subtitle={`${entry.steps.toLocaleString()} steps`}
                    meta={formatTime(entry.logged_at)}
                  />
                ))}
              </Section>
            )}

            {(day.water.length > 0 || day.supplements.length > 0) && (
              <Section title="Hydration and Supplements">
                {day.water.map((entry) => (
                  <Row key={entry.id} title="Water" subtitle={`${entry.amount_ml} ml`} meta={formatTime(entry.logged_at)} />
                ))}
                {day.supplements.map((entry) => (
                  <Row key={entry.id} title={entry.supplement_name} subtitle={entry.dosage || 'Taken'} meta={formatTime(entry.taken_at)} />
                ))}
              </Section>
            )}
          </View>
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricChip}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ title, subtitle, meta }: { title: string; subtitle: string; meta: string }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.rowMeta}>{meta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEyebrow: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },
  dayCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    marginBottom: 16,
  },
  dayHeader: {
    marginBottom: 14,
  },
  dayDate: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  dayMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  metricChip: {
    minWidth: '23%',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  metricValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  rowSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 18,
  },
  rowMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  blockCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  blockTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  blockMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  exerciseBlock: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  exerciseTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  exerciseSets: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
});
