import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, FlatList, Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import { ALL_ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, getAchievementById } from '../../constants/achievements';
import { Achievement } from '../../types';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import GlowingIcon from '../../components/ui/GlowingIcon';
import { TIER_CONFIG } from '../../constants/icons';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_W - theme.spacing.lg * 2 - CARD_GAP) / 2;

export default function AchievementsScreen({ navigation, route }: any) {
  const { achievements } = useApp();
  const unlockedIds = new Set(achievements.map(a => a.achievement_id));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Detect if we're in a stack (has goBack) or a tab (top-level)
  const isStack = navigation.canGoBack();

  const filteredAchievements = selectedCategory === 'all'
    ? ALL_ACHIEVEMENTS
    : ALL_ACHIEVEMENTS.filter(a => a.category === selectedCategory);

  const unlockedCount = filteredAchievements.filter(a => unlockedIds.has(a.id)).length;
  const totalCount = filteredAchievements.length;

  const getTier = (tier: string) => TIER_CONFIG[tier] || TIER_CONFIG.bronze;

  const renderCard = ({ item, index }: { item: Achievement; index: number }) => {
    const unlocked = unlockedIds.has(item.id);
    const tierCfg = getTier(item.tier);

    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index, 20) * 40).duration(300)}
        style={[
          styles.card,
          unlocked
            ? {
                borderColor: tierCfg.color + '30',
                backgroundColor: tierCfg.color + '08',
              }
            : {
                borderColor: theme.colors.glassBorder,
              },
        ]}
      >
        {/* Icon area */}
        <View style={[
          styles.iconContainer,
          {
            backgroundColor: unlocked ? tierCfg.color + '15' : theme.colors.glass,
            borderColor: unlocked ? tierCfg.color + '28' : theme.colors.glassBorder,
          },
        ]}>
          <Ionicons
            name={(item.icon || 'trophy') as any}
            size={26}
            color={unlocked ? tierCfg.color : theme.colors.textTertiary}
            style={{ opacity: unlocked ? 1 : 0.4 }}
          />

          {/* Checkmark overlay for unlocked */}
          {unlocked && (
            <View style={[styles.checkOverlay, { backgroundColor: tierCfg.color + '20', borderColor: tierCfg.color + '40' }]}>
              <Ionicons name="checkmark" size={10} color={tierCfg.color} />
            </View>
          )}

          {/* Lock overlay for locked */}
          {!unlocked && (
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed" size={12} color={theme.colors.textTertiary} />
            </View>
          )}
        </View>

        {/* Achievement name */}
        <Text
          style={[
            styles.cardName,
            !unlocked && { color: theme.colors.textTertiary },
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>

        {/* Tier badge */}
        <View style={[styles.tierBadge, { backgroundColor: tierCfg.color + '18', borderColor: tierCfg.color + '30' }]}>
          <Ionicons name={tierCfg.icon as any} size={10} color={unlocked ? tierCfg.color : theme.colors.textTertiary} />
          <Text style={[styles.tierText, { color: unlocked ? tierCfg.color : theme.colors.textTertiary }]}>
            {item.tier}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

        {/* Progress bar for locked achievements with numeric criteria */}
        {!unlocked && item.criteria?.value > 1 && (
          <View style={styles.progressBarOuter}>
            <View
              style={[
                styles.progressBarInner,
                { width: '0%', backgroundColor: tierCfg.color + '60' },
              ]}
            />
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />

      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        {isStack ? (
          <Pressable onPress={() => navigation.goBack()} hitSlop={16} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}

        <View style={styles.headerCenter}>
          <GlowingIcon icon="trophy" size={24} color="#FFD700" />
          <Text style={styles.title}>Achievements</Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{unlockedCount}/{totalCount}</Text>
        </View>
      </Animated.View>

      {/* Overall progress */}
      <Animated.View entering={FadeInUp.delay(100).duration(350)} style={styles.progressSection}>
        <View style={styles.overallBarOuter}>
          <View
            style={[
              styles.overallBarInner,
              { width: totalCount > 0 ? `${(unlockedCount / totalCount) * 100}%` : '0%' },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}% Complete
        </Text>
      </Animated.View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
        contentContainerStyle={styles.categoriesContent}
      >
        <Pressable
          onPress={() => setSelectedCategory('all')}
          style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
        >
          <Ionicons
            name="grid"
            size={14}
            color={selectedCategory === 'all' ? theme.colors.accent : theme.colors.textSecondary}
          />
          <Text style={[styles.categoryText, selectedCategory === 'all' && styles.categoryTextActive]}>All</Text>
        </Pressable>
        {ACHIEVEMENT_CATEGORIES.map(cat => (
          <Pressable
            key={cat.id}
            onPress={() => setSelectedCategory(cat.id)}
            style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
          >
            <Ionicons
              name={cat.icon as any}
              size={14}
              color={selectedCategory === cat.id ? theme.colors.accent : theme.colors.textSecondary}
            />
            <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* 2-column grid */}
      <FlatList
        data={filteredAchievements.slice(0, 100)}
        keyExtractor={a => a.id}
        contentContainerStyle={styles.list}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        renderItem={renderCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginLeft: -36,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
  },
  countBadge: {
    backgroundColor: theme.colors.accent + '20',
    borderColor: theme.colors.accent + '40',
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },

  /* Progress */
  progressSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 12,
  },
  overallBarOuter: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.glass,
    overflow: 'hidden',
  },
  overallBarInner: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
  },
  progressLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    marginTop: 4,
    textAlign: 'right',
  },

  /* Categories */
  categories: {
    maxHeight: 48,
    marginBottom: 8,
  },
  categoriesContent: {
    gap: 8,
    paddingHorizontal: theme.spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  categoryChipActive: {
    borderColor: theme.colors.accent + '60',
    backgroundColor: theme.colors.accent + '15',
  },
  categoryText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  categoryTextActive: {
    color: theme.colors.accent,
  },

  /* List */
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 8,
    paddingBottom: 100,
  },
  row: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },

  /* Card */
  card: {
    flex: 1,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: 14,
    alignItems: 'center',
    overflow: 'hidden',
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 10,
    position: 'relative',
  },
  checkOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 2,
  },
  cardName: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 17,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    marginBottom: 6,
  },
  tierText: {
    fontSize: 9,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  cardDesc: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  progressBarOuter: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.glassBorder,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    borderRadius: 2,
  },
});
