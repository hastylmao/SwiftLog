import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import Input from '../../components/ui/Input';
import AnimatedButton from '../../components/ui/AnimatedButton';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import { CALORIE_MODE_LABELS } from '../../constants/splits';
import { CalorieMode } from '../../types';

const MODES: CalorieMode[] = ['heavy_cut', 'light_cut', 'maintain', 'light_bulk', 'heavy_bulk'];

export default function ProfileSettingsScreen({ navigation }: any) {
  const { user, settings, activeSplit, splitDays, updateProfile, saveSettings } = useApp();

  const [username, setUsername] = useState(user?.username || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [height, setHeight] = useState(user?.height_cm ? String(user.height_cm) : '');
  const [startingWeight, setStartingWeight] = useState(user?.starting_weight_kg ? String(user.starting_weight_kg) : '');
  const [currentWeight, setCurrentWeight] = useState(user?.current_weight_kg ? String(user.current_weight_kg) : '');
  const [goalWeight, setGoalWeight] = useState(user?.goal_weight_kg ? String(user.goal_weight_kg) : '');
  const [gender, setGender] = useState<'male' | 'female'>(user?.gender || 'male');
  const [calorieMode, setCalorieMode] = useState<CalorieMode>(settings?.calorie_mode || 'maintain');
  const [maintenanceCalories, setMaintenanceCalories] = useState(settings?.maintenance_calories ? String(settings.maintenance_calories) : '');
  const [targetCalories, setTargetCalories] = useState(settings?.target_calories ? String(settings.target_calories) : '');
  const [targetProtein, setTargetProtein] = useState(settings?.target_protein ? String(settings.target_protein) : '');
  const [targetCarbs, setTargetCarbs] = useState(settings?.target_carbs ? String(settings.target_carbs) : '');
  const [targetFat, setTargetFat] = useState(settings?.target_fat ? String(settings.target_fat) : '');
  const [waterGoal, setWaterGoal] = useState(settings?.water_goal_ml ? String(settings.water_goal_ml) : '');
  const [loading, setLoading] = useState(false);

  const splitSummary = useMemo(() => {
    if (!activeSplit) return 'No active split';
    return `${activeSplit.name} · ${splitDays.length} days`;
  }, [activeSplit, splitDays]);

  const handleSave = async () => {
    if (!username.trim() || !age || !height || !startingWeight || !currentWeight || !goalWeight) {
      Toast.show({ type: 'error', text1: 'Missing fields', text2: 'Fill in all profile values before saving.' });
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        username: username.trim(),
        age: parseInt(age, 10),
        height_cm: parseFloat(height),
        starting_weight_kg: parseFloat(startingWeight),
        current_weight_kg: parseFloat(currentWeight),
        goal_weight_kg: parseFloat(goalWeight),
        gender,
      });

      await saveSettings({
        calorie_mode: calorieMode,
        maintenance_calories: parseInt(maintenanceCalories || '0', 10),
        target_calories: parseInt(targetCalories || '0', 10),
        target_protein: parseInt(targetProtein || '0', 10),
        target_carbs: parseInt(targetCarbs || '0', 10),
        target_fat: parseInt(targetFat || '0', 10),
        water_goal_ml: parseInt(waterGoal || '0', 10),
      });

      Toast.show({ type: 'success', text1: 'Saved', text2: 'Profile and goal settings updated.' });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <Input label="Username" value={username} onChangeText={setUsername} placeholder="Username" autoCapitalize="none" />
            <View style={styles.row}>
              <View style={styles.half}>
                <Input label="Age" value={age} onChangeText={setAge} placeholder="25" keyboardType="numeric" />
              </View>
              <View style={styles.half}>
                <Input label="Height (cm)" value={height} onChangeText={setHeight} placeholder="180" keyboardType="decimal-pad" />
              </View>
            </View>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.segmentRow}>
              {(['male', 'female'] as const).map((option) => {
                const active = gender === option;
                return (
                  <Pressable key={option} style={[styles.segment, active && styles.segmentActive]} onPress={() => setGender(option)}>
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option[0].toUpperCase() + option.slice(1)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Bodyweight Targets</Text>
            <View style={styles.row}>
              <View style={styles.third}><Input label="Start" value={startingWeight} onChangeText={setStartingWeight} placeholder="80" keyboardType="decimal-pad" /></View>
              <View style={styles.third}><Input label="Current" value={currentWeight} onChangeText={setCurrentWeight} placeholder="78" keyboardType="decimal-pad" /></View>
              <View style={styles.third}><Input label="Goal" value={goalWeight} onChangeText={setGoalWeight} placeholder="72" keyboardType="decimal-pad" /></View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Deficit and Nutrition Goals</Text>
              <Text style={styles.sectionHint}>Mode or manual targets</Text>
            </View>
            <Text style={styles.inputLabel}>Calorie Mode</Text>
            <View style={styles.modeWrap}>
              {MODES.map((mode) => {
                const active = calorieMode === mode;
                return (
                  <Pressable key={mode} style={[styles.modeChip, active && styles.modeChipActive]} onPress={() => setCalorieMode(mode)}>
                    <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>{CALORIE_MODE_LABELS[mode]}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.row}>
              <View style={styles.half}><Input label="Maintenance kcal" value={maintenanceCalories} onChangeText={setMaintenanceCalories} placeholder="2500" keyboardType="numeric" /></View>
              <View style={styles.half}><Input label="Target kcal" value={targetCalories} onChangeText={setTargetCalories} placeholder="2100" keyboardType="numeric" /></View>
            </View>
            <View style={styles.row}>
              <View style={styles.third}><Input label="Protein" value={targetProtein} onChangeText={setTargetProtein} placeholder="180" keyboardType="numeric" /></View>
              <View style={styles.third}><Input label="Carbs" value={targetCarbs} onChangeText={setTargetCarbs} placeholder="220" keyboardType="numeric" /></View>
              <View style={styles.third}><Input label="Fat" value={targetFat} onChangeText={setTargetFat} placeholder="65" keyboardType="numeric" /></View>
            </View>
            <Input label="Water Goal (ml)" value={waterGoal} onChangeText={setWaterGoal} placeholder="3500" keyboardType="numeric" />
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Training Split</Text>
              <Pressable onPress={() => navigation.navigate('SplitEditor')}>
                <Text style={styles.linkText}>Edit split</Text>
              </Pressable>
            </View>
            <Text style={styles.splitTitle}>{splitSummary}</Text>
            <Text style={styles.splitSubtext}>
              {splitDays.length > 0 ? splitDays.map((day) => day.day_name).join(' · ') : 'Set up the exact days and muscle groups you want to run.'}
            </Text>
          </View>

          <AnimatedButton
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 8, marginBottom: 80 }}
            icon={<Ionicons name="checkmark-circle" size={18} color="#fff" />}
          />
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
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionHint: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  third: {
    flex: 1,
  },
  inputLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: 'rgba(59,130,246,0.22)',
    borderColor: 'rgba(59,130,246,0.45)',
  },
  segmentText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
  },
  modeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  modeChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  modeChipActive: {
    backgroundColor: 'rgba(0,229,255,0.18)',
    borderColor: 'rgba(0,229,255,0.35)',
  },
  modeChipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  modeChipTextActive: {
    color: '#fff',
  },
  linkText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  splitTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  splitSubtext: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
});
