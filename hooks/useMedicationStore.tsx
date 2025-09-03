import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleMedicationNotifications, cancelMedicationNotifications, scheduleStockNotification } from '@/lib/notifications';
import { Medication } from '@/types/medication';

const MEDS_KEY = '@medications';

interface MedicationState {
  medications: Medication[];
  isLoading: boolean;
  loadMedications: () => Promise<void>;
  addMedication: (medication: Omit<Medication, 'id' | 'createdAt'>) => Promise<Medication>;
  updateMedication: (id: string, updates: Partial<Omit<Medication, 'id'>>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medications: [],
  isLoading: true,

  loadMedications: async () => {
    try {
      const storedMeds = await AsyncStorage.getItem(MEDS_KEY);
      if (storedMeds) set({ medications: JSON.parse(storedMeds) });
    } catch (error) {
      console.error('Error loading meds:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  addMedication: async (data) => {
    const newMed: Medication = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updatedMeds = [...get().medications, newMed];
    set({ medications: updatedMeds });
    await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(updatedMeds));
    await scheduleMedicationNotifications(newMed);
    await scheduleStockNotification(newMed); // Adicionei a chamada aqui
    return newMed;
  },
  updateMedication: async (id, updates) => {
    let toUpdate: Medication | undefined;
    const updatedMeds = get().medications.map(m => (m.id === id ? (toUpdate = { ...m, ...updates }) : m));
    set({ medications: updatedMeds });
    await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(updatedMeds));
    if (toUpdate) await scheduleMedicationNotifications(toUpdate);
    if (toUpdate) await scheduleStockNotification(toUpdate);
  },
  deleteMedication: async (id) => {
    const updatedMeds = get().medications.filter(m => m.id !== id);
    set({ medications: updatedMeds });
    await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(updatedMeds));
    await cancelMedicationNotifications(id);
  },
}));