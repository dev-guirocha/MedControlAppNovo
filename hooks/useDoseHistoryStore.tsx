import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DoseHistory } from '@/types/medication';
import { useMedicationStore } from './useMedicationStore'; // Importamos o store principal para buscar os medicamentos

const HISTORY_KEY = '@dose_history';

interface DoseHistoryState {
  doseHistory: DoseHistory[];
  isLoadingHistory: boolean;
  loadHistory: () => Promise<void>;
  logDose: (medicationId: string, scheduledTime: Date, status: 'taken' | 'skipped') => Promise<void>;
}

export const useDoseHistoryStore = create<DoseHistoryState>((set, get) => ({
  doseHistory: [],
  isLoadingHistory: true,
  loadHistory: async () => {
    try {
      const storedHistory = await AsyncStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        set({ doseHistory: JSON.parse(storedHistory) });
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      set({ isLoadingHistory: false });
    }
  },
  logDose: async (medId, time, status) => {
    // Busca o medicamento no store principal
    const med = useMedicationStore.getState().medications.find(m => m.id === medId);
    if (!med) return;

    const newEntry: DoseHistory = {
      id: `${medId}-${time.toISOString()}`,
      medicationId: medId,
      medicationName: med.name,
      scheduledTime: time.toISOString(),
      status,
      takenTime: status === 'taken' ? new Date().toISOString() : undefined,
    };
    const updatedHistory = [...get().doseHistory, newEntry];
    set({ doseHistory: updatedHistory });
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

    if (status === 'taken' && med.stock > 0) {
      await useMedicationStore.getState().updateMedication(medId, { stock: med.stock - 1 });
    }
  },
}));