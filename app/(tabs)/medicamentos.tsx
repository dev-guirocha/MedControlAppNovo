// Arquivo: medicamentos.tsx

import React, { useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { useMedicationStore } from '@/hooks/useMedicationStore';
import { SwipeableMedicationCard } from '@/components/SwipeableMedicationCard';
import { Text } from '@/components/StyledText';
import { useAuthStore } from '@/hooks/useAuthStore';

export default function AllMedicationsScreen() {
  const router = useRouter();
  const { medications, deleteMedication } = useMedicationStore();
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);

  const handleDelete = useCallback(
    (id: string) => {
      deleteMedication(id);
    },
    [deleteMedication]
  );

  if (medications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={dynamicStyles.emptyTitle}>Nenhum medicamento adicionado</Text>
          <Text style={dynamicStyles.emptySubtitle}>Use o botão '+' na tela "Hoje" para começar.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={medications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <SwipeableMedicationCard
            medication={item}
            onDelete={() => handleDelete(item.id)}
            onPress={() => router.push(`/medication/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const dynamicStyles = StyleSheet.create({
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.lg },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
