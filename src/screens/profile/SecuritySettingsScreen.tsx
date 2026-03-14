import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import Input from '../../components/ui/Input';
import AnimatedButton from '../../components/ui/AnimatedButton';
import AnimatedBackground from '../../components/ui/AnimatedBackground';

export default function SecuritySettingsScreen({ navigation }: any) {
  const { changePassword, deleteAccount, session } = useApp();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!password || password.length < 8) {
      Toast.show({ type: 'error', text1: 'Weak password', text2: 'Use at least 8 characters.' });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords do not match', text2: 'Re-enter the same password in both fields.' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await changePassword(password);
      if (!error) {
        setPassword('');
        setConfirmPassword('');
        navigation.goBack();
      }
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
          <Text style={styles.headerTitle}>Security</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Access</Text>
          <Text style={styles.helperText}>Signed in as {session?.user?.email || 'your account'}. Update the password here so users can manage their own security from the profile tab.</Text>
          <Input label="New Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry />
          <Input label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat password" secureTextEntry />
          <View style={styles.tipBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.accentEmerald} />
            <Text style={styles.tipText}>Use a unique password. This updates the account password.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Security Roadmap</Text>
          <FeatureRow icon="mail-outline" label="Email change flow can be added here later." />
          <FeatureRow icon="notifications-outline" label="Login alerts and device sessions can live in this section too." />
          <FeatureRow icon="shield-outline" label="Two-factor auth can be added when you want stronger account protection." />
        </View>

        <AnimatedButton
          title="Update Password"
          onPress={handleSave}
          loading={saving}
          fullWidth
          size="lg"
          style={{ marginTop: 8 }}
          icon={<Ionicons name="shield-checkmark-outline" size={18} color="#fff" />}
        />

        <View style={[styles.card, { marginTop: 16, borderColor: 'rgba(239,68,68,0.3)' }]}>
          <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
          <Text style={styles.helperText}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </Text>
          <AnimatedButton
            title={deleting ? 'Deleting…' : 'Delete My Account'}
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'This will permanently delete your account and all your data. This cannot be undone. Are you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      setDeleting(true);
                      try {
                        await deleteAccount();
                      } catch (e: any) {
                        Toast.show({ type: 'error', text1: 'Error', text2: e.message || 'Failed to delete account' });
                      } finally {
                        setDeleting(false);
                      }
                    },
                  },
                ],
              );
            }}
            loading={deleting}
            fullWidth
            size="lg"
            style={{ backgroundColor: '#ef4444' }}
            icon={<Ionicons name="trash-outline" size={18} color="#fff" />}
          />
        </View>

        <View style={{ height: 80 }}   icon={<Ionicons name="shield-checkmark-outline" size={18} color="#fff" />}
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
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 18, marginBottom: 16,
  },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  helperText: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  tipBox: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 16, backgroundColor: 'rgba(16,185,129,0.08)' },
  tipText: { flex: 1, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 },
  featureRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8 },
  featureText: { color: '#fff', fontSize: 14, flex: 1 },
});
