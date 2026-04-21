import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { COMMON_MEDICATIONS } from '@/constants/commonMedications';
import { MEDICATION_SUGGESTIONS_KEY } from '@/src/constants/keys';

export type MedicationSuggestion = {
  name: string;
  dosage: string;
};

interface MedicationSuggestionsState {
  suggestions: MedicationSuggestion[];
  loadSuggestions: () => Promise<void>;
  addSuggestion: (suggestion: MedicationSuggestion) => Promise<void>;
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function isBaseMedicationSuggestion(name: string) {
  const normalizedName = normalizeName(name);
  return COMMON_MEDICATIONS.some((item) => normalizeName(item.name) === normalizedName);
}

export const useMedicationSuggestionsStore = create<MedicationSuggestionsState>((set, get) => ({
  suggestions: [],

  loadSuggestions: async () => {
    try {
      const rawValue = await AsyncStorage.getItem(MEDICATION_SUGGESTIONS_KEY);
      const parsedSuggestions: MedicationSuggestion[] = rawValue ? JSON.parse(rawValue) : [];
      set({ suggestions: parsedSuggestions });
    } catch (error) {
      console.error('Error loading medication suggestions:', error);
    }
  },

  addSuggestion: async (suggestion) => {
    const trimmedName = suggestion.name.trim();
    const trimmedDosage = suggestion.dosage.trim();

    if (!trimmedName || isBaseMedicationSuggestion(trimmedName)) {
      return;
    }

    const normalizedName = normalizeName(trimmedName);
    const currentSuggestions = get().suggestions;
    const alreadyExists = currentSuggestions.some((item) => normalizeName(item.name) === normalizedName);

    if (alreadyExists) {
      return;
    }

    const nextSuggestions = [
      ...currentSuggestions,
      {
        name: trimmedName,
        dosage: trimmedDosage,
      },
    ].sort((a, b) => a.name.localeCompare(b.name));

    try {
      await AsyncStorage.setItem(MEDICATION_SUGGESTIONS_KEY, JSON.stringify(nextSuggestions));
      set({ suggestions: nextSuggestions });
    } catch (error) {
      console.error('Error storing medication suggestion:', error);
    }
  },
}));
