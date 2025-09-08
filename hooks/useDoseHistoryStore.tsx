import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DoseHistory } from '@/types/medication';
import { DOSE_HISTORY_KEY } from '../src/constants/keys';
import { showErrorToast } from '@/lib/toastHelper';

interface DoseHistoryState {
  doseHistory: DoseHistory[];
  loadHistory: () => Promise<void>;
  // ✅ logDose agora apenas recebe a entrada pronta para salvar.
  addDoseEntry: (doseEntry: DoseHistory) => Promise<void>;
}

export const useDoseHistoryStore = create<DoseHistoryState>((set, get) => ({
  doseHistory: [],
  loadHistory: async () => {
    try {
      const storedHistory = await AsyncStorage.getItem(DOSE_HISTORY_KEY);
      if (storedHistory) {
        set({ doseHistory: JSON.parse(storedHistory) });
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  },
  // ✅ Lógica de adição de entrada de histórico, sem dependência de outros stores.
  addDoseEntry: async (newEntry: DoseHistory) => {
    try {
      const updatedHistory = [...get().doseHistory, newEntry];
      set({ doseHistory: updatedHistory });
      await AsyncStorage.setItem(DOSE_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error adding dose entry:', error);
      showErrorToast('Erro ao registrar a dose no histórico.'); // ✅ 2. Adicionar feedback de erro
    }
  },
}));