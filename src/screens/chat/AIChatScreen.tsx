import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Crypto from 'expo-crypto';

import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import { chatWithAI, ChatContext } from '../../services/gemini';
import { auth } from '../../services/firebase';
import { ChatMessage } from '../../types';
import AnimatedBackground from '../../components/ui/AnimatedBackground';

export default function AIChatScreen({ navigation }: any) {
  const {
    user,
    settings,
    todayFoodLogs,
    todayWorkoutLogs,
    todayWaterLogs,
    weightLogs,
    activeSplit,
    splitDays,
    achievements,
    todaySupplementLogs,
    todayStepsLogs,
    todayCardioLogs,
    todaySleepLogs,
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `I have your gym, nutrition, cardio, and supplement context loaded${user?.username ? `, ${user.username.replace(/^\w/, (c: string) => c.toUpperCase())}` : ''}. Ask for meal fixes, training decisions, or recovery advice.`,
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const totals = useMemo(() => {
    const calories = todayFoodLogs.reduce((sum, item) => sum + Number(item.calories || 0), 0);
    const water = todayWaterLogs.reduce((sum, item) => sum + Number(item.amount_ml || 0), 0);
    const steps = todayStepsLogs.reduce((sum, item) => sum + Number(item.steps || 0), 0);
    const cardioCalories = todayCardioLogs.reduce((sum, item) => sum + Number(item.calories_burned || 0), 0);
    return { calories, water, steps, cardioCalories };
  }, [todayCardioLogs, todayFoodLogs, todayStepsLogs, todayWaterLogs]);

  const caloriesLeft = Math.max(0, (settings?.target_calories || 2000) - totals.calories);
  const contextCards = [
    { icon: 'flame-outline' as const, label: 'kcal left', value: `${caloriesLeft}`, tint: theme.colors.accentOrange },
    { icon: 'water-outline' as const, label: 'water', value: `${totals.water} ml`, tint: theme.colors.accentCyan },
    { icon: 'footsteps-outline' as const, label: 'steps', value: `${totals.steps}`, tint: theme.colors.accentEmerald },
    { icon: 'barbell-outline' as const, label: 'workouts', value: `${todayWorkoutLogs.length}`, tint: theme.colors.accentPurple },
  ];

  const quickPrompts = [
    'Fix my meals for the rest of today',
    'Build my workout from today\'s split',
    'Check my recovery and sleep',
    'Tell me what supplements to take next',
    'How can I increase calories without dirty bulking?',
    'Review today\'s cardio and steps',
  ];

  const openAISettings = useCallback(() => {
    const parent = navigation.getParent?.();
    if (parent) {
      parent.navigate('Profile', { screen: 'AISettings' });
      return;
    }
    navigation.navigate('AISettings');
  }, [navigation]);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const raw = overrideText ?? inputText;
    if (!raw.trim() || sending) return;

    const text = raw.trim();
    setInputText('');

    const userMsg: ChatMessage = {
      id: Crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setSending(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);

    try {
      const history = nextMessages
        .filter((message) => message.id !== 'welcome')
        .map((message) => ({ role: message.role, parts: [{ text: message.text }] }));

      const chatContext: ChatContext = {
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
      };

      // Get Firebase auth token for shared key usage
      let authToken: string | undefined;
      try {
        if (!settings?.gemini_api_key && auth.currentUser) {
          authToken = await auth.currentUser.getIdToken(true); // force refresh
        }
      } catch (tokenErr) {
        console.warn('[AIChat] Failed to get auth token:', tokenErr);
      }

      const response = await chatWithAI(text, history, chatContext, settings?.gemini_api_key || '', authToken);
      const aiMsg: ChatMessage = {
        id: Crypto.randomUUID(),
        role: 'model',
        text: response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      const errMsg: ChatMessage = {
        id: Crypto.randomUUID(),
        role: 'model',
        text: error?.message?.includes('API key')
          ? error.message
          : 'I hit a problem generating that response. Try again or switch to your personal Gemini key in AI settings.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 180);
    }
  }, [
    achievements,
    activeSplit,
    inputText,
    messages,
    navigation,
    sending,
    settings,
    splitDays,
    todayCardioLogs,
    todayFoodLogs,
    todaySleepLogs,
    todayStepsLogs,
    todaySupplementLogs,
    todayWaterLogs,
    todayWorkoutLogs,
    user,
    weightLogs,
  ]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser ? (
          <LinearGradient colors={[theme.colors.accent, theme.colors.accentEnd]} style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={12} color="#fff" />
          </LinearGradient>
        ) : null}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>{item.text}</Text>
          <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <AnimatedBackground />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)']} style={styles.headerIcon}>
            <Ionicons name="chatbubbles" size={20} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>AI Coach</Text>
            <Text style={styles.headerSubtitle}>Gym, food, supplements, cardio, recovery</Text>
          </View>
        </View>
        <Pressable style={styles.settingsButton} onPress={openAISettings}>
          <Ionicons name="settings-outline" size={20} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        ListHeaderComponent={
          messages.length <= 1 ? (
            <View>
              <View style={styles.compactStatusRow}>
                <View style={[styles.liveDot, { backgroundColor: settings?.gemini_api_key ? theme.colors.accentPurple : theme.colors.accentEmerald }]} />
                <Text style={styles.compactStatusText}>
                  {settings?.gemini_api_key ? 'Personal API Key Active' : 'Shared API Key Active'}
                </Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contextRow}>
                {contextCards.map((card) => (
                  <View key={card.label} style={styles.contextCard}>
                    <Ionicons name={card.icon} size={14} color={card.tint} />
                    <View style={{ marginLeft: 6 }}>
                      <Text style={styles.contextValueCompact}>{card.value}</Text>
                      <Text style={styles.contextLabelCompact}>{card.label}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolsScrollRow}>
                <ToolChip icon="restaurant-outline" label="Meal audit" onPress={() => sendMessage('Audit my meals and tell me what to eat next today.')} />
                <ToolChip icon="barbell-outline" label="Workout build" onPress={() => sendMessage('Build the rest of my workout based on my active split.')} />
                <ToolChip icon="moon-outline" label="Recovery check" onPress={() => sendMessage('Check my sleep, cardio, and recovery status for today.')} />
              </ScrollView>

              <View style={styles.promptBoard}>
                <View style={styles.promptGrid}>
                  {quickPrompts.slice(0, 4).map((prompt) => (
                    <Pressable key={prompt} style={styles.promptCard} onPress={() => sendMessage(prompt)}>
                      <Text style={styles.promptCardText}>{prompt}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ) : <View />
        }
        ListFooterComponent={
          sending ? (
            <View style={styles.messageRow}>
              <LinearGradient colors={[theme.colors.accent, theme.colors.accentEnd]} style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={12} color="#fff" />
              </LinearGradient>
              <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
                <Text style={styles.typingText}>Thinking...</Text>
              </View>
            </View>
          ) : <View style={{ height: 12 }} />
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputWrapOuter}>
        <View style={styles.inputRow}>
          <Pressable style={styles.attachButton} onPress={openAISettings}>
            <Ionicons name="key-outline" size={20} color={theme.colors.textSecondary} />
          </Pressable>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about meals, lifting, recovery, progress..."
            placeholderTextColor={theme.colors.textTertiary}
            style={styles.input}
            multiline
            maxLength={1200}
          />
          <Pressable
            onPress={() => sendMessage()}
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            disabled={!inputText.trim() || sending}
          >
            <LinearGradient
              colors={inputText.trim() && !sending ? [theme.colors.accent, theme.colors.accentEnd] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)']}
              style={styles.sendGradient}
            >
              <Ionicons name="arrow-up" size={18} color={inputText.trim() && !sending ? '#fff' : theme.colors.textTertiary} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function ToolChip({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.toolChip} onPress={onPress}>
      <Ionicons name={icon} size={16} color={theme.colors.accent} />
      <Text style={styles.toolChipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glassBorder,
    backgroundColor: 'rgba(10,10,15,0.85)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    marginBottom: 14,
  },
  compactStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  compactStatusText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroEyebrow: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    lineHeight: 22,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accentGreen,
  },
  liveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contextRow: {
    gap: 8,
    paddingBottom: 6,
    marginBottom: 10,
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minWidth: 100,
  },
  contextValueCompact: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  contextLabelCompact: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  contextValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
  },
  contextLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
    letterSpacing: 1,
  },
  toolsCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 14,
  },
  toolsScrollRow: {
    gap: 8,
    paddingBottom: 6,
    marginBottom: 6,
  },
  toolsHeader: {
    marginBottom: 12,
  },
  toolsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  toolsMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolChip: {
    width: '48.2%',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolChipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  promptBoard: {
    marginBottom: 14,
  },
  promptTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  promptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  promptCard: {
    width: '48.2%',
    minHeight: 88,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    justifyContent: 'space-between',
  },
  promptCardText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 14,
  },
  messageRowUser: {
    flexDirection: 'row-reverse',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: 6,
  },
  userBubble: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderTopRightRadius: 6,
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  messageTime: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    marginTop: 8,
  },
  userMessageTime: {
    textAlign: 'right',
    color: 'rgba(255,255,255,0.55)',
  },
  typingBubble: {
    paddingVertical: 12,
  },
  typingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapOuter: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glassBorder,
    backgroundColor: 'rgba(10,10,15,0.90)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  attachButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    maxHeight: 110,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
