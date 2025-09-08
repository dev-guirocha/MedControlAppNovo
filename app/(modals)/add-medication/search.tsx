import React, { useState, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { COMMON_MEDICATIONS } from '@/constants/commonMedications';
import { useMedicationStore } from '@/hooks/useMedicationStore';
import { Text } from '@/components/StyledText';
import { Search, X, CornerDownLeft } from 'lucide-react-native';

export default function SearchMedicationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { medications: userMedications } = useMedicationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const fontSize = getFontSize('medium'); // Usando um tamanho padrão para esta tela

  const allSuggestions = useMemo(() => {
    const userMedsFormatted = userMedications.map(med => ({ name: med.name, dosage: med.dosage }));
    const combined = [...COMMON_MEDICATIONS, ...userMedsFormatted];
    const uniqueSuggestions = Array.from(new Map(combined.map(item => [item.name.toLowerCase(), item])).values());
    return uniqueSuggestions.sort((a, b) => a.name.localeCompare(b.name));
  }, [userMedications]);

  const filteredList = useMemo(() => {
    if (!searchQuery) return allSuggestions;
    return allSuggestions.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, allSuggestions]);

  const handleSelectMedication = (med: { name: string, dosage: string }) => {
    // Para garantir que a tela de formulário receba os parâmetros,
    // é mais robusto usar router.replace em vez de router.back()
    // e passar os parâmetros explicitamente.
    router.replace({
      pathname: '/(modals)/add-medication/form',
      params: { 
        ...params,
        selectedName: med.name, 
        selectedDosage: med.dosage 
      },
    });
  };

  // ✅ Nova função para usar o texto digitado
  const handleUseTypedName = () => {
    if (searchQuery.trim()) {
      router.replace({
        pathname: '/(modals)/add-medication/form',
        params: {
          ...params,
          selectedName: searchQuery.trim(),
          selectedDosage: '', // A dosagem será preenchida no formulário
        },
      });
    }
  };
  
  // ✅ Componente para renderizar quando não há resultados na busca
  const renderEmptyOrAddNew = () => {
    if (searchQuery.trim().length > 0) {
      return (
        <TouchableOpacity style={styles.addNewItem} onPress={handleUseTypedName}>
          <CornerDownLeft size={20} color={colors.primary} />
          <Text style={styles.addNewText}>
            Usar o nome digitado: <Text style={{fontWeight: 'bold'}}>{searchQuery.trim()}</Text>
          </Text>
        </TouchableOpacity>
      );
    }
    return (
        <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum medicamento encontrado.</Text>
        </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { fontSize: fontSize.md }]}
            placeholder="Buscar medicamento..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? <TouchableOpacity onPress={() => setSearchQuery('')}><X size={20} color={colors.textSecondary} /></TouchableOpacity> : null}
        </View>
      </View>
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectMedication(item)}>
            <Text style={[styles.suggestionText, { fontSize: fontSize.md }]}>{item.name}</Text>
            <Text style={[styles.suggestionDosage, { fontSize: fontSize.sm }]}>{item.dosage}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={renderEmptyOrAddNew}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled" // Garante que o toque funcione mesmo com o teclado aberto
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBackground, borderRadius: 12, paddingHorizontal: spacing.md },
  searchInput: { flex: 1, height: 48, color: colors.text, marginLeft: spacing.sm },
  listContent: { paddingHorizontal: spacing.lg },
  suggestionItem: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  suggestionText: { fontWeight: '600', color: colors.text },
  suggestionDosage: { color: colors.textSecondary, marginTop: 2 },
  addNewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.primaryFaded,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  addNewText: {
    marginLeft: spacing.sm,
    color: colors.primary,
    fontSize: 16,
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16
  }
});