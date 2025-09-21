import React, { useState, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMedicationStore } from '@/hooks/useMedicationStore';
import { colors, getFontSize, spacing, medicationColors } from '@/constants/theme';
import { Medication } from '@/types/medication';
import Toast from 'react-native-root-toast';
import { CheckCircle, Search, Pill, Inbox } from 'lucide-react-native';
import { COMMON_MEDICATIONS } from '@/constants/commonMedications';
import { Text } from '@/components/StyledText';
import { useAuthStore } from '@/hooks/useAuthStore';


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
  const { fontScale } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectMedication = async (item: ListItem) => {
    const existingMed = medications.find(m => m.name.toLowerCase() === item.name.toLowerCase());

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
              const newMedicationData = {
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
                 textColor: colors.background,
              });
              router.replace('/(tabs)/home');
            },
          },
        ]
      );
    }
  };

  const combinedList = useMemo(() => {
    const filteredSuggestions = COMMON_MEDICATIONS.filter(
      suggestion => !medications.some(
        userMed => userMed.name.toLowerCase() === suggestion.name.toLowerCase()
      )
    ).map(s => ({ ...s, isSuggestion: true }));

    return [...medications, ...filteredSuggestions];
  }, [medications]);

  const filteredList = combinedList.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
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
