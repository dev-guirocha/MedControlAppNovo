import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/Button';
import { PencilLine, CircleCheck } from 'lucide-react-native';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Text } from '@/components/StyledText';

export default function AddMedicationScreen() {
  const router = useRouter();
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);
  
  const handleAddNew = () => router.push('/(modals)/add-medication/form');
  const handleLogAsNeeded = () => router.push('/(modals)/add-medication/logAsNeeded');

  const dynamicStyles = StyleSheet.create({
    title: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: spacing.xl },
    optionTitle: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
    optionDescription: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg, lineHeight: fontSize.md * 1.5 },
    dividerText: { fontSize: fontSize.md, marginHorizontal: spacing.md, color: colors.textSecondary },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={dynamicStyles.title}>O que você gostaria de fazer?</Text>
        
        <View style={styles.optionCard}>
          <View style={styles.iconContainer}><PencilLine size={48} color={colors.primary} /></View>
          <Text style={dynamicStyles.optionTitle}>Cadastrar Remédio de Controle</Text>
          <Text style={dynamicStyles.optionDescription}>Adicione um novo remédio com horários fixos e lembretes.</Text>
          <Button title="Iniciar Cadastro" onPress={handleAddNew} size="large" variant="primary"/>
        </View>
        
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={dynamicStyles.dividerText}>OU</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.secondaryOption}>
          <Button
            title="Registrar Dose Avulsa"
            onPress={handleLogAsNeeded}
            size="medium"
            variant="secondary"
            iconName="CircleCheck"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  optionCard: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: spacing.xl, alignItems: 'center', borderWidth: 2, borderColor: colors.primary },
  iconContainer: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  secondaryOption: { alignItems: 'center' },
});
