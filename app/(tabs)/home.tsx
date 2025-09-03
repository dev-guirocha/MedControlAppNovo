import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDoseSchedule } from '@/hooks/medication-store';
import { useMedicationStore } from '@/hooks/useMedicationStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useDoseHistoryStore } from '@/hooks/useDoseHistoryStore';
import { MedicationCard } from '@/components/MedicationCard';
import { Plus, Calendar, Pill as PillIcon, PartyPopper } from 'lucide-react-native';
import { Text as StyledText } from '@/components/StyledText';
import Toast from 'react-native-root-toast';
import { colors, getFontSize, spacing } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useAuthStore();
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);
  const { medications: allMedications } = useMedicationStore();
  const { logDose } = useDoseHistoryStore();
  
  const schedule = useDoseSchedule();
  const nextDose = schedule[0] || null;
  const todaysRemainingDoses = schedule.filter(dose => dose.isToday);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };
  
  const handleTakeDose = async (medId: string, scheduledTime: Date) => {
    await logDose(medId, scheduledTime, 'taken');
    Alert.alert('Sucesso!', 'Dose registrada com sucesso!');
  };

  const handleSkipDose = async (medId: string, scheduledTime: Date) => {
    await logDose(medId, scheduledTime, 'skipped');
    Alert.alert('Sucesso!', 'Dose marcada como pulada.');
  };

  if (isProfileLoading || !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const dynamicStyles = StyleSheet.create({
    greeting: { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.text },
    date: { fontSize: fontSize.md, color: colors.textSecondary, textTransform: 'capitalize', marginTop: spacing.xs },
    emptyTitle: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
    emptySubtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center' },
    sectionTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
    gamificationTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.success },
    gamificationSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <StyledText style={dynamicStyles.greeting}>{getGreeting()}, {userProfile.name}!</StyledText>
          <StyledText style={dynamicStyles.date}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</StyledText>
        </View>
        
        {allMedications.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color={colors.disabled} />
            <StyledText style={dynamicStyles.emptyTitle}>Nenhum medicamento adicionado</StyledText>
            <StyledText style={dynamicStyles.emptySubtitle}>Toque no botão '+' para começar.</StyledText>
          </View>
        ) : (
          <View style={styles.medicationsList}>
            {nextDose && (
              <View style={styles.section}>
                <StyledText style={dynamicStyles.sectionTitle}>Próxima Dose</StyledText>
                <MedicationCard 
                  medication={nextDose} 
                  onPress={() => router.push(`/medication/${nextDose.id}`)} 
                  isNextDose 
                  onTakeDose={handleTakeDose}
                  onSkipDose={handleSkipDose}
                />
              </View>
            )}
            <View style={styles.section}>
              <StyledText style={dynamicStyles.sectionTitle}>Doses de Hoje</StyledText>
              {todaysRemainingDoses.length > 0 ? (
                todaysRemainingDoses.map((dose) => (
                  <MedicationCard key={dose.doseId} medication={dose} onPress={() => router.push(`/medication/${dose.id}`)} />
                ))
              ) : (
                <View style={styles.gamificationCard}>
                  <PartyPopper size={48} color={colors.success} />
                  <View style={styles.gamificationTextContainer}>
                    <StyledText style={dynamicStyles.gamificationTitle}>Tudo certo por hoje!</StyledText>
                    <StyledText style={dynamicStyles.gamificationSubtitle}>Você tomou todas as suas doses. Parabéns!</StyledText>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(modals)/add-medication')}>
        <Plus size={32} color={colors.background} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 100, flexGrow: 1 },
    header: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    medicationsList: { padding: spacing.lg },
    section: { marginBottom: spacing.lg },
    fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
    gamificationCard: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: spacing.lg, alignItems: 'center', flexDirection: 'row', gap: spacing.md, borderWidth: 1, borderColor: colors.border },
    gamificationTextContainer: { flex: 1 },
});