import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleMedicationNotifications, cancelMedicationNotifications, scheduleStockNotification, cleanupOrphanedMedicationNotifications } from '@/lib/notifications';
import { Medication, DoseHistory } from '@/types/medication';
import { useDoseHistoryStore } from './useDoseHistoryStore';
import { useMedicationSuggestionsStore } from './useMedicationSuggestionsStore';
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
      const parsedMedications: Medication[] = storedMeds ? JSON.parse(storedMeds) : [];
      set({ medications: parsedMedications });

      try {
        await cleanupOrphanedMedicationNotifications(parsedMedications);

        for (const medication of parsedMedications) {
          await scheduleMedicationNotifications(medication);
          await scheduleStockNotification(medication);
        }
      } catch (notificationError) {
        console.error('Error restoring medication notifications:', notificationError);
      }
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
      await useMedicationSuggestionsStore.getState().addSuggestion({
        name: newMed.name,
        dosage: newMed.dosage,
      });
    } catch (error) {
      console.error('Error adding medication:', error);
      showErrorToast('Erro ao adicionar o medicamento.');
      throw error;
    }

    try {
      await scheduleMedicationNotifications(newMed, { requestPermissions: true });
      await scheduleStockNotification(newMed, { requestPermissions: true });
    } catch (notificationError) {
      // The medication was already saved; notification failures should not surface as save failures.
      console.error('Error scheduling medication notifications:', notificationError);
    }

    try {
      return newMed;
    } catch {
      return newMed;
    }
  },

  updateMedication: async (id, updates) => {
    let toUpdate: Medication | undefined;
    const updatedMeds = get().medications.map(m => (m.id === id ? (toUpdate = { ...m, ...updates }) : m));
    try {
      set({ medications: updatedMeds });
      await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(updatedMeds));
    } catch (error) {
      console.error('Error updating medication:', error);
      showErrorToast('Erro ao atualizar o medicamento.');
      return;
    }

    if (toUpdate) {
      try {
        await scheduleMedicationNotifications(toUpdate, { requestPermissions: true });
        if (updates.stock !== undefined) {
          await scheduleStockNotification(toUpdate, { requestPermissions: true });
        }
      } catch (notificationError) {
        console.error('Error updating medication notifications:', notificationError);
      }
    }
  },

  deleteMedication: async (id) => {
    const updatedMeds = get().medications.filter(m => m.id !== id);
    try {
      set({ medications: updatedMeds });
      await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(updatedMeds));
      await useDoseHistoryStore.getState().removeEntriesByMedicationId(id);
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
    const previousEntry = useDoseHistoryStore
      .getState()
      .doseHistory.find((entry) => entry.doseId === doseId);

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

    const stockDelta = getStockDelta(previousEntry?.status, status);
    if (stockDelta === 0) {
      return;
    }

    // Reconciliar o estoque com base na transição real de status da dose.
    const updatedMed = {
      ...med,
      stock: Math.max(0, med.stock + stockDelta),
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

function getStockDelta(previousStatus: DoseHistory['status'] | undefined, nextStatus: 'taken' | 'skipped') {
  if (previousStatus === nextStatus) {
    return 0;
  }

  if (previousStatus === 'taken' && nextStatus === 'skipped') {
    return 1;
  }

  if ((previousStatus === undefined || previousStatus === 'pending' || previousStatus === 'skipped') && nextStatus === 'taken') {
    return -1;
  }

  return 0;
}
