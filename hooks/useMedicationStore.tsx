import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleMedicationNotifications, cancelMedicationNotifications, scheduleStockNotification } from '@/lib/notifications';
import { Medication, DoseHistory } from '@/types/medication';

const MEDS_KEY = '@medications';
const HISTORY_KEY = '@dose_history'; // ✅ Adicionar chave para histórico

interface MedicationState {
  medications: Medication[];
  doseHistory: DoseHistory[]; // ✅ Adicionar histórico ao estado
  isLoading: boolean;
  loadMedications: () => Promise<void>;
  loadHistory: () => Promise<void>; // ✅ Adicionar carregamento do histórico
  addMedication: (medication: Omit<Medication, 'id' | 'createdAt'>) => Promise<Medication>;
  updateMedication: (id: string, updates: Partial<Omit<Medication, 'id'>>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  logDose: (medicationId: string, time: Date, status: 'taken' | 'skipped') => Promise<void>; // ✅ Adicionar função logDose
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medications: [],
  doseHistory: [], // ✅ Inicializar histórico vazio
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

  // ✅ Nova função para carregar histórico
  loadHistory: async () => {
    try {
      const storedHistory = await AsyncStorage.getItem(HISTORY_KEY);
      if (storedHistory) set({ doseHistory: JSON.parse(storedHistory) });
    } catch (error) {
      console.error('Error loading history:', error);
    }
  },

  addMedication: async (data) => {
    const newMed: Medication = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updatedMeds = [...get().medications, newMed];
    set({ medications: updatedMeds });
    await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(updatedMeds));
    await scheduleMedicationNotifications(newMed);
    await scheduleStockNotification(newMed);
    return newMed;
  },

  updateMedication: async (id, updates) => {
    let toUpdate: Medication | undefined;
    const updatedMeds = get().medications.map(m => (m.id === id ? (toUpdate = { ...m, ...updates }) : m));
    set({ medications: updatedMeds });
    await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(updatedMeds));
    
    if (toUpdate) {
      await scheduleMedicationNotifications(toUpdate);

      if (updates.stock !== undefined) {
        await scheduleStockNotification(toUpdate);
      }
    }
  },

  deleteMedication: async (id) => {
    const updatedMeds = get().medications.filter(m => m.id !== id);
    set({ medications: updatedMeds });
    await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(updatedMeds));
    await cancelMedicationNotifications(id);
  },

  // ✅ Nova função para registrar doses
  logDose: async (medicationId: string, time: Date, status: 'taken' | 'skipped') => {
    const med = get().medications.find(m => m.id === medicationId);
    if (!med) return;
    
    const newEntry: DoseHistory = {
      id: `${medicationId}-${time.toISOString()}`,
      medicationId: medicationId,
      medicationName: med.name,
      scheduledTime: time.toISOString(),
      status,
      takenTime: status === 'taken' ? new Date().toISOString() : undefined,
    };
    
    const updatedHistory = [...get().doseHistory, newEntry];
    set({ doseHistory: updatedHistory });
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

    // Atualiza o estoque e lastTaken se a dose foi tomada
    if (status === 'taken') {
      const updates: Partial<Medication> = {
        lastTaken: new Date().toISOString(),
      };
      
      if (med.stock > 0) {
        updates.stock = med.stock - 1;
      }
      
      await get().updateMedication(medicationId, updates);
    }
  },
}));

// ✅ Exportar alias para compatibilidade
export const useMedications = useMedicationStore;