import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@/components/StyledText';
import { colors, spacing } from '@/constants/theme';
import { useAuthStore } from '@/hooks/useAuthStore';
import { getFontSize } from '@/constants/theme';

export default function PrivacyEn() {
  const { fontScaleMultiplier } = useAuthStore();
  const fs = getFontSize(fontScaleMultiplier);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { fontSize: fs.xl }]}>Privacy Policy</Text>
        <Text style={[styles.small, { fontSize: fs.sm }]}>Last updated: September 11, 2025</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>1) Who we are</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>MedControl is a personal app to organize medications, appointments, and dose history. It operates locally on your device.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>2) Data we process</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>
          - Profile: name, profile type (patient/caregiver), preferences (theme, font size).{"\n"}
          - Health data entered by you: medication list, dosages, schedules, stock, dose history, anamnesis, and appointments (including attached prescription images).{"\n"}
          - Local identifiers: only internal storage keys and notification scheduling identifiers.
        </Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>3) Storage and location of data</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>All data is stored exclusively on your device (AsyncStorage and local files). We do not collect, transmit, or sell your data to third parties. The app does not depend on our servers to function.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>4) Device permissions</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>
          - Notifications: to alert you about medication times and events.{"\n"}
          - Camera/Gallery: to attach prescription images to appointments.{"\n"}
          You may grant or revoke these permissions at any time in your system settings.
        </Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>5) Purposes of processing</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>We use data to: (i) display and organize your information; (ii) schedule/manage medication reminders; (iii) allow anamnesis export; (iv) enhance local usability (theme, font). We do not use your data for marketing.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>6) Security</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>We strongly recommend enabling device protections (passcode, biometrics, encrypted backup). The app does not upload your data by default. If you choose to share exported PDFs/files, do so with trusted parties/services.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>7) Retention and deletion</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Data remains on your device while the app is installed. You can delete information in the app’s screens, or uninstall the app to remove all local content. This operation is irreversible from the device perspective.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>8) Children</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>The app may be used by guardians to manage data for minors. If you are a guardian, only provide the necessary information and keep your device secured.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>9) Your rights</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Under applicable laws (e.g., GDPR/LGPD equivalents), you may access, correct, delete, and export your data. Since data is only stored locally, you exercise these rights directly in the app screens.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>10) Changes</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>We may update this policy to reflect improvements or legal requirements. We will notify you in-app about relevant changes and update the “Last updated” date.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>11) Contact</Text>
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

