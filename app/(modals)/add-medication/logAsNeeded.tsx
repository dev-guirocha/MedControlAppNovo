import React, { useState, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMedicationStore } from '@/hooks/useMedicationStore';
import { colors, getFontSize, spacing, medicationColors } from '@/constants/theme';
import { Medication } from '@/types/medication';
import Toast from 'react-native-root-toast';
import { CheckCircle, Search, Pill, Inbox } from 'lucide-react-native';
import { COMMON_MEDICATIONS } from '@/constants/commonMedications';
import { useMedicationSuggestionsStore } from '@/hooks/useMedicationSuggestionsStore';
import { Text } from '@/components/StyledText';
import { useAuthStore } from '@/hooks/useAuthStore';
import { usePeopleStore } from '@/hooks/usePeopleStore';
import { PersonField } from '@/components/PersonChips';
import { findMedicationForPerson } from '@/lib/people';
import { showErrorToast } from '@/lib/toastHelper';


type ListItem = Medication | { name: string; dosage: string; isSuggestion?: boolean };

const AsNeededMedicationItem = ({ item, onPress, fontScale }: { item: ListItem, onPress: () => void, fontScale: any }) => {
  const fontSize = getFontSize(fontScale);
  const dynamicStyles = StyleSheet.create({
    itemName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
    itemDosage: { fontSize: fontSize.sm, color: colors.textSecondary },
  });

  return (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
      <Pill size={24} color={colors.primary} />
      <View style={styles.itemDetails}>
        <Text style={dynamicStyles.itemName}>{item.name}</Text>
        <Text style={dynamicStyles.itemDosage}>{item.dosage}</Text>
      </View>
      <CheckCircle size={24} color={colors.success} />
    </TouchableOpacity>
  );
};


export default function LogAsNeededScreen() {
  const router = useRouter();
  // ✅ CORREÇÃO: `logDose` vem do useMedicationStore
  const { medications, addMedication, logDose } = useMedicationStore();
  const { suggestions: learnedSuggestions } = useMedicationSuggestionsStore();
  const { fontScale } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [forPersonId, setForPersonId] = useState<string | null>(() => usePeopleStore.getState().activePersonId);

  const handleSelectMedication = async (item: ListItem) => {
    const existingMed = forPersonId ? findMedicationForPerson(medications, forPersonId, item.name) : undefined;

    if (existingMed) {
      await logDose(existingMed.id, new Date(), 'taken');
      Alert.alert('Sucesso!', `${existingMed.name} registrado com sucesso!`);
      router.replace('/(tabs)/home'); // ✅ CORREÇÃO: Adicionada a navegação de volta
    } else {
      Alert.alert(
        'Adicionar Novo Medicamento',
        `O medicamento "${item.name}" não está na sua lista. Deseja adicioná-lo e registrar a primeira dose?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Adicionar',
            onPress: async () => {
              const personId = forPersonId;
              if (!personId) {
                showErrorToast('Cadastre uma pessoa antes de continuar.');
                return;
              }
              const newMedicationData = {
                personId,
                name: item.name,
                dosage: item.dosage,
                form: 'comprimido' as Medication['form'],
                frequency: 'quando necessário' as Medication['frequency'],
                times: [] as string[],
                stock: 1,
                stockAlertThreshold: 0,
                instructions: 'Tomar quando necessário.',
                condition: '',
                color: medicationColors[0],
                doctor: '',
              };
              const newMed = await addMedication(newMedicationData);
              await logDose(newMed.id, new Date(), 'taken');
              Toast.show(`${newMed.name} foi adicionado e a dose registrada!`, {
                 duration: Toast.durations.LONG,
                 backgroundColor: colors.success,
                 textColor: colors.textInverse,
              });
              router.replace('/(tabs)/home');
            },
          },
        ]
      );
    }
  };

  const combinedList = useMemo(() => {
    // Só os remédios da pessoa escolhida contam como "já cadastrados"; nomes de outras pessoas viram sugestão.
    const personMeds = medications.filter(m => m.personId === forPersonId);
    const baseSuggestions = [...COMMON_MEDICATIONS, ...learnedSuggestions, ...medications.filter(m => m.personId !== forPersonId).map(m => ({ name: m.name, dosage: m.dosage }))];
    const filteredSuggestions = baseSuggestions.filter(
      suggestion => !personMeds.some(
        userMed => userMed.name.toLowerCase() === suggestion.name.toLowerCase()
      )
    ).map(s => ({ name: s.name, dosage: s.dosage, isSuggestion: true }));

    const uniqueList = Array.from(
      new Map([...personMeds, ...filteredSuggestions].map(item => [item.name.toLowerCase(), item])).values()
    );

    return uniqueList;
  }, [learnedSuggestions, medications, forPersonId]);

  const filteredList = combinedList.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.forPerson}>
        <PersonField value={forPersonId} onChange={setForPersonId} />
      </View>
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ou selecionar..."
          placeholderTextColor={colors.disabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <AsNeededMedicationItem item={item} onPress={() => handleSelectMedication(item)} fontScale={fontScale} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Inbox size={64} color={colors.disabled} />
            <Text style={styles.emptyTitle}>Nenhum medicamento encontrado</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  forPerson: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, marginBottom: -spacing.sm },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBackground, borderRadius: 12, margin: spacing.lg, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, height: 50, fontSize: getFontSize('medium').md, color: colors.text },
  listContent: { paddingHorizontal: spacing.lg },
  itemContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemDetails: { flex: 1, marginLeft: spacing.md },
  itemName: { fontSize: getFontSize('medium').md, fontWeight: '600', color: colors.text },
  itemDosage: { fontSize: getFontSize('medium').sm, color: colors.textSecondary },
  emptyState: { alignItems: 'center', marginTop: spacing.xxl, padding: spacing.lg },
  emptyTitle: { fontSize: getFontSize('medium').lg, fontWeight: '600', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
});
