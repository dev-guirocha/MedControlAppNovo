import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDoseSchedule } from '@/hooks/medication-store';
import { useMedicationStore } from '@/hooks/useMedicationStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { MedicationCard } from '@/components/MedicationCard';
import { Plus } from 'lucide-react-native';
import { Text as StyledText } from '@/components/StyledText';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { useAppLoadingStore } from '@/hooks/useAppLoadingStore';
import { ScheduledDose } from '@/types/medication';
import { useDoseHistoryStore } from '@/hooks/useDoseHistoryStore';

export default function HomeScreen() {
  const router = useRouter();
  const { userProfile } = useAuthStore();
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);
  const { medications: allMedications, logDose } = useMedicationStore();
  const { isLoading } = useAppLoadingStore();
  const { doseHistory } = useDoseHistoryStore();
  const insets = useSafeAreaInsets();

  const schedule = useDoseSchedule();
  const missedDoses = schedule.filter(dose => dose.isMissed);
  const upcomingDoses = schedule.filter(dose => !dose.isMissed);
  const nextDose = upcomingDoses[0] || null;

  const todayKey = new Date().toISOString().split('T')[0];
  const todayHistory = doseHistory.filter(item => {
    if (!item.scheduledTime) return false;
    const date = new Date(item.scheduledTime);
    return !Number.isNaN(date.getTime()) && date.toISOString().split('T')[0] === todayKey;
  });
  const takenToday = todayHistory.filter(item => item.status === 'taken').length;
  const skippedToday = todayHistory.filter(item => item.status === 'skipped').length;
  const pendingToday = upcomingDoses.length + missedDoses.length;
  const totalDosesToday = takenToday + skippedToday + pendingToday;
  const completionRate = totalDosesToday > 0 ? takenToday / totalDosesToday : 0;

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const handleTakeDose = useCallback(async (medication: ScheduledDose) => {
    try {
      await logDose(medication.id, medication.scheduledDateTime, 'taken');
      Alert.alert('Sucesso!', 'Dose registrada com sucesso!');
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar a dose. Tente novamente.');
    }
  }, [logDose]);

  if (isLoading || !userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Carregando a tela inicial" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}>
        <View style={styles.header}>
          <StyledText style={homeStyles.greeting}>{getGreeting()}, {userProfile.name}!</StyledText>
          <StyledText style={homeStyles.date}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </StyledText>
        </View>

        {allMedications.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryColumn}>
                <StyledText style={homeStyles.summaryLabel}>Doses tomadas</StyledText>
                <StyledText style={homeStyles.summaryValue}>{takenToday}</StyledText>
              </View>
              <View style={styles.summaryColumn}>
                <StyledText style={homeStyles.summaryLabel}>Pendentes</StyledText>
                <StyledText style={[homeStyles.summaryValue, pendingToday ? homeStyles.summaryWarning : null]}>{pendingToday}</StyledText>
              </View>
              <View style={styles.summaryColumn}>
                <StyledText style={homeStyles.summaryLabel}>Puladas</StyledText>
                <StyledText style={[homeStyles.summaryValue, skippedToday ? homeStyles.summarySkipped : null]}>{skippedToday}</StyledText>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${completionRate * 100}%` }]} />
              </View>
              <StyledText style={homeStyles.progressText}>
                {totalDosesToday > 0 ? `${takenToday} de ${totalDosesToday} doses concluídas` : 'Nenhuma dose programada para hoje'}
              </StyledText>
            </View>
          </View>
        )}

        {allMedications.length === 0 ? (
          <View style={styles.emptyState}>
            <StyledText style={homeStyles.emptyTitle}>Nenhum medicamento adicionado</StyledText>
            <StyledText style={homeStyles.emptySubtitle}>Toque no botão '+' para começar.</StyledText>
          </View>
        ) : (
          <>
            {missedDoses.length > 0 && (
              <>
                <StyledText style={[homeStyles.sectionTitle, homeStyles.missedSectionTitle]}>DOSES ATRASADAS</StyledText>
                {missedDoses.map((dose) => (
                  <MedicationCard
                    key={dose.doseId}
                    medication={dose}
                    onTakeDose={() => handleTakeDose(dose)}
                    onPress={() => router.push(`/medication/${dose.id}`)}
                  />
                ))}
              </>
            )}

            {upcomingDoses.length > 0 && (
                 <>
                    <StyledText style={homeStyles.sectionTitle}>PRÓXIMAS DOSES</StyledText>
                    {upcomingDoses.map((dose) => (
                        <MedicationCard
                            key={dose.doseId}
                            medication={dose}
                            isNextDose={dose.doseId === nextDose?.doseId}
                            onTakeDose={() => handleTakeDose(dose)}
                            onPress={() => router.push(`/medication/${dose.id}`)}
                        />
                    ))}
                 </>
            )}

            {schedule.length === 0 && (
              <View style={styles.emptyStateSection}>
                <StyledText style={homeStyles.emptyTitle}>Tudo certo por hoje!</StyledText>
                <StyledText style={homeStyles.emptySubtitle}>Você não tem mais doses pendentes para hoje. Parabéns!</StyledText>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: 16 + (Platform.OS === 'ios' ? insets.bottom : 0) }]}
        onPress={() => router.push('/(modals)/add-medication')}
        accessibilityLabel="Adicionar medicamento"
        accessibilityRole="button"
      >
        <Plus color="white" size={32} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const homeStyles = StyleSheet.create({
  greeting: { fontSize: 32, fontWeight: 'bold', color: colors.text },
  date: { fontSize: 16, color: colors.textSecondary, textTransform: 'capitalize', marginTop: 4 },
  emptyTitle: { fontSize: 24, fontWeight: '600', color: colors.text, marginTop: 24, marginBottom: 12, textAlign: 'center' },
  emptySubtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: colors.textSecondary, 
    marginBottom: 12, 
    marginTop: spacing.lg, // ✅ AUMENTADO: Espaçamento superior para as seções
    textTransform:'uppercase', 
    letterSpacing: 0.5 
  },
  missedSectionTitle: { color: colors.danger },
  summaryLabel: { fontSize: 13, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 },
  summaryValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  summaryWarning: { color: colors.warning },
  summarySkipped: { color: colors.danger },
  progressText: { marginTop: spacing.sm, color: colors.textSecondary, fontSize: 13 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100, flexGrow: 1, paddingHorizontal: 16 },
  header: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryCard: { marginTop: spacing.lg, backgroundColor: colors.cardBackground, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryColumn: { flex: 1 },
  progressContainer: { marginTop: spacing.lg },
  progressTrack: { height: 10, borderRadius: 6, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.success },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyStateSection: { alignItems: 'center', paddingVertical: spacing.xxl },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
