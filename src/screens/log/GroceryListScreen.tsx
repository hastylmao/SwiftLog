import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Share,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import { useApp } from '../../store/AppContext';
import { generateGroceryList } from '../../services/gemini';
import { auth } from '../../services/firebase';
import { GroceryList, GroceryCategory } from '../../types';

const G = {
  bg: '#020408',
  surface: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#00E5FF',
  green: '#4ADE80',
  text: '#FFFFFF',
  sub: 'rgba(255,255,255,0.60)',
  mute: 'rgba(255,255,255,0.35)',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Proteins': '#4ADE80',
  'Dairy & Eggs': '#FACC15',
  'Vegetables': '#22D3EE',
  'Fruits': '#F472B6',
  'Grains & Carbs': '#F59E0B',
  'Fats & Oils': '#A78BFA',
  'Supplements': '#00E5FF',
  'Snacks': '#FB923C',
};

function categoryColor(cat: string) {
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (cat.toLowerCase().includes(key.toLowerCase().split(' ')[0])) return color;
  }
  return G.accent;
}

export default function GroceryListScreen({ navigation }: any) {
  const { settings, todayFoodLogs, todayWaterLogs, todayWorkoutLogs, weightLogs, activeSplit, splitDays, achievements, todaySupplementLogs, todayStepsLogs, todayCardioLogs, todaySleepLogs, user } = useApp();
  const [list, setList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => { generateList(); }, []);

  const generateList = async () => {
    setLoading(true);
    setChecked(new Set());
    try {
      const result = await generateGroceryList(
        {
          user,
          settings,
          todayFoodLogs,
          todayWaterLogs,
          todayWorkoutLogs,
          weightLogs,
          activeSplit,
          splitDays,
          achievements,
          todaySupplementLogs,
          todayStepsLogs,
          todayCardioLogs,
          todaySleepLogs,
        },
        settings?.gemini_api_key || '',
        await auth.currentUser?.getIdToken() || undefined
      );
      setList(result);
    } catch {}
    setLoading(false);
  };

  const toggleItem = (key: string) => {
    const next = new Set(checked);
    if (next.has(key)) next.delete(key); else next.add(key);
    setChecked(next);
  };

  const handleShare = async () => {
    if (!list) return;
    const text = list.categories.map(cat =>
      `${cat.category}:\n${cat.items.map(i => `• ${i}`).join('\n')}`
    ).join('\n\n');
    await Share.share({ message: `My Weekly Grocery List:\n\n${text}` });
  };

  const totalItems = list?.categories.reduce((s, c) => s + c.items.length, 0) || 0;
  const checkedCount = checked.size;

  return (
    <View style={styles.container}>
      <AnimatedBackground />

      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={16}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.title}>Grocery List</Text>
          <Text style={styles.subtitle}>AI-generated for your macro targets</Text>
        </View>
        <Pressable onPress={handleShare} style={styles.shareBtn} hitSlop={8}>
          <Ionicons name="share-outline" size={20} color={G.accent} />
        </Pressable>
      </Animated.View>

      {/* Progress bar */}
      {totalItems > 0 && (
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.progressRow}>
          <Text style={styles.progressText}>{checkedCount}/{totalItems} items collected</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(checkedCount / totalItems) * 100}%` }]} />
          </View>
        </Animated.View>
      )}

      {loading ? (
        <View style={styles.loadingState}>
          <Ionicons name="sparkles" size={32} color={G.accent} />
          <Text style={styles.loadingText}>Building your weekly list...</Text>
          <ActivityIndicator color={G.accent} style={{ marginTop: 12 }} />
        </View>
      ) : !list ? (
        <View style={styles.loadingState}>
          <Ionicons name="list-circle-outline" size={44} color={G.mute} />
          <Text style={styles.loadingText}>Couldn't generate list</Text>
          <Pressable onPress={generateList} style={styles.regenerateBtn}>
            <Ionicons name="refresh" size={16} color={G.accent} />
            <Text style={styles.regenerateBtnText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {list.categories.map((cat, ci) => {
            const color = categoryColor(cat.category);
            return (
              <Animated.View key={ci} entering={FadeInDown.delay(ci * 80).duration(350)} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryDot, { backgroundColor: color }]} />
                  <Text style={[styles.categoryTitle, { color }]}>{cat.category}</Text>
                  <Text style={styles.categoryCount}>{cat.items.length} items</Text>
                </View>
                {cat.items.map((item, ii) => {
                  const key = `${ci}-${ii}`;
                  const done = checked.has(key);
                  return (
                    <Pressable key={key} onPress={() => toggleItem(key)} style={styles.itemRow}>
                      <View style={[styles.checkbox, done && { backgroundColor: color, borderColor: color }]}>
                        {done && <Ionicons name="checkmark" size={12} color="#000" />}
                      </View>
                      <Text style={[styles.itemText, done && styles.itemTextDone]}>{item}</Text>
                    </Pressable>
                  );
                })}
              </Animated.View>
            );
          })}

          <Pressable onPress={generateList} style={styles.regenerateBtn}>
            <Ionicons name="refresh" size={16} color={G.accent} />
            <Text style={styles.regenerateBtnText}>Regenerate List</Text>
          </Pressable>

          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 58, paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: G.border,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle: { color: G.sub, fontSize: 12, marginTop: 2 },
  shareBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,229,255,0.1)',
    borderWidth: 1, borderColor: '#00E5FF30',
    alignItems: 'center', justifyContent: 'center',
  },
  progressRow: { paddingHorizontal: 20, marginBottom: 16 },
  progressText: { color: G.sub, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  track: {
    height: 5, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999, overflow: 'hidden',
  },
  fill: {
    height: '100%', backgroundColor: G.green, borderRadius: 999,
  },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  loadingText: { color: G.sub, fontSize: 15, marginTop: 14, textAlign: 'center' },
  content: { paddingHorizontal: 20 },
  categoryCard: {
    backgroundColor: G.surface, borderRadius: 20, marginBottom: 14,
    borderWidth: 1, borderColor: G.border, overflow: 'hidden',
    paddingBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: G.border,
  },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryTitle: { flex: 1, fontSize: 14, fontWeight: '800' },
  categoryCount: { color: G.mute, fontSize: 11, fontWeight: '600' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 11,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  itemText: { color: '#fff', fontSize: 14, fontWeight: '500', flex: 1 },
  itemTextDone: { color: G.mute, textDecorationLine: 'line-through' },
  regenerateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'center', margin: 20,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999,
    backgroundColor: '#00E5FF12', borderWidth: 1, borderColor: '#00E5FF30',
  },
  regenerateBtnText: { color: G.accent, fontSize: 14, fontWeight: '700' },
});
