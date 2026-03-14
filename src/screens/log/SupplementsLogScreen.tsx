import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import Input from '../../components/ui/Input';
import AnimatedButton from '../../components/ui/AnimatedButton';
import AnimatedBackground from '../../components/ui/AnimatedBackground';

export default function SupplementsLogScreen({ navigation }: any) {
  const { supplementPlan, saveSupplementPlan, todaySupplementLogs, logSupplement } = useApp();
  const [stackText, setStackText] = useState(supplementPlan.join('\n'));
  const [saving, setSaving] = useState(false);

  const todaySet = useMemo(() => new Set(todaySupplementLogs.map((item) => item.supplement_name.trim().toLowerCase())), [todaySupplementLogs]);
  const parsedSupplements = useMemo(() => (
    stackText
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
  ), [stackText]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSupplementPlan(parsedSupplements);
      Toast.show({ type: 'success', text1: 'Supplement stack saved', text2: 'These pills will now show as checkboxes on home.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLog = async (supplement: string) => {
    const success = await logSupplement(supplement);
    if (success) {
      Toast.show({ type: 'success', text1: 'Logged', text2: `${supplement} checked for today.` });
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Daily pills and powders</Text>
            <Text style={styles.title}>Supplement Stack</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Build your stack</Text>
          <Text style={styles.helperText}>Add one supplement per line or separate them with commas. Example: multivitamin, creatine, omega 3.</Text>
          <Input
            label="Supplements"
            value={stackText}
            onChangeText={setStackText}
            placeholder="Multivitamin&#10;Creatine&#10;Omega 3"
            multiline
            numberOfLines={6}
            autoCapitalize="words"
          />
          <AnimatedButton
            title="Save My Stack"
            onPress={handleSave}
            loading={saving}
            fullWidth
            size="lg"
            icon={<Ionicons name="save-outline" size={18} color="#fff" />}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>2. Check off today</Text>
            <Text style={styles.countText}>{supplementPlan.length || parsedSupplements.length} items</Text>
          </View>

          {(supplementPlan.length ? supplementPlan : parsedSupplements).length === 0 ? (
            <Text style={styles.helperText}>Save a stack first, then each supplement will become a quick checkbox here and on home.</Text>
          ) : (
            <View style={styles.list}>
              {(supplementPlan.length ? supplementPlan : parsedSupplements).map((supplement) => {
                const taken = todaySet.has(supplement.toLowerCase());
                return (
                  <Pressable
                    key={supplement}
                    style={[styles.item, taken && styles.itemTaken]}
                    onPress={() => !taken && handleLog(supplement)}
                  >
                    <View style={[styles.checkbox, taken && styles.checkboxTaken]}>
                      {taken ? <Ionicons name="checkmark" size={14} color="#000" /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, taken && styles.itemTitleTaken]}>{supplement}</Text>
                      <Text style={styles.itemMeta}>{taken ? 'Logged today' : 'Tap to mark as taken'}</Text>
                    </View>
                    <Ionicons name={taken ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={taken ? theme.colors.accentEmerald : theme.colors.textSecondary} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {todaySupplementLogs.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Today's timestamps</Text>
            <View style={styles.list}>
              {todaySupplementLogs.map((entry) => (
                <View key={entry.id} style={styles.logRow}>
                  <Text style={styles.logTitle}>{entry.supplement_name}</Text>
                  <Text style={styles.logTime}>{new Date(entry.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ height: 100 }} />
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
    gap: 14,
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
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
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  helperText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  countText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemTaken: {
    backgroundColor: 'rgba(16,185,129,0.14)',
    borderColor: 'rgba(16,185,129,0.25)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  checkboxTaken: {
    backgroundColor: theme.colors.accentEmerald,
    borderColor: theme.colors.accentEmerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  itemTitleTaken: {
    color: '#d1fae5',
  },
  itemMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  logTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logTime: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});

