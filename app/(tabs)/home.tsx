import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDoseSchedule } from '@/hooks/medication-store';
import { useMedicationStore } from '@/hooks/useMedicationStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { MedicationCard } from '@/components/MedicationCard';
import { Plus } from 'lucide-react-native';
import { Text as StyledText } from '@/components/StyledText';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { useAppLoadingStore } from '@/hooks/useAppLoadingStore';
import { ScheduledDose } from '@/types/medication';

export default function HomeScreen() {
  const router = useRouter();
  const { userProfile } = useAuthStore();
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);
  const { medications: allMedications, logDose } = useMedicationStore();
  const { isLoading } = useAppLoadingStore();

  const schedule = useDoseSchedule();
  const missedDoses = schedule.filter(dose => dose.isMissed);
  const upcomingDoses = schedule.filter(dose => !dose.isMissed);
  const nextDose = upcomingDoses[0] || null;

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <StyledText style={homeStyles.greeting}>{getGreeting()}, {userProfile.name}!</StyledText>
          <StyledText style={homeStyles.date}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </StyledText>
        </View>

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
        style={styles.fab}
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
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100, flexGrow: 1, paddingHorizontal: 16 },
  header: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
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