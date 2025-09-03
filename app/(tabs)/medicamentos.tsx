import React from 'react';
import { View, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { useMedicationStore } from '@/hooks/useMedicationStore';
import { SwipeableMedicationCard } from '@/components/SwipeableMedicationCard';
import { Pill } from 'lucide-react-native';
import { Medication } from '@/types/medication';
import Toast from 'react-native-root-toast';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Text } from '@/components/StyledText';

export default function AllMedicationsScreen() {
  const router = useRouter();
  const { medications, deleteMedication } = useMedicationStore();
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);

  const handleDelete = (id: string) => {
    deleteMedication(id);
  };
  
  const dynamicStyles = StyleSheet.create({
    emptyTitle: {
      fontSize: fontSize.xl,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: fontSize.md * 1.5,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {medications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><Pill size={64} color={colors.disabled} /></View>
          <Text style={dynamicStyles.emptyTitle}>Nenhum medicamento adicionado</Text>
          <Text style={dynamicStyles.emptySubtitle}>Use o botão '+' na tela "Hoje" para começar.</Text>
        </View>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(item: Medication) => item.id}
          renderItem={({ item }) => (
            <SwipeableMedicationCard
              medication={item}
              onPress={() => router.push(`/medication/${item.id}`)}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.lg },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
});