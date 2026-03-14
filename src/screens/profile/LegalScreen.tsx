import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import AnimatedBackground from '../../components/ui/AnimatedBackground';

const PRIVACY_POLICY = `Last updated: ${new Date().toISOString().split('T')[0]}

Swift Logger ("we", "us", or "our") operates the Swift Logger mobile application. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our app.

1. Information We Collect
• Account information: email address and password (managed by Firebase Authentication).
• Profile data: username, age, height, weight, gender, and fitness goals you provide during onboarding.
• Fitness logs: food, workouts, water, weight, sleep, supplements, cardio, and step data you enter.
• Photos: progress photos you upload voluntarily.
• Usage data: crash reports and anonymous analytics collected by Firebase.

2. How We Use Your Information
• To provide and maintain the app's core features (logging, tracking, AI analysis).
• To generate AI-powered nutrition and fitness insights via the Google Gemini API. Food descriptions and queries are sent to the Gemini API for processing but are not stored by us beyond the session.
• To display social features (leaderboards, user profiles) if you opt in.

3. Data Storage & Security
• All data is stored in Google Firebase (Firestore, Authentication, Cloud Storage) with industry-standard encryption in transit and at rest.
• We do not sell, trade, or rent your personal information to third parties.

4. Third-Party Services
• Firebase (Google): authentication, database, storage, analytics.
• Google Gemini API: AI-powered food and fitness analysis.
• Open Food Facts: barcode product lookups (public API, no personal data sent).

5. Data Retention & Deletion
• Your data is retained as long as your account is active.
• You can delete your account at any time from Security settings. This permanently removes all your data from our servers.

6. Children's Privacy
• This app is not intended for children under 13. We do not knowingly collect data from children under 13.

7. Changes to This Policy
• We may update this policy from time to time. We will notify you of changes by posting the new policy in the app.

8. Contact Us
• If you have questions about this privacy policy, contact us through the app's support channels.`;

const TERMS_OF_SERVICE = `Last updated: ${new Date().toISOString().split('T')[0]}

Please read these Terms of Service ("Terms") carefully before using Swift Logger.

1. Acceptance of Terms
By creating an account or using Swift Logger, you agree to be bound by these Terms. If you do not agree, do not use the app.

2. Description of Service
Swift Logger is a fitness tracking application that allows you to log workouts, nutrition, water intake, sleep, and other health metrics. The app provides AI-powered analysis and suggestions.

3. User Accounts
• You are responsible for maintaining the confidentiality of your account credentials.
• You must provide accurate information when creating your account.
• You must be at least 13 years old to use the service.

4. Acceptable Use
You agree not to:
• Use the app for any unlawful purpose.
• Attempt to gain unauthorized access to other users' data.
• Upload harmful, offensive, or inappropriate content.
• Reverse-engineer, decompile, or disassemble the app.

5. Health Disclaimer
• Swift Logger is a fitness tracking tool, NOT a medical device.
• The app does not provide medical advice, diagnosis, or treatment.
• AI-generated nutrition and fitness suggestions are for informational purposes only.
• Always consult a qualified healthcare professional before starting any diet or exercise program.
• We are not liable for any health outcomes resulting from use of the app.

6. Intellectual Property
All content, features, and functionality of Swift Logger are owned by us and are protected by copyright and other intellectual property laws.

7. Limitation of Liability
To the fullest extent permitted by law, Swift Logger and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the app.

8. Termination
We reserve the right to suspend or terminate your account if you violate these Terms.

9. Changes to Terms
We reserve the right to modify these Terms at any time. Continued use of the app after changes constitutes acceptance of the new Terms.

10. Governing Law
These Terms shall be governed by and construed in accordance with the laws of India.`;

export default function LegalScreen({ route, navigation }: any) {
  const type: 'privacy' | 'terms' = route?.params?.type || 'privacy';
  const title = type === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
  const content = type === 'privacy' ? PRIVACY_POLICY : TERMS_OF_SERVICE;

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.card}>
          <Text style={styles.body}>{content}</Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingTop: 56 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
  },
  headerButton: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSpacer: { width: 42 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', padding: 18,
  },
  body: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 22 },
});
