import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@/components/StyledText';
import { colors, spacing } from '@/constants/theme';
import { useAuthStore } from '@/hooks/useAuthStore';
import { getFontSize } from '@/constants/theme';

export default function TermsEn() {
  const { fontScale } = useAuthStore();
  const fs = getFontSize(fontScale);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { fontSize: fs.xl }]}>Terms of Service</Text>
        <Text style={[styles.small, { fontSize: fs.sm }]}>Last updated: September 11, 2025</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>1) Acceptance</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>By using MedControl (“Service”), you agree to these Terms. If you do not agree, please do not use the app.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>2) Eligibility</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>You must have legal capacity to accept these Terms. If using on behalf of someone else (e.g., as a caregiver), you declare you are authorized to do so.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>3) License</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>We grant you a limited, revocable, non‑exclusive license to install and use the app on a device you own, for personal and non‑commercial purposes only.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>4) User content</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>You are responsible for the accuracy and sharing of the information you enter (medications, appointments, anamnesis). You control what you export/share.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>5) Medical notice</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>MedControl is not a medical device nor provides diagnosis or clinical recommendations. Always consult healthcare professionals for medical decisions.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>6) Notifications</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Delivery depends on OS permissions, device policies, connectivity, and other external factors. We do not guarantee timeliness or availability of notifications.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>7) Usage rules</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Do not misuse the Service (e.g., bypass protections, illegal use, reverse engineering beyond legal allowances, or violating third‑party privacy when sharing data).</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>8) Changes to the Service</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>We may change, suspend, or discontinue features at any time. We will strive to preserve continuity of local usage and access to your data on the device.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>9) Liability</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>To the maximum extent permitted by law, we are not liable for indirect, incidental, special, or consequential damages, or for losses resulting from incorrect use, device issues, OS limitations, denied permissions, or inaccuracies in data you entered.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>10) Warranties</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>The app is provided “as is”, without warranties of merchantability, fitness for a particular purpose, availability, or error‑free operation.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>11) Termination</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>We may terminate access if you violate these Terms. You may stop using the app at any time by uninstalling it and deleting local data if desired.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>12) Privacy</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Use of the Service is also governed by our Privacy Policy.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>13) Governing law</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>These Terms are governed by the laws of Brazil (adjust if needed). Venue: your domicile or São Paulo/SP, unless a mandatory legal provision states otherwise.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>14) Contact</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Questions? Email: support@medcontrol.app (example). Avoid sending sensitive data by email.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontWeight: 'bold', marginBottom: spacing.sm },
  sectionTitle: { color: colors.text, fontWeight: '600', marginTop: spacing.md },
  paragraph: { color: colors.textSecondary, lineHeight: 22 },
  small: { color: colors.textSecondary },
});
