import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  ActivityIndicator, ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import { User, LeaderboardEntry } from '../../types';
import AnimatedBackground from '../../components/ui/AnimatedBackground';

const G = {
  accent: '#00E5FF',
  green: '#4ADE80',
  orange: '#EC5B13',
  gold: '#FFD700',
  purple: '#A855F7',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  sub: 'rgba(255,255,255,0.60)',
  mute: 'rgba(255,255,255,0.35)',
  surface: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
};

type Screen = 'search' | 'leaderboard';

export default function SocialScreen({ navigation }: any) {
  const { searchUsers, session, getWeeklyLeaderboard, followUser, unfollowUser, isFollowing } = useApp();
  const [activeScreen, setActiveScreen] = useState<Screen>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  useEffect(() => {
    if (activeScreen === 'leaderboard' && leaderboard.length === 0) loadLeaderboard();
  }, [activeScreen]);

  const loadLeaderboard = async () => {
    setLbLoading(true);
    try { setLeaderboard(await getWeeklyLeaderboard()); } catch {}
    setLbLoading(false);
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true); setSearched(true);
    try {
      const users = await searchUsers(query.trim());
      setResults(users);
    } catch { setResults([]); }
    setSearching(false);
  }, [query, searchUsers, session?.user?.id]);

  return (
    <View style={styles.container}>
      <AnimatedBackground />

      {/* Header */}
      <Animated.View entering={FadeIn.duration(450)} style={styles.header}>
        <Text style={styles.eyebrow}>Community</Text>
        <Text style={styles.title}>Discover athletes</Text>

        {/* Tab switcher */}
        <View style={styles.switchRow}>
          {(['search', 'leaderboard'] as Screen[]).map(s => (
            <Pressable key={s} onPress={() => setActiveScreen(s)} style={[styles.switchTab, activeScreen === s && styles.switchTabActive]}>
              <Ionicons name={s === 'search' ? 'search-outline' : 'trophy-outline'} size={15} color={activeScreen === s ? G.accent : G.sub} />
              <Text style={[styles.switchTabText, activeScreen === s && styles.switchTabTextActive]}>
                {s === 'search' ? 'Search' : 'Leaderboard'}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {activeScreen === 'search' ? (
        <SearchView
          query={query} setQuery={setQuery} searching={searching} searched={searched}
          results={results} handleSearch={handleSearch} navigation={navigation}
          setResults={setResults} setSearched={setSearched}
          currentUserId={session?.user?.id}
          followUser={followUser} unfollowUser={unfollowUser} isFollowing={isFollowing}
        />
      ) : (
        <LeaderboardView entries={leaderboard} loading={lbLoading} navigation={navigation} onRefresh={loadLeaderboard} />
      )}
    </View>
  );
}

// ─── SEARCH VIEW ────────────────────────────────────────────────────────────
function SearchView({ query, setQuery, searching, searched, results, handleSearch, navigation, setResults, setSearched, currentUserId, followUser, unfollowUser, isFollowing }: any) {
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});

  const checkFollow = async (userId: string) => {
    try { const f = await isFollowing(userId); setFollowStates(p => ({ ...p, [userId]: f })); } catch {}
  };

  useEffect(() => {
    results.forEach((u: User) => { if (followStates[u.id] === undefined) checkFollow(u.id); });
  }, [results]);

  const toggleFollow = async (userId: string) => {
    const cur = followStates[userId];
    setFollowStates(p => ({ ...p, [userId]: !cur }));
    try {
      if (cur) await unfollowUser(userId); else await followUser(userId);
    } catch { setFollowStates(p => ({ ...p, [userId]: cur })); }
  };

  return (
    <View style={{ flex: 1 }}>
      <Animated.View entering={FadeInDown.delay(100).duration(320)} style={styles.searchShell}>
        <LinearGradient colors={['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.03)']} style={styles.searchBorder}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={G.accent} />
            <TextInput
              value={query} onChangeText={setQuery}
              placeholder="Search by username..."
              placeholderTextColor={G.mute} style={styles.searchInput}
              onSubmitEditing={handleSearch} returnKeyType="search"
              autoCapitalize="none" selectionColor={G.accent}
            />
            {query.length > 0 && (
              <Pressable onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
                <Ionicons name="close-circle" size={20} color={G.mute} />
              </Pressable>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      <View style={styles.filterRow}>
        <StatPillSm label="Results" value={searched ? `${results.length}` : '--'} />
        <StatPillSm label="Mode" value="Username" />
      </View>

      {searching ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={G.accent} />
          <Text style={styles.emptyText}>Searching...</Text>
        </View>
      ) : searched && results.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={44} color={G.mute} />
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      ) : !searched ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={44} color={G.mute} />
          <Text style={styles.emptyText}>Search for athletes</Text>
          <Text style={styles.emptySubtext}>Use the bar above to find someone by username.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInRight.delay(index * 70).duration(300)}>
              <View style={styles.userCard}>
                <Pressable onPress={() => navigation.navigate('UserProfile', { userId: item.id })} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <LinearGradient colors={[G.accent, '#4A90FF']} style={styles.avatarShell}>
                    <Text style={styles.userAvatarText}>{(item.username || 'U')[0].toUpperCase()}</Text>
                  </LinearGradient>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{(item.username || '').replace(/^\w/, (c: string) => c.toUpperCase())}</Text>
                    <Text style={styles.userMeta}>{item.age}y · {item.height_cm}cm · {item.current_weight_kg}kg</Text>
                  </View>
                </Pressable>
                {item.id !== currentUserId && (
                <Pressable
                  onPress={() => toggleFollow(item.id)}
                  style={[styles.followBtn, followStates[item.id] && styles.followBtnActive]}
                >
                  <Ionicons
                    name={followStates[item.id] ? 'checkmark' : 'person-add-outline'}
                    size={14}
                    color={followStates[item.id] ? G.accent : '#fff'}
                  />
                </Pressable>
                )}
              </View>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

// ─── LEADERBOARD VIEW ────────────────────────────────────────────────────────
const MEDAL: Record<number, { icon: string; color: string }> = {
  1: { icon: 'trophy', color: G.gold },
  2: { icon: 'medal', color: G.silver },
  3: { icon: 'medal', color: G.bronze },
};

function LeaderboardView({ entries, loading, navigation, onRefresh }: any) {
  if (loading) return (
    <View style={styles.emptyState}>
      <ActivityIndicator size="large" color={G.accent} />
      <Text style={styles.emptyText}>Building leaderboard...</Text>
    </View>
  );

  if (!entries.length) return (
    <View style={styles.emptyState}>
      <Ionicons name="trophy-outline" size={44} color={G.mute} />
      <Text style={styles.emptyText}>No data yet</Text>
      <Text style={styles.emptySubtext}>Follow some athletes to see their weekly stats here.</Text>
      <Pressable onPress={onRefresh} style={styles.refreshBtn}>
        <Ionicons name="refresh" size={16} color={G.accent} />
        <Text style={styles.refreshText}>Refresh</Text>
      </Pressable>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.lbContent} showsVerticalScrollIndicator={false}>
      <View style={styles.lbHeaderRow}>
        <Text style={styles.lbWeekLabel}>This Week</Text>
        <Pressable onPress={onRefresh} style={styles.refreshBtnSm}>
          <Ionicons name="refresh-outline" size={15} color={G.sub} />
        </Pressable>
      </View>

      {entries.map((entry: LeaderboardEntry, i: number) => {
        const medal = MEDAL[entry.rank];
        const isTop3 = entry.rank <= 3;
        return (
          <Animated.View key={entry.user.id} entering={FadeInDown.delay(i * 60).duration(320)}>
            <Pressable
              onPress={() => navigation.navigate('UserProfile', { userId: entry.user.id })}
              style={[styles.lbCard, isTop3 && styles.lbCardTop]}
            >
              {isTop3 && (
                <LinearGradient
                  colors={[medal.color + '25', medal.color + '05']}
                  style={StyleSheet.absoluteFillObject}
                />
              )}

              <View style={styles.lbRankWrap}>
                {medal ? (
                  <Ionicons name={medal.icon as any} size={22} color={medal.color} />
                ) : (
                  <Text style={styles.lbRankNum}>#{entry.rank}</Text>
                )}
              </View>

              <LinearGradient colors={[G.accent, '#4A90FF']} style={styles.lbAvatar}>
                <Text style={styles.lbAvatarText}>{(entry.user.username || 'U')[0].toUpperCase()}</Text>
              </LinearGradient>

              <View style={styles.lbInfo}>
                <Text style={styles.lbName}>{(entry.user.username || '').replace(/^\w/, (c: string) => c.toUpperCase())}</Text>
                <View style={styles.lbStats}>
                  <LbStat icon="barbell" val={`${entry.workoutsCompleted}w`} color={G.green} />
                  <LbStat icon="flame" val={`${entry.totalVolume.toLocaleString()}kg`} color={G.orange} />
                  <LbStat icon="nutrition" val={`${Math.round(entry.proteinConsumed)}g P`} color={G.accent} />
                </View>
              </View>

              <Ionicons name="chevron-forward" size={16} color={G.mute} />
            </Pressable>
          </Animated.View>
        );
      })}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

function LbStat({ icon, val, color }: any) {
  return (
    <View style={styles.lbStat}>
      <Ionicons name={icon} size={10} color={color} />
      <Text style={[styles.lbStatText, { color }]}>{val}</Text>
    </View>
  );
}

function StatPillSm({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statPillLabel}>{label}</Text>
      <Text style={styles.statPillValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020408' },
  header: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 14 },
  eyebrow: { color: G.sub, fontSize: 11, fontWeight: '700', letterSpacing: 2.4, textTransform: 'uppercase' },
  title: { fontSize: 30, fontWeight: '800', color: '#fff', marginTop: 6, marginBottom: 14 },
  switchRow: { flexDirection: 'row', gap: 8 },
  switchTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
    borderWidth: 1, borderColor: G.border, backgroundColor: G.surface,
  },
  switchTabActive: { borderColor: '#00E5FF50', backgroundColor: '#00E5FF12' },
  switchTabText: { color: G.sub, fontSize: 13, fontWeight: '600' },
  switchTabTextActive: { color: G.accent },
  searchShell: { paddingHorizontal: 20, marginTop: 8 },
  searchBorder: { borderRadius: 24, padding: 1 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 23,
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: 'rgba(8,10,17,0.92)',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  filterRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 12, marginBottom: 4 },
  statPill: {
    flex: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: G.surface, borderWidth: 1, borderColor: G.border,
  },
  statPillLabel: { color: G.sub, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  statPillValue: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 6 },
  list: { padding: 20, paddingTop: 12 },
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: G.surface, borderRadius: 24, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: G.border,
  },
  avatarShell: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  userMeta: { color: G.sub, fontSize: 12, marginTop: 4 },
  followBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  followBtnActive: { backgroundColor: '#00E5FF15', borderWidth: 1, borderColor: '#00E5FF40' },
  lbContent: { paddingHorizontal: 20, paddingTop: 8 },
  lbHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  lbWeekLabel: { color: '#fff', fontSize: 18, fontWeight: '800' },
  refreshBtnSm: { padding: 6 },
  lbCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: G.surface, borderRadius: 20, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: G.border, overflow: 'hidden',
  },
  lbCardTop: { borderColor: 'rgba(255,215,0,0.2)' },
  lbRankWrap: { width: 32, alignItems: 'center' },
  lbRankNum: { color: G.sub, fontSize: 15, fontWeight: '800' },
  lbAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  lbAvatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  lbInfo: { flex: 1, marginLeft: 12 },
  lbName: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 5 },
  lbStats: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  lbStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  lbStatText: { fontSize: 11, fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 90, paddingHorizontal: 32 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 17, fontWeight: '700', marginTop: 16 },
  emptySubtext: { color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 8, textAlign: 'center' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, backgroundColor: '#00E5FF15', borderWidth: 1, borderColor: '#00E5FF30' },
  refreshText: { color: G.accent, fontSize: 14, fontWeight: '700' },
});
