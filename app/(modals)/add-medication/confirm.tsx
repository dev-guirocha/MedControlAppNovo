import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/Button';
import { useMedicationStore } from '@/hooks/useMedicationStore';
import { Check, X } from 'lucide-react-native';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Text } from '@/components/StyledText';

export default function ConfirmMedicationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addMedication, updateMedication } = useMedicationStore();
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);
  const [loading, setLoading] = useState(false);

  if (!params || !params.name) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const handleConfirm = async () => {
    setLoading(true);
    const medicationData = {
      name: params.name as string,
      dosage: params.dosage as string,
      doctor: params.doctor as string,
      form: params.form as any,
      frequency: params.frequency as any,
      times: Array.isArray(params.times) ? params.times as string[] : [params.times as string],
      stock: parseInt(params.stock as string),
      stockAlertThreshold: parseInt(params.stockAlertThreshold as string),
      instructions: params.instructions as string,
      color: params.color as string,
    };

    if (params.id) {
      await updateMedication(params.id as string, medicationData);
    } else {
      await addMedication(medicationData);
    }

    setLoading(false);
    router.replace('/(tabs)/home');
  };

  const handleCorrect = () => router.back();

  const dynamicStyles = StyleSheet.create({
      title: { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
      subtitle: { fontSize: fontSize.lg, color: colors.textSecondary, marginBottom: spacing.xl },
      fieldLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
      fieldValue: { fontSize: fontSize.lg, color: colors.text, fontWeight: '500' },
  });
  
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg },
    card: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
    field: { paddingVertical: spacing.md },
    divider: { height: 1, backgroundColor: colors.border },
    footer: { flexDirection: 'row', padding: spacing.lg, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md },
    correctButton: { flex: 1 },
    confirmButton: { flex: 2 },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          <Text style={dynamicStyles.title}>Confirme os dados</Text>
          <Text style={dynamicStyles.subtitle}>Revise as informações antes de salvar.</Text>
          <View style={styles.card}>
            <View style={styles.field}><Text style={dynamicStyles.fieldLabel}>Nome</Text><Text style={dynamicStyles.fieldValue}>{params.name}</Text></View><View style={styles.divider} />
            <View style={styles.field}><Text style={dynamicStyles.fieldLabel}>Dosagem</Text><Text style={dynamicStyles.fieldValue}>{params.dosage}</Text></View>
            {params.doctor && (<><View style={styles.divider} /><View style={styles.field}><Text style={dynamicStyles.fieldLabel}>Médico(a)</Text><Text style={dynamicStyles.fieldValue}>{params.doctor}</Text></View></>)}
            <View style={styles.divider} />
            <View style={styles.field}><Text style={dynamicStyles.fieldLabel}>Forma</Text><Text style={dynamicStyles.fieldValue}>{params.form}</Text></View><View style={styles.divider} />
            <View style={styles.field}><Text style={dynamicStyles.fieldLabel}>Frequência</Text><Text style={dynamicStyles.fieldValue}>{params.frequency}</Text></View><View style={styles.divider} />
            <View style={styles.field}><Text style={dynamicStyles.fieldLabel}>Horários</Text><Text style={dynamicStyles.fieldValue}>{Array.isArray(params.times) ? params.times.join(', ') : params.times}</Text></View><View style={styles.divider} />
            <View style={styles.field}><Text style={dynamicStyles.fieldLabel}>Estoque</Text><Text style={dynamicStyles.fieldValue}>{params.stock} unidades</Text></View><View style={styles.divider} />
            <View style={styles.field}><Text style={dynamicStyles.fieldLabel}>Limite para Alerta</Text><Text style={dynamicStyles.fieldValue}>{params.stockAlertThreshold} unidades</Text></View>
            {params.instructions && (<><View style={styles.divider} /><View style={styles.field}><Text style={dynamicStyles.fieldLabel}>Instruções</Text><Text style={dynamicStyles.fieldValue}>{params.instructions}</Text></View></>)}
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button title="Corrigir" onPress={handleCorrect} size="medium" variant="secondary" icon={<X size={20} color={colors.primary} />} style={styles.correctButton}/>
        <Button title="Salvar" onPress={handleConfirm} size="medium" variant="success" loading={loading} icon={<Check size={20} color={colors.background} />} style={styles.confirmButton}/>
      </View>
    </SafeAreaView>
  );
}