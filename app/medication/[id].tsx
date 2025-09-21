import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/Button';
import { useMedicationStore } from '@/hooks/useMedicationStore';
import { useDoseSchedule } from '@/hooks/medication-store';
import { Package, Trash2, User, Pill } from 'lucide-react-native';
import Toast from 'react-native-root-toast';
import { Medication } from '@/types/medication';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Text } from '@/components/StyledText';

export default function MedicationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { medications, updateMedication, deleteMedication, logDose } = useMedicationStore();
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);
  const [loading, setLoading] = useState(false);
  const scheduleForToday = useDoseSchedule();
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [stockAmount, setStockAmount] = useState('');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  const medication = medications.find((m: Medication) => m.id === id);

  const nextScheduledDose = useMemo(() => {
    if (!medication) return null;
    return scheduleForToday.find((dose) => dose.id === medication.id) ?? null;
  }, [scheduleForToday, medication]);

  const fallbackScheduledDate = useMemo(() => {
    if (!medication) return null;
    return getClosestScheduledDate(medication);
  }, [medication]);

  const getScheduledDateForLog = useCallback(() => {
    if (nextScheduledDose?.scheduledDateTime) {
      return new Date(nextScheduledDose.scheduledDateTime);
    }
    if (fallbackScheduledDate) {
      return new Date(fallbackScheduledDate);
    }
    return new Date();
  }, [nextScheduledDose, fallbackScheduledDate]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg },
    errorText: { fontSize: fontSize.lg, color: colors.danger, textAlign: 'center', marginTop: spacing.xxl },
    card: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
    warningCard: { borderColor: colors.warning, borderWidth: 2 },
    medicationName: { fontWeight: 'bold' as const, color: colors.text, marginBottom: spacing.xs },
    dosage: { color: colors.primary, marginBottom: spacing.lg },
    infoRow: { flexDirection: 'row', alignItems:'center', gap: spacing.sm, marginBottom: spacing.md },
    label: { color: colors.textSecondary, minWidth: 80 },
    value: { color: colors.text, fontWeight: '500' as const, flex: 1 },
    instructionsContainer: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.background, borderRadius: 8 },
    instructions: { color: colors.text, marginTop: spacing.xs, lineHeight: 22 },
    stockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    stockInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    stockTitle: { fontWeight: '600' as const, color: colors.text },
    stockCount: { fontWeight: 'bold' as const, color: colors.primary },
    lowStockCount: { color: colors.warning },
    cardTitle: { fontWeight: '600' as const, color: colors.text, marginBottom: spacing.md },
    doseButtons: { gap: spacing.md },
    managementButtons: { flexDirection: 'row', gap: spacing.md },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalBackdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
    modalCardWrapper: { width: '100%', paddingHorizontal: spacing.lg },
    modalCard: { backgroundColor: colors.background, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
    modalTitle: { fontWeight: '600' as const, color: colors.text, fontSize: fontSize.lg },
    modalMessage: { color: colors.textSecondary, marginTop: spacing.sm, fontSize: fontSize.sm },
    modalInput: { marginTop: spacing.lg, borderWidth: 2, borderColor: colors.border, borderRadius: 12, padding: spacing.md, color: colors.text, backgroundColor: colors.cardBackground, fontSize: fontSize.lg },
    modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  }), [fontSize]);

  if (!medication) {
    return (<SafeAreaView style={styles.container}><Text style={styles.errorText}>Medicamento não encontrado</Text></SafeAreaView>);
  }

  // ✅ Funções para registrar dose com o horário agendado correto
  const handleTakeDose = async () => {
    const scheduledDate = getScheduledDateForLog();
    setLoading(true);
    try {
      await logDose(medication.id, scheduledDate, 'taken');
      Toast.show('Dose registrada com sucesso!', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        backgroundColor: colors.success,
        textColor: colors.background,
      });
      router.back();
    } catch (error) {
      console.error('Error logging taken dose:', error);
      Toast.show('Não foi possível registrar a dose.', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        backgroundColor: colors.danger,
        textColor: colors.background,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipDose = async () => {
    const scheduledDate = getScheduledDateForLog();
    try {
      await logDose(medication.id, scheduledDate, 'skipped');
      Toast.show('A dose foi marcada como pulada.', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        backgroundColor: colors.warning,
        textColor: colors.background,
      });
      router.back();
    } catch (error) {
      console.error('Error logging skipped dose:', error);
      Toast.show('Não foi possível marcar a dose como pulada.', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        backgroundColor: colors.danger,
        textColor: colors.background,
      });
    }
  };
  
  const handleAddStock = () => {
    setStockAmount('');
    setIsStockModalVisible(true);
  };

  const closeStockModal = useCallback(() => {
    setIsStockModalVisible(false);
    setStockAmount('');
  }, []);

  const handleConfirmStock = useCallback(async () => {
    const amount = parseInt(stockAmount, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Valor inválido', 'Informe um número maior que zero.');
      return;
    }

    setIsUpdatingStock(true);
    try {
      await updateMedication(medication.id, { stock: medication.stock + amount });
      Toast.show(`${amount} unidades adicionadas ao estoque.`, {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        backgroundColor: colors.success,
        textColor: colors.background,
      });
      closeStockModal();
    } catch (error) {
      console.error('Error updating medication stock:', error);
      Toast.show('Erro ao atualizar o estoque do medicamento.', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        backgroundColor: colors.danger,
        textColor: colors.background,
      });
    } finally {
      setIsUpdatingStock(false);
    }
  }, [stockAmount, medication, updateMedication, closeStockModal]);
  
  const handleEdit = () => {
    const paramsToSend = { ...medication, times: medication.times || [] };
    router.push({ pathname: '/(modals)/add-medication/form', params: paramsToSend });
  };

  const handleDelete = () => {
    Alert.alert('Excluir Medicamento', 'Tem certeza?',
      [{ text: 'Cancelar', style: 'cancel' }, {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            await deleteMedication(medication.id);
            router.replace('/(tabs)/medicamentos');
          },
        },
      ]
    );
  };

  const lowStock = medication.stock <= medication.stockAlertThreshold;
  const isAsNeeded = medication.frequency === 'quando necessário';

  return (
    <>
      <Stack.Screen options={{ title: medication.name }} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={[styles.medicationName, { fontSize: fontSize.xxxl }]}>{medication.name}</Text>
            <Text style={[styles.dosage, { fontSize: fontSize.xl }]}>{medication.dosage}</Text>
            {medication.condition && (<View style={styles.infoRow}><Pill size={18} color={colors.textSecondary} /><Text style={[styles.value, { fontSize: fontSize.md }]}>{medication.condition}</Text></View>)}
            {medication.doctor && (<View style={styles.infoRow}><User size={18} color={colors.textSecondary} /><Text style={[styles.value, { fontSize: fontSize.md }]}>{medication.doctor}</Text></View>)}
            <View style={styles.infoRow}><Text style={[styles.label, { fontSize: fontSize.md }]}>Forma:</Text><Text style={[styles.value, { fontSize: fontSize.md }]}>{medication.form}</Text></View>
            <View style={styles.infoRow}><Text style={[styles.label, { fontSize: fontSize.md }]}>Frequência:</Text><Text style={[styles.value, { fontSize: fontSize.md }]}>{medication.frequency}</Text></View>
            {medication.times && medication.times.length > 0 && (<View style={styles.infoRow}><Text style={[styles.label, { fontSize: fontSize.md }]}>Horários:</Text><Text style={[styles.value, { fontSize: fontSize.md }]}>{medication.times.join(', ')}</Text></View>)}
            {medication.instructions && (<View style={styles.instructionsContainer}><Text style={[styles.label, { fontSize: fontSize.md }]}>Instruções:</Text><Text style={[styles.instructions, { fontSize: fontSize.md }]}>{medication.instructions}</Text></View>)}
          </View>
          <View style={[styles.card, lowStock && styles.warningCard]}>
            <View style={styles.stockHeader}><View style={styles.stockInfo}><Package size={24} color={lowStock ? colors.warning : colors.primary} /><Text style={[styles.stockTitle, { fontSize: fontSize.lg }]}>Estoque Atual</Text></View><Text style={[styles.stockCount, lowStock && styles.lowStockCount, { fontSize: fontSize.xxl }]}>{medication.stock}</Text></View>
            <Button title="Adicionar ao Estoque" onPress={handleAddStock} variant="secondary" iconName="Plus" />
          </View>
          
          {/* ✅ CARD DE AÇÃO REINSERIDO */}
          <View style={styles.card}>
              <Text style={[styles.cardTitle, { fontSize: fontSize.lg }]}>
                {isAsNeeded ? 'Registrar Dose' : 'Registrar Próxima Dose'}
              </Text>
              <View style={styles.doseButtons}>
                <Button title="Tomei" onPress={handleTakeDose} variant="success" size="large" loading={loading} />
                {/* O botão "Pulei" só aparece para medicamentos com horário fixo */}
                {!isAsNeeded && (
                    <Button title="Pulei" onPress={handleSkipDose} variant="secondary" />
                )}
              </View>
          </View>

          <View style={styles.managementButtons}>
              <Button title="Editar" onPress={handleEdit} variant="secondary" iconName="Pencil" style={{flex:1}} />
              <Button title="Excluir" onPress={handleDelete} variant="danger" iconName="Trash2" style={{flex:1}} />
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={isStockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeStockModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeStockModal} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalCardWrapper}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Adicionar ao Estoque</Text>
              <Text style={styles.modalMessage}>
                Informe quantas unidades deseja somar ao estoque atual.
              </Text>
              <TextInput
                value={stockAmount}
                onChangeText={(text) => setStockAmount(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                returnKeyType="done"
                placeholder="Ex: 2"
                placeholderTextColor={colors.textSecondary}
                style={styles.modalInput}
              />
              <View style={styles.modalActions}>
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={closeStockModal}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Adicionar"
                  variant="success"
                  onPress={handleConfirmStock}
                  loading={isUpdatingStock}
                  disabled={!stockAmount || isUpdatingStock}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

function getClosestScheduledDate(medication: Medication): Date | null {
  if (medication.frequency === 'quando necessário' || !medication.times?.length) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const times = expandMedicationTimes(medication);
  const candidates = times
    .map((time) => toDateForTime(today, time))
    .filter((value): value is Date => value !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  if (candidates.length === 0) return null;

  const now = new Date();
  const upcoming = candidates.find((candidate) => candidate.getTime() >= now.getTime());
  return upcoming ?? candidates[candidates.length - 1];
}

function expandMedicationTimes(medication: Medication): string[] {
  const normalized = normalizeTimes(medication.times ?? []);

  switch (medication.frequency) {
    case 'diária':
    case 'semanal':
      return normalized;
    case 'a cada 12h':
    case 'a cada 8h': {
      const interval = medication.frequency === 'a cada 12h' ? 12 : 8;
      const firstTime = normalized[0];
      if (!firstTime) return normalized;

      const parsed = parseTime(firstTime);
      if (!parsed) return normalized;

      const result: string[] = [];
      let hour = parsed.h;
      const minute = parsed.m;
      while (hour < 24) {
        result.push(formatTime(hour, minute));
        hour += interval;
      }
      return result;
    }
    default:
      return normalized;
  }
}

function normalizeTimes(times: string[]): string[] {
  const parsed = times
    .map(parseTime)
    .filter((value): value is { h: number; m: number } => value !== null)
    .map(({ h, m }) => formatTime(h, m));

  return Array.from(new Set(parsed)).sort();
}

function parseTime(time: string): { h: number; m: number } | null {
  const [hours, minutes] = time.split(':').map((part) => Number(part));
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return { h: hours, m: minutes };
}

function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function toDateForTime(referenceDay: Date, time: string): Date | null {
  const parsed = parseTime(time);
  if (!parsed) return null;
  const date = new Date(referenceDay);
  date.setHours(parsed.h, parsed.m, 0, 0);
  return date;
}
