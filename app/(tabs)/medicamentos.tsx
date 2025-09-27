import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, SectionList, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { useMedicationStore } from '@/hooks/useMedicationStore';
import { SwipeableMedicationCard } from '@/components/SwipeableMedicationCard';
import { Text } from '@/components/StyledText';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Pill, Search, X } from 'lucide-react-native';

export default function AllMedicationsScreen() {
  const router = useRouter();
  const { medications, deleteMedication } = useMedicationStore();
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDelete = useCallback(
    (id: string) => {
      deleteMedication(id);
    },
    [deleteMedication]
  );

  // ✅ Lógica para filtrar e agrupar os medicamentos
  const groupedMedications = useMemo(() => {
    // 1. Filtra os medicamentos com base na busca
    const filtered = medications.filter(med => 
      med.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. Agrupa os medicamentos filtrados pela letra inicial
    const groups = filtered.reduce((acc, med) => {
      const firstLetter = med.name[0].toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(med);
      return acc;
    }, {} as Record<string, typeof medications>);

    // 3. Formata para o formato que a SectionList espera
    return Object.keys(groups).sort().map(letter => ({
      title: letter,
      data: groups[letter],
    }));
  }, [medications, searchQuery]);

  // Se não houver nenhum medicamento cadastrado, mostra o estado de boas-vindas
  if (medications.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.emptyState}>
          <Pill size={64} color={colors.disabled} />
          <Text style={[styles.emptyTitle, { fontSize: fontSize.xl }]}>Nenhum medicamento adicionado</Text>
          <Text style={[styles.emptySubtitle, { fontSize: fontSize.md }]}>Use o botão '+' na tela "Hoje" para começar.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ✅ Barra de Busca */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { fontSize: fontSize.md }]}
          placeholder="Buscar em seus medicamentos..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* ✅ Lista em seções (SectionList) */}
      <SectionList
        sections={groupedMedications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <SwipeableMedicationCard
            medication={item}
            onDelete={() => handleDelete(item.id)}
            onPress={() => router.push(`/medication/${item.id}`)}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[styles.sectionHeader, { fontSize: fontSize.lg }]}>{title}</Text>
        )}
        ListEmptyComponent={() => (
            <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { fontSize: fontSize.lg }]}>Nenhum resultado</Text>
                <Text style={[styles.emptySubtitle, { fontSize: fontSize.md }]}>Não encontramos medicamentos com esse nome.</Text>
            </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  listContent: { 
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sectionHeader: {
    fontWeight: 'bold',
    backgroundColor: colors.background,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    color: colors.primary,
  },
  emptyState: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyTitle: {
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
