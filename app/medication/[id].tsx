import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { colors, fontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/Button';
import { useMedications } from '@/hooks/medication-store';
import { Package, Trash2, Edit, Plus, User } from 'lucide-react-native';
import Toast from 'react-native-root-toast';
import { Medication } from '@/types/medication';

export default function MedicationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { medications, updateMedication, updateStock, deleteMedication } = useMedications();
  const [loading, setLoading] = useState(false);

  // CORREÇÃO: Adicionado tipo Medication ao parâmetro m
  const medication = medications.find((m: Medication) => m.id === id);

  if (!medication) {
    return (<SafeAreaView style={styles.container}><Text style={styles.errorText}>Medicamento não encontrado</Text></SafeAreaView>);
  }

  const handleTakeDose = async () => {
    setLoading(true);
    const updates: Partial<Medication> = {
      lastTaken: new Date().toISOString(),
    };
    if (medication.stock > 0) {
      updates.stock = medication.stock - 1;
    }
    await updateMedication(medication.id, updates);
    setLoading(false);
    Toast.show('Dose registrada com sucesso!', {
      duration: Toast.durations.SHORT,
      position: Toast.positions.BOTTOM,
      backgroundColor: colors.success,
      textColor: colors.background,
    });
    router.back();
  };

  const handleSkipDose = async () => {
    Toast.show('A dose foi marcada como pulada.', {
      duration: Toast.durations.SHORT,
      position: Toast.positions.BOTTOM,
    });
    router.back();
  };

  const handleAddStock = () => {
    Alert.prompt('Adicionar ao Estoque', 'Quantas unidades você deseja adicionar?',
      [{ text: 'Cancelar', style: 'cancel' }, {
          text: 'Adicionar',
          onPress: async (value) => {
            const amount = parseInt(value || '0');
            if (amount > 0) {
              await updateStock(medication.id, medication.stock + amount);
              Toast.show(`${amount} unidades adicionadas ao estoque.`, {
                backgroundColor: colors.success, textColor: colors.background,
              });
            }
          },
        },
      ], 'plain-text', '', 'numeric'
    );
  };
  
  const handleEdit = () => {
    router.push({ pathname: '/add-medication/form', params: { ...medication } });
  };

  const handleDelete = () => {
    Alert.alert('Excluir Medicamento', 'Tem certeza?',
      [{ text: 'Cancelar', style: 'cancel' }, {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            await deleteMedication(medication.id);
            router.replace('/(tabs)/home');
          },
        },
      ]
    );
  };

  const lowStock = medication.stock <= 5;

  return (
    <>
      <Stack.Screen options={{ title: medication.name }} />
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.medicationName}>{medication.name}</Text>
              <Text style={styles.dosage}>{medication.dosage}</Text>
              {medication.doctor && (<View style={styles.infoRow}><User size={18} color={colors.textSecondary} /><Text style={styles.value}>{medication.doctor}</Text></View>)}
              <View style={styles.infoRow}><Text style={styles.label}>Forma:</Text><Text style={styles.value}>{medication.form}</Text></View>
              <View style={styles.infoRow}><Text style={styles.label}>Frequência:</Text><Text style={styles.value}>{medication.frequency}</Text></View>
              <View style={styles.infoRow}><Text style={styles.label}>Horários:</Text><Text style={styles.value}>{medication.times.join(', ')}</Text></View>
              {medication.instructions && (<View style={styles.instructionsContainer}><Text style={styles.label}>Instruções:</Text><Text style={styles.instructions}>{medication.instructions}</Text></View>)}
            </View>
            <View style={[styles.card, lowStock && styles.warningCard]}>
              <View style={styles.stockHeader}><View style={styles.stockInfo}><Package size={24} color={lowStock ? colors.warning : colors.primary} /><Text style={styles.stockTitle}>Estoque Atual</Text></View><Text style={[styles.stockCount, lowStock && styles.lowStockCount]}>{medication.stock}</Text></View>
              <Button title="Adicionar ao Estoque" onPress={handleAddStock} variant="secondary" icon={<Plus size={18} color={colors.primary} />}/>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Registrar Próxima Dose</Text>
              <View style={styles.doseButtons}><Button title="Tomei" onPress={handleTakeDose} variant="success" size="large" loading={loading} /><Button title="Pulei" onPress={handleSkipDose} variant="secondary" /></View>
            </View>
            <View style={styles.managementButtons}><Button title="Editar" onPress={handleEdit} variant="secondary" icon={<Edit size={18} color={colors.primary} />} style={{flex:1}} /><Button title="Excluir" onPress={handleDelete} variant="danger" icon={<Trash2 size={18} color={colors.background} />} style={{flex:1}} /></View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cardBackground },
  content: { padding: spacing.lg },
  errorText: { fontSize: fontSize.lg, color: colors.danger, textAlign: 'center', marginTop: spacing.xxl },
  card: { backgroundColor: colors.background, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  warningCard: { borderColor: colors.warning, borderWidth: 2 },
  medicationName: { fontSize: fontSize.xxl, fontWeight: 'bold' as const, color: colors.text, marginBottom: spacing.xs },
  dosage: { fontSize: fontSize.xl, color: colors.primary, marginBottom: spacing.lg },
  infoRow: { flexDirection: 'row', alignItems:'center', gap: spacing.sm, marginBottom: spacing.md },
  label: { fontSize: fontSize.md, color: colors.textSecondary, minWidth: 80 },
  value: { fontSize: fontSize.md, color: colors.text, fontWeight: '500' as const, flex: 1 },
  instructionsContainer: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.cardBackground, borderRadius: 8 },
  instructions: { fontSize: fontSize.md, color: colors.text, marginTop: spacing.xs, lineHeight: 22 },
  stockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  stockInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stockTitle: { fontSize: fontSize.lg, fontWeight: '600' as const, color: colors.text },
  stockCount: { fontSize: fontSize.xxl, fontWeight: 'bold' as const, color: colors.primary },
  lowStockCount: { color: colors.warning },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '600' as const, color: colors.text, marginBottom: spacing.md },
  doseButtons: { gap: spacing.md },
  managementButtons: { flexDirection: 'row', gap: spacing.md },
});