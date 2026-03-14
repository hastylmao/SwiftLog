import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import Input from '../../components/ui/Input';
import AnimatedButton from '../../components/ui/AnimatedButton';
import AnimatedBackground from '../../components/ui/AnimatedBackground';

export default function AISettingsScreen({ navigation }: any) {
  const { settings, saveSettings } = useApp();
  const [apiKey, setApiKey] = useState(settings?.gemini_api_key || '');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const usingPersonalKey = useMemo(() => !!settings?.gemini_api_key, [settings?.gemini_api_key]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings({ gemini_api_key: apiKey.trim() || undefined });
      Toast.show({
        type: 'success',
        text1: apiKey.trim() ? 'Personal key saved' : 'Using shared app key',
        text2: apiKey.trim() ? 'Your own Gemini key will power AI calls.' : 'The app will use the built-in shared key again.',
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>AI Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons name={usingPersonalKey ? 'key' : 'flash'} size={18} color={usingPersonalKey ? theme.colors.accentOrange : theme.colors.accentGreen} />
            <Text style={styles.statusTitle}>{usingPersonalKey ? 'Personal Gemini key active' : 'Shared app AI key active'}</Text>
          </View>
          <Text style={styles.statusText}>
            {usingPersonalKey
              ? 'You are bypassing the shared key and using your own Gemini quota. This is the path users can choose later to avoid shared limits or future ads.'
              : 'The app is currently using your built-in shared AI key. Users can stay on this or paste their own Gemini key.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Custom API Key</Text>
          <Text style={styles.helperText}>Paste a Gemini API key here if you want the AI chat, food analysis, and workout parsing to run on your own quota.</Text>
          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <Input
                label="Gemini API Key"
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="AIzaSy..."
                secureTextEntry={!showKey}
                autoCapitalize="none"
              />
            </View>
            <Pressable style={styles.eyeButton} onPress={() => setShowKey((value) => !value)}>
              <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={18} color={theme.colors.accent} />
            <Text style={styles.noteText}>Leave this empty to use the shared app key. Save an empty field to switch back.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current AI Features</Text>
          <FeatureRow icon="sparkles-outline" label="Chat coach with your full gym/nutrition context" />
          <FeatureRow icon="restaurant-outline" label="Food recognition and macro estimation" />
          <FeatureRow icon="barbell-outline" label="Natural language workout parsing" />
          <FeatureRow icon="flash-outline" label="Daily insights on home and log screens" />
        </View>

        <AnimatedButton
          title="Save AI Settings"
          onPress={handleSave}
          loading={saving}
          fullWidth
          size="lg"
          style={{ marginTop: 8, marginBottom: 80 }}
          icon={<Ionicons name="save-outline" size={18} color="#fff" />}
        />
      </ScrollView>
    </View>
  );
}

function FeatureRow({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name={icon} size={18} color={theme.colors.accent} />
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerButton: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSpacer: { width: 42 },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 18, marginBottom: 16,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  statusTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statusText: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 18, marginBottom: 16,
  },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  helperText: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eyeButton: {
    width: 42, height: 42, borderRadius: 21, marginTop: 28, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  noteBox: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 16, backgroundColor: 'rgba(0,229,255,0.08)', marginTop: 4 },
  noteText: { flex: 1, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 },
  featureRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8 },
  featureText: { color: '#fff', fontSize: 14, flex: 1 },
});
