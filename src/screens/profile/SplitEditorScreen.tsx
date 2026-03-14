import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import AnimatedButton from '../../components/ui/AnimatedButton';
import { SPLIT_PRESETS, MUSCLE_GROUPS } from '../../constants/splits';

export default function SplitEditorScreen({ navigation }: any) {
  const { activeSplit, splitDays, saveSplit } = useApp();
  const [isCustom, setIsCustom] = useState(activeSplit?.type === 'custom');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customDays, setCustomDays] = useState([{ day_name: '', muscle_groups: [] as string[] }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeSplit?.type === 'custom' && splitDays.length > 0) {
      setIsCustom(true);
      setCustomDays(splitDays.map((day) => ({ day_name: day.day_name, muscle_groups: day.muscle_groups })));
      return;
    }

    if (activeSplit?.type === 'preset') {
      const match = SPLIT_PRESETS.findIndex((preset) => preset.name === activeSplit.name);
      setSelectedPreset(match >= 0 ? match : null);
      setIsCustom(false);
    }
  }, [activeSplit, splitDays]);

  const selectedPreview = useMemo(() => {
    if (isCustom) {
      return customDays.filter((day) => day.day_name && day.muscle_groups.length > 0);
    }
    if (selectedPreset === null) return [];
    return SPLIT_PRESETS[selectedPreset].days;
  }, [customDays, isCustom, selectedPreset]);

  const updateCustomDay = (index: number, field: 'day_name' | 'muscle_groups', value: any) => {
    setCustomDays((prev) => prev.map((day, dayIndex) => dayIndex === index ? { ...day, [field]: value } : day));
  };

  const toggleMuscle = (dayIndex: number, muscle: string) => {
    const current = customDays[dayIndex]?.muscle_groups || [];
    const next = current.includes(muscle)
      ? current.filter((item) => item !== muscle)
      : [...current, muscle];
    updateCustomDay(dayIndex, 'muscle_groups', next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isCustom) {
        const validDays = customDays.filter((day) => day.day_name.trim() && day.muscle_groups.length > 0);
        if (validDays.length === 0) {
          Toast.show({ type: 'error', text1: 'No valid split', text2: 'Add at least one day with a name and muscle group.' });
          setSaving(false);
          return;
        }

        await saveSplit(
          { name: 'Custom Split', type: 'custom', is_active: true },
          validDays.map((day, index) => ({ ...day, day_number: index }))
        );
      } else {
        if (selectedPreset === null) {
          Toast.show({ type: 'error', text1: 'No split selected', text2: 'Pick a preset or switch to custom.' });
          setSaving(false);
          return;
        }

        const preset = SPLIT_PRESETS[selectedPreset];
        await saveSplit(
          { name: preset.name, type: 'preset', is_active: true },
          preset.days.map((day, index) => ({ ...day, day_number: index }))
        );
      }

      Toast.show({ type: 'success', text1: 'Split updated', text2: 'Your training split has been saved.' });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Training Split</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.toggleRow}>
          <Pressable style={[styles.toggleButton, !isCustom && styles.toggleButtonActive]} onPress={() => setIsCustom(false)}>
            <Text style={[styles.toggleText, !isCustom && styles.toggleTextActive]}>Presets</Text>
          </Pressable>
          <Pressable style={[styles.toggleButton, isCustom && styles.toggleButtonActive]} onPress={() => setIsCustom(true)}>
            <Text style={[styles.toggleText, isCustom && styles.toggleTextActive]}>Custom</Text>
          </Pressable>
        </View>

        {!isCustom ? (
          <View style={styles.stack}>
            {SPLIT_PRESETS.map((preset, index) => {
              const active = selectedPreset === index;
              return (
                <Pressable key={preset.name} style={[styles.card, active && styles.cardActive]} onPress={() => setSelectedPreset(index)}>
                  <View style={styles.presetHeader}>
                    <Text style={styles.cardTitle}>{preset.name}</Text>
                    {active ? <Ionicons name="checkmark-circle" size={20} color={theme.colors.accent} /> : null}
                  </View>
                  <Text style={styles.cardText}>{preset.description}</Text>
                  <View style={styles.chipRow}>
                    {preset.days.map((day, dayIndex) => (
                      <View key={`${preset.name}_${dayIndex}`} style={styles.chip}>
                        <Text style={styles.chipText}>{day.day_name}</Text>
                      </View>
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.stack}>
            {customDays.map((day, index) => (
              <View key={`custom_${index}`} style={styles.card}>
                <View style={styles.customHeader}>
                  <Text style={styles.dayBadge}>Day {index + 1}</Text>
                  {customDays.length > 1 ? (
                    <Pressable onPress={() => setCustomDays((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}>
                      <Ionicons name="close-circle" size={22} color={theme.colors.error} />
                    </Pressable>
                  ) : null}
                </View>
                <TextInput
                  value={day.day_name}
                  onChangeText={(value) => updateCustomDay(index, 'day_name', value)}
                  placeholder="Push day"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={styles.textInput}
                />
                <View style={styles.muscleWrap}>
                  {MUSCLE_GROUPS.map((muscle) => {
                    const selected = day.muscle_groups.includes(muscle);
                    return (
                      <Pressable key={muscle} style={[styles.muscleChip, selected && styles.muscleChipActive]} onPress={() => toggleMuscle(index, muscle)}>
                        <Text style={[styles.muscleChipText, selected && styles.muscleChipTextActive]}>{muscle}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
            <AnimatedButton
              title="Add Day"
              onPress={() => setCustomDays((prev) => [...prev, { day_name: '', muscle_groups: [] }])}
              variant="outline"
              size="sm"
              icon={<Ionicons name="add" size={16} color={theme.colors.accent} />}
              style={{ alignSelf: 'center', marginTop: 6 }}
            />
          </View>
        )}

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Preview</Text>
          <Text style={styles.previewText}>
            {selectedPreview.length > 0
              ? selectedPreview.map((day) => `${day.day_name}: ${day.muscle_groups.join(', ')}`).join(' · ')
              : 'Select a preset or build a custom split.'}
          </Text>
        </View>

        <AnimatedButton
          title="Save Split"
          onPress={handleSave}
          loading={saving}
          fullWidth
          size="lg"
          style={{ marginTop: 12, marginBottom: 80 }}
          icon={<Ionicons name="checkmark-circle" size={18} color="#fff" />}
        />
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
    padding: 20,
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 42,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(0,229,255,0.16)',
  },
  toggleText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#fff',
  },
  stack: {
    gap: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
  },
  cardActive: {
    borderColor: 'rgba(0,229,255,0.35)',
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  cardText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayBadge: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  muscleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  muscleChipActive: {
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderColor: 'rgba(59,130,246,0.4)',
  },
  muscleChipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  muscleChipTextActive: {
    color: '#fff',
  },
  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    marginTop: 16,
  },
  previewTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  previewText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
});
