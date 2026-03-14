import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import AnimatedBackground from '../../components/ui/AnimatedBackground';

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut, achievements, activeSplit, splitDays, supplementPlan, settings } = useApp();

  const goalDelta = useMemo(() => {
    if (!user) return 0;
    return Number((user.goal_weight_kg - user.current_weight_kg).toFixed(1));
  }, [user]);

  const goalLabel = goalDelta === 0 ? 'On target' : goalDelta > 0 ? `${goalDelta} kg to gain` : `${Math.abs(goalDelta)} kg to lose`;

  const shortcuts = [
    { icon: 'person-circle-outline' as const, label: 'Edit body', onPress: () => navigation.navigate('ProfileSettings') },
    { icon: 'barbell-outline' as const, label: 'Split', onPress: () => navigation.navigate('SplitEditor') },
    { icon: 'document-text-outline' as const, label: 'History', onPress: () => navigation.navigate('CompleteHistory') },
    { icon: 'sparkles-outline' as const, label: 'AI key', onPress: () => navigation.navigate('AISettings') },
  ];

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Personal Control Center</Text>
            <Text style={styles.title}>Profile</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <LinearGradient colors={['rgba(74,144,255,0.26)', 'rgba(123,97,255,0.12)', 'rgba(8,10,17,0.92)']} style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTop}>
            <View style={styles.avatarWrap}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={['#dbeafe', '#93c5fd']} style={styles.avatarFallback}>
                  <Ionicons name="person" size={42} color="#0f172a" />
                </LinearGradient>
              )}
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroName}>{(user?.username || 'Athlete').replace(/^\w/, (c: string) => c.toUpperCase())}</Text>
              <Text style={styles.heroMeta}>{settings?.calorie_mode?.replace('_', ' ') || 'maintain'} mode · {achievements.length * 100} XP</Text>
              <View style={styles.heroTags}>
                <Tag icon="barbell-outline" text={activeSplit?.name || 'No active split'} />
                <Tag icon="medkit-outline" text={`${supplementPlan.length} supplements`} />
                <Tag icon="shield-checkmark-outline" text={settings?.gemini_api_key ? 'Personal AI key' : 'Shared AI key'} />
              </View>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <HeroMetric label="Current" value={`${user?.current_weight_kg ?? '--'} kg`} />
            <HeroMetric label="Goal" value={`${user?.goal_weight_kg ?? '--'} kg`} />
            <HeroMetric label="Gap" value={goalLabel} />
          </View>
        </LinearGradient>

        <View style={styles.shortcutGrid}>
          {shortcuts.map((item) => (
            <Pressable key={item.label} style={styles.shortcutCard} onPress={item.onPress}>
              <LinearGradient colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)']} style={styles.shortcutIconWrap}>
                <Ionicons name={item.icon} size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.shortcutLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="calendar-outline" label="Split Days" value={`${splitDays.length || 0} planned`} tint="#4ade80" />
          <StatCard icon="trophy-outline" label="Achievements" value={`${achievements.length} unlocked`} tint="#f59e0b" />
          <StatCard icon="water-outline" label="Water Goal" value={`${settings?.water_goal_ml ?? 0} ml`} tint="#22d3ee" />
          <StatCard icon="flame-outline" label="Calories" value={`${settings?.target_calories ?? 0} kcal`} tint="#fb7185" />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account and Targets</Text>
            <Pressable onPress={() => navigation.navigate('CompleteHistory')}>
              <Text style={styles.linkText}>Open history</Text>
            </Pressable>
          </View>
          <SummaryRow label="Protein target" value={`${settings?.target_protein ?? 0} g`} />
          <SummaryRow label="Training split" value={activeSplit?.name || 'Not configured'} />
          <SummaryRow label="Height" value={`${user?.height_cm ?? '--'} cm`} />
          <SummaryRow label="Age" value={`${user?.age ?? '--'} years`} />
        </View>

        <View style={styles.menuCard}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <MenuRow icon="person-circle-outline" label="Edit body, goals, and profile" onPress={() => navigation.navigate('ProfileSettings')} />
          <MenuRow icon="barbell-outline" label="Edit training split" onPress={() => navigation.navigate('SplitEditor')} />
          <MenuRow icon="document-text-outline" label="Complete log history" onPress={() => navigation.navigate('CompleteHistory')} />
          <MenuRow icon="sparkles-outline" label="AI key and AI settings" onPress={() => navigation.navigate('AISettings')} />
          <MenuRow icon="shield-checkmark-outline" label="Security and password" onPress={() => navigation.navigate('SecuritySettings')} />
          <MenuRow icon="medkit-outline" label="Supplement stack manager" onPress={() => navigation.getParent?.()?.navigate('Log', { screen: 'SupplementsLog' })} />
          <MenuRow icon="document-text-outline" label="Privacy Policy" onPress={() => navigation.navigate('Legal', { type: 'privacy' })} />
          <MenuRow icon="reader-outline" label="Terms of Service" onPress={() => navigation.navigate('Legal', { type: 'terms' })} />
          <MenuRow icon="log-out-outline" label="Sign out" onPress={signOut} destructive />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

function Tag({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.heroTag}>
      <Ionicons name={icon} size={14} color={theme.colors.accent} />
      <Text style={styles.heroTagText}>{text}</Text>
    </View>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroMetric}>
      <Text style={styles.heroMetricLabel}>{label}</Text>
      <Text style={styles.heroMetricValue}>{value}</Text>
    </View>
  );
}

function StatCard({ icon, label, value, tint }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tint: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${tint}18` }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function MenuRow({ icon, label, onPress, destructive = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; destructive?: boolean }) {
  return (
    <Pressable style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]} onPress={onPress}>
      <View style={[styles.menuIcon, destructive && styles.menuIconDanger]}>
        <Ionicons name={icon} size={18} color={destructive ? theme.colors.error : '#fff'} />
      </View>
      <Text style={[styles.menuLabel, destructive && { color: theme.colors.error }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  eyebrow: { color: theme.colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2.2, fontWeight: '700' },
  title: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 4 },
  headerSpacer: { width: 46 },
  heroCard: {
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroGlow: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrap: {
    width: 98,
    height: 98,
    borderRadius: 49,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.20)',
    marginRight: 16,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: { flex: 1 },
  heroName: { color: '#fff', fontSize: 28, fontWeight: '800' },
  heroMeta: { color: '#dbeafe', fontSize: 12, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.1 },
  heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.09)' },
  heroTagText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  metricsRow: { flexDirection: 'row', gap: 10 },
  heroMetric: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 14 },
  heroMetricLabel: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  heroMetricValue: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 8 },
  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  shortcutCard: {
    width: '48.5%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 16,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  shortcutIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { width: '48.5%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16 },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  statLabel: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 },
  summaryCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 18, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkText: { color: theme.colors.accent, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  summaryLabel: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '500' },
  summaryValue: { color: '#fff', fontSize: 13, fontWeight: '700' },
  menuCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingTop: 18, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  menuRowPressed: { backgroundColor: 'rgba(255,255,255,0.05)' },
  menuIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  menuIconDanger: { backgroundColor: 'rgba(239,68,68,0.12)' },
  menuLabel: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600' },
});
