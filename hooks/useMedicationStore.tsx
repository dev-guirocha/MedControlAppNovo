import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleMedicationNotifications, cancelMedicationNotifications, scheduleStockNotification } from '@/lib/notifications';
import { Medication, DoseHistory } from '@/types/medication';
import { useDoseHistoryStore } from './useDoseHistoryStore';
import { MEDS_KEY } from '../src/constants/keys';
import { showErrorToast } from '@/lib/toastHelper';
import * as Crypto from 'expo-crypto';

interface MedicationState {
  medications: Medication[];
  loadMedications: () => Promise<void>;
  addMedication: (medication: Omit<Medication, 'id' | 'createdAt'>) => Promise<Medication>;
  updateMedication: (id: string, updates: Partial<Omit<Medication, 'id'>>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  logDose: (medicationId: string, scheduledTime: Date, status: 'taken' | 'skipped') => Promise<void>;
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medications: [],
  
  loadMedications: async () => {
    try {
      const storedMeds = await AsyncStorage.getItem(MEDS_KEY);
      if (storedMeds) set({ medications: JSON.parse(storedMeds) });
    } catch (error) {
      console.error('Error loading meds:', error);
    }
  },

  addMedication: async (data) => {
    const newMed: Medication = { ...data, id: Crypto.randomUUID(), createdAt: new Date().toISOString() };
    try {
      const updatedMeds = [...get().medications, newMed];
      set({ medications: updatedMeds });
      await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(updatedMeds));
      await scheduleMedicationNotifications(newMed);
      await scheduleStockNotification(newMed);
      return newMed;
    } catch (error) {
      console.error('Error adding medication:', error);
      showErrorToast('Erro ao adicionar o medicamento.');
      // No caso de erro, retornamos o objeto original sem ID para evitar que a UI quebre
      return { ...data, id: '', createdAt: '' };
    }
  },

  updateMedication: async (id, updates) => {
    let toUpdate: Medication | undefined;
    const updatedMeds = get().medications.map(m => (m.id === id ? (toUpdate = { ...m, ...updates }) : m));
    try {
      set({ medications: updatedMeds });
      await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(updatedMeds));
      if (toUpdate) {
        await scheduleMedicationNotifications(toUpdate);
        if (updates.stock !== undefined) {
          await scheduleStockNotification(toUpdate);
        }
      }
    } catch (error) {
      console.error('Error updating medication:', error);
      showErrorToast('Erro ao atualizar o medicamento.');
    }
  },

  deleteMedication: async (id) => {
    const updatedMeds = get().medications.filter(m => m.id !== id);
    try {
      set({ medications: updatedMeds });
      await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(updatedMeds));
      await cancelMedicationNotifications(id);
    } catch (error) {
      console.error('Error deleting medication:', error);
      showErrorToast('Erro ao excluir o medicamento.');
    }
  },

  // ✅ FUNÇÃO logDose TOTALMENTE REFATORADA
  logDose: async (medicationId: string, scheduledTime: Date, status: 'taken' | 'skipped') => {
    const medications = get().medications;
    const medIndex = medications.findIndex(m => m.id === medicationId);
    if (medIndex === -1) {
      console.error('Medication not found for logging dose:', medicationId);
      return;
    }
    const med = medications[medIndex];

    // 1. Criar e salvar a entrada no histórico primeiro
    const dayKey = `${scheduledTime.getFullYear()}-${String(scheduledTime.getMonth() + 1).padStart(2, '0')}-${String(
      scheduledTime.getDate()
    ).padStart(2, '0')}`;
    const timeKey = `${String(scheduledTime.getHours()).padStart(2, '0')}:${String(scheduledTime.getMinutes()).padStart(2, '0')}`;
    const doseId = `${medicationId}::${dayKey}::${timeKey}`;

    const newEntry: DoseHistory = {
      id: `${medicationId}-${scheduledTime.toISOString()}`,
      doseId,
      medicationId: medicationId,
      medicationName: med.name,
      scheduledTime: scheduledTime.toISOString(),
      status,
      takenTime: status === 'taken' ? new Date().toISOString() : undefined,
    };
    await useDoseHistoryStore.getState().addDoseEntry(newEntry);

    // Se a dose foi apenas pulada, não há necessidade de atualizar o medicamento
    if (status === 'skipped') {
      return;
    }

    // 2. Se a dose foi tomada, calcular o novo estado do medicamento
    const updatedMed = {
      ...med,
      stock: med.stock > 0 ? med.stock - 1 : 0,
    };
    const updatedMeds = [...medications];
    updatedMeds[medIndex] = updatedMed;

    // 3. Atualizar o estado e persistir os dados
    try {
      set({ medications: updatedMeds });
      await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(updatedMeds));
      // 4. Disparar a verificação de notificação de estoque
      await scheduleStockNotification(updatedMed);
    } catch (error) {
      console.error('Error saving medication after logging dose:', error);
      showErrorToast('Erro ao atualizar o estoque do medicamento.');
    }
  },
}));
