import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, SectionList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { useMedicationStore } from '@/hooks/useMedicationStore';
import { MedicationCard } from '@/components/MedicationCard';
import { SwipeableMedicationCard } from '@/components/SwipeableMedicationCard';
import { Text } from '@/components/StyledText';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Pill, Search, X } from 'lucide-react-native';
import { useTabBarSpace } from '@/hooks/useTabBarSpace';
import { PersonSelector } from '@/components/PersonSelector';
import { usePeopleStore } from '@/hooks/usePeopleStore';
import type { Medication } from '@/types/medication';

function formatEndedDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR');
}

export default function AllMedicationsScreen() {
  const router = useRouter();
  const { medications: allMedications, deleteMedication } = useMedicationStore();
  const activePersonId = usePeopleStore((s) => s.activePersonId);
  const medications = useMemo(
    () => allMedications.filter((med) => med.personId === activePersonId),
    [allMedications, activePersonId]
  );
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);
  const [searchQuery, setSearchQuery] = useState('');
  const tabBarSpace = useTabBarSpace();

  const handleDelete = useCallback(
    (id: string) => {
      // Excluir apaga também o histórico: sempre confirmar (antes o deslize apagava direto).
      const name = medications.find((med) => med.id === id)?.name ?? 'este medicamento';
      Alert.alert(
        `Excluir ${name}?`,
        'O lembrete e todo o histórico de doses de ' + name + ' também serão apagados. Essa ação não pode ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: () => void deleteMedication(id) },
        ]
      );
    },
    [deleteMedication, medications]
  );

  // ✅ Lógica para filtrar e agrupar os medicamentos
  const groupedMedications = useMemo(() => {
    // 1. Filtra os medicamentos com base na busca
    const filtered = medications.filter(med =>
      !med.endedAt && med.name.toLowerCase().includes(searchQuery.toLowerCase())
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
    const sections: { title: string; data: Medication[]; ended?: boolean }[] = Object.keys(groups).sort().map(letter => ({
      title: letter,
      data: groups[letter],
    }));

    // 4. Tratamentos encerrados ficam numa seção própria, abaixo dos ativos
    const ended = medications
      .filter(med => med.endedAt && med.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    if (ended.length > 0) sections.push({ title: 'Encerrados', data: ended, ended: true });
    return sections;
  }, [medications, searchQuery]);

  // Se não houver nenhum medicamento cadastrado, mostra o estado de boas-vindas
  if (medications.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <PersonSelector />
        <View style={styles.emptyState}>
          <Pill size={64} color={colors.disabled} />
          <Text style={[styles.emptyTitle, { fontSize: fontSize.xl }]}>Nenhum medicamento adicionado</Text>
          <Text style={[styles.emptySubtitle, { fontSize: fontSize.md }]}>Use o botão '+' na tela "Hoje" para começar.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <PersonSelector />
      {/* ✅ Barra de Busca */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { fontSize: fontSize.md }]}
          placeholder="Buscar em seus medicamentos..."
          accessibilityLabel="Buscar medicamento"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
            hitSlop={12}
          >
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* ✅ Lista em seções (SectionList) */}
      <SectionList
        sections={groupedMedications}
        keyExtractor={item => item.id}
        renderItem={({ item, section }) =>
          section.ended ? (
            <View>
              <MedicationCard
                medication={item}
                extraAccessibilityLabel={`encerrado em ${formatEndedDate(item.endedAt)}`}
                onPress={() => router.push(`/medication/${item.id}`)}
              />
              <Text style={[styles.endedDate, { fontSize: fontSize.sm }]}>encerrado em {formatEndedDate(item.endedAt)}</Text>
            </View>
          ) : (
            <SwipeableMedicationCard
              medication={item}
              onDelete={() => handleDelete(item.id)}
              onPress={() => router.push(`/medication/${item.id}`)}
            />
          )
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[styles.sectionHeader, { fontSize: fontSize.lg }]}>{title}</Text>
        )}
        ListEmptyComponent={() => (
            <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { fontSize: fontSize.lg }]}>Nenhum resultado</Text>
                <Text style={[styles.emptySubtitle, { fontSize: fontSize.md }]}>Não encontramos medicamentos com esse nome.</Text>
            </View>
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarSpace }]}
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
  endedDate: { color: colors.textSecondary, marginTop: -spacing.xs, marginBottom: spacing.md, marginLeft: spacing.xs },
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
