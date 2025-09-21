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
        const parsed: DoseHistory[] = JSON.parse(storedHistory);
        const normalized = parsed.map(ensureDoseId);
        set({ doseHistory: normalized });
        await AsyncStorage.setItem(DOSE_HISTORY_KEY, JSON.stringify(normalized));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  },
  // ✅ Lógica de adição de entrada de histórico, sem dependência de outros stores.
  addDoseEntry: async (newEntry: DoseHistory) => {
    try {
      const entryWithId = ensureDoseId(newEntry);
      const current = get().doseHistory;
      const updatedHistory = [...current];

      const existingIndex = updatedHistory.findIndex((item) =>
        item.id === entryWithId.id || (!!entryWithId.doseId && item.doseId === entryWithId.doseId)
      );

      if (existingIndex >= 0) {
        updatedHistory[existingIndex] = entryWithId;
      } else {
        updatedHistory.push(entryWithId);
      }

      set({ doseHistory: updatedHistory });
      await AsyncStorage.setItem(DOSE_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error adding dose entry:', error);
      showErrorToast('Erro ao registrar a dose no histórico.'); // ✅ 2. Adicionar feedback de erro
    }
  },
}));

function ensureDoseId(entry: DoseHistory): DoseHistory {
  if (entry.doseId) {
    return entry;
  }

  const parsed = new Date(entry.scheduledTime);
  if (Number.isNaN(parsed.getTime())) {
    return entry;
  }

  const dayKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(
    parsed.getDate()
  ).padStart(2, '0')}`;
  const timeKey = `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;

  return {
    ...entry,
    doseId: `${entry.medicationId}::${dayKey}::${timeKey}`,
  };
}
