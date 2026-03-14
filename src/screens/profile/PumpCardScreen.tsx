import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useApp } from '../../store/AppContext';
import { generateRoast } from '../../services/gemini';

const G = {
  bg: '#020408',
  border: 'rgba(255,255,255,0.08)',
  accent: '#00E5FF',
  purple: '#A855F7',
  green: '#4ADE80',
  amber: '#FACC15',
  text: '#FFFFFF',
  sub: 'rgba(255,255,255,0.60)',
  mute: 'rgba(255,255,255,0.35)',
};

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

export default function PumpCardScreen({ navigation, route }: any) {
  const { session } = useApp();
  const workout = route?.params?.workout;
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [roast, setRoast] = useState<string | null>(null);
  const [roastLoading, setRoastLoading] = useState(false);
  const { settings } = useApp();

  if (!workout) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="barbell-outline" size={48} color={G.mute} />
        <Text style={[styles.sub, { marginTop: 14 }]}>No workout data provided.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtnAlt}>
          <Text style={{ color: G.accent, fontWeight: '700' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const exercises: any[] = workout.exercises || [];
  const totalSets = exercises.reduce((s: number, e: any) => s + (e.sets?.length || 0), 0);
  const totalVolume = exercises.reduce((s: number, e: any) =>
    s + (e.sets || []).reduce((ss: number, set: any) => ss + (set.weight || 0) * (set.reps || 0), 0), 0);
  const bestSet = exercises.flatMap((e: any) =>
    (e.sets || []).map((s: any) => ({ exercise: e.name, weight: s.weight, reps: s.reps }))
  ).sort((a: any, b: any) => b.weight - a.weight)[0];
  const dateStr = workout.started_at
    ? new Date(workout.started_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : 'Today';

  const handleShare = async () => {
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 0.95, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png' });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not share. Try again.');
    }
    setSharing(false);
  };

  const handleRoast = async () => {
    setRoastLoading(true);
    try {
      const result = await generateRoast(
        { totalVolume, totalSets, exercises: exercises.map((e: any) => e.name) },
        settings?.gemini_api_key || '',
      );
      setRoast(result);
    } catch {
      setRoast('You lifted some things. Cool, I guess.');
    }
    setRoastLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={16}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Pump Card</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card (capturable) */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} ref={cardRef as any} collapsable={false}>
          <LinearGradient
            colors={['#00E5FF22', '#A855F722', '#02040800']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.cardGradientBorder}
          >
            <LinearGradient
              colors={['#080C14', '#0A0F1A']}
              style={styles.cardInner}
            >
              {/* Card Header */}
              <LinearGradient
                colors={['#00E5FF', '#A855F7']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.cardTopBar}
              />
              <View style={styles.cardHead}>
                <View>
                  <Text style={styles.cardWorkoutName}>{workout.name || 'Workout'}</Text>
                  <Text style={styles.cardDate}>{dateStr}</Text>
                </View>
                <View style={styles.appBadge}>
                  <Text style={styles.appBadgeText}>SwiftLogger</Text>
                </View>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                {[
                  { label: 'VOLUME', value: `${fmt(totalVolume)} kg`, color: G.accent },
                  { label: 'SETS', value: `${totalSets}`, color: G.green },
                  { label: 'EXERCISES', value: `${exercises.length}`, color: G.purple },
                ].map((s, i) => (
                  <View key={i} style={styles.statBox}>
                    <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Best Set */}
              {bestSet && (
                <View style={styles.bestSetRow}>
                  <Ionicons name="trophy" size={14} color={G.amber} />
                  <Text style={styles.bestSetText}>
                    Best: <Text style={{ color: G.amber }}>{bestSet.exercise}</Text> – {bestSet.weight} kg × {bestSet.reps}
                  </Text>
                </View>
              )}

              {/* Exercise list */}
              <View style={styles.exerciseList}>
                {exercises.slice(0, 5).map((ex: any, i: number) => (
                  <View key={i} style={styles.exRow}>
                    <View style={styles.exDot} />
                    <Text style={styles.exName} numberOfLines={1}>{ex.name}</Text>
                    <Text style={styles.exSets}>{ex.sets?.length || 0} sets</Text>
                  </View>
                ))}
                {exercises.length > 5 && (
                  <Text style={styles.moreText}>+{exercises.length - 5} more exercises</Text>
                )}
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.footerUsername}>@{session?.user?.user_metadata?.username || 'athlete'}</Text>
                <Text style={styles.footerTag}>#SwiftLogger #FitLife</Text>
              </View>
            </LinearGradient>
          </LinearGradient>
        </Animated.View>

        {/* Roast section */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.roastSection}>
          {roast ? (
            <View style={styles.roastBox}>
              <Text style={styles.roastLabel}>AI Roast</Text>
              <Text style={styles.roastText}>"{roast}"</Text>
              <Pressable onPress={handleRoast} style={styles.reRoastBtn}>
                <Ionicons name="flame" size={14} color={G.accent} />
                <Text style={styles.reRoastText}>Roast Again</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={handleRoast} style={styles.roastPromptBtn} disabled={roastLoading}>
              {roastLoading
                ? <ActivityIndicator color={G.accent} size="small" />
                : <>
                    <Ionicons name="flame-outline" size={18} color={G.accent} />
                    <Text style={styles.roastPromptText}>Get AI-Roasted</Text>
                  </>
              }
            </Pressable>
          )}
        </Animated.View>

        {/* Share button */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.actions}>
          <Pressable onPress={handleShare} disabled={sharing} style={styles.shareBtn}>
            <LinearGradient
              colors={['#00E5FF', '#A855F7']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.shareBtnInner}
            >
              {sharing
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="share-social-outline" size={18} color="#000" />
                    <Text style={styles.shareBtnText}>Share Card</Text>
                  </>
              }
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 58, paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: G.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnAlt: { marginTop: 20, padding: 14 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub: { color: G.sub, fontSize: 15 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  cardGradientBorder: { borderRadius: 28, padding: 1.5 },
  cardInner: { borderRadius: 26.5, overflow: 'hidden' },
  cardTopBar: { height: 4 },
  cardHead: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: 20, paddingBottom: 0,
  },
  cardWorkoutName: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  cardDate: { color: G.sub, fontSize: 13, marginTop: 2 },
  appBadge: {
    backgroundColor: '#00E5FF18', borderRadius: 8, borderWidth: 1, borderColor: '#00E5FF30',
    paddingHorizontal: 10, paddingVertical: 5, marginTop: 2,
  },
  appBadgeText: { color: G.accent, fontSize: 11, fontWeight: '800' },
  statsRow: { flexDirection: 'row', margin: 20, marginBottom: 12 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.8 },
  statLabel: { color: G.mute, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginTop: 2 },
  bestSetRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 20, marginBottom: 14,
    backgroundColor: '#FACC1510', borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: '#FACC1520',
  },
  bestSetText: { color: G.sub, fontSize: 13, fontWeight: '600', flex: 1 },
  exerciseList: { paddingHorizontal: 20, paddingBottom: 12 },
  exRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  exDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: G.accent },
  exName: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '600' },
  exSets: { color: G.mute, fontSize: 12 },
  moreText: { color: G.mute, fontSize: 12, paddingTop: 8, textAlign: 'right' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  footerUsername: { color: G.mute, fontSize: 12, fontWeight: '700' },
  footerTag: { color: G.mute, fontSize: 11 },
  roastSection: { marginTop: 20 },
  roastBox: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20,
    borderWidth: 1, borderColor: G.border, padding: 18,
  },
  roastLabel: { color: G.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8 },
  roastText: { color: '#fff', fontSize: 15, fontStyle: 'italic', lineHeight: 22 },
  reRoastBtn: {
    flexDirection: 'row', gap: 6, alignItems: 'center',
    marginTop: 12, alignSelf: 'flex-end',
  },
  reRoastText: { color: G.accent, fontSize: 13, fontWeight: '700' },
  roastPromptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    backgroundColor: 'rgba(0,229,255,0.08)', borderRadius: 16,
    borderWidth: 1, borderColor: '#00E5FF30', padding: 16,
  },
  roastPromptText: { color: G.accent, fontSize: 15, fontWeight: '700' },
  actions: { marginTop: 20 },
  shareBtn: { borderRadius: 16, overflow: 'hidden' },
  shareBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: 16, borderRadius: 16,
  },
  shareBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
});
