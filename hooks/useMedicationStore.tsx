import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleMedicationNotifications, cancelMedicationNotifications, scheduleStockNotification, cleanupOrphanedMedicationNotifications } from '@/lib/notifications';
import { Medication, DoseHistory } from '@/types/medication';
import { useDoseHistoryStore } from './useDoseHistoryStore';
import { useMedicationSuggestionsStore } from './useMedicationSuggestionsStore';
import { usePeopleStore, getPersonName } from './usePeopleStore';
import { shouldShowPersonNames } from '@/lib/people';
import { mergeMedicationUpdate } from '@/lib/schedule';
import { MEDS_KEY } from '../src/constants/keys';
import { showErrorToast } from '@/lib/toastHelper';
import * as Crypto from 'expo-crypto';

/** Nome da pessoa para notificações: só aparece quando há 2+ pessoas. */
function resolvePersonName(medication: Medication): string | null {
  if (!shouldShowPersonNames(usePeopleStore.getState().people)) return null;
  return medication.personId ? getPersonName(medication.personId) : null;
}

interface MedicationState {
  medications: Medication[];
  loadMedications: () => Promise<void>;
  addMedication: (medication: Omit<Medication, 'id' | 'createdAt' | 'endedAt'>) => Promise<Medication>;
  updateMedication: (id: string, updates: Partial<Omit<Medication, 'id'>>) => Promise<void>;
  endMedication: (id: string) => Promise<void>;
  resumeMedication: (id: string) => Promise<void>;
  rescheduleAll: () => Promise<void>;
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
          // Só restaura os lembretes recorrentes. O alerta de estoque dispara na hora em que o
          // estoque muda (logDose/updateMedication); reagendá-lo aqui o repetia a cada abertura.
          if (medication.endedAt) {
            // Autocorrige um cancelamento que tenha falhado ao encerrar.
            await cancelMedicationNotifications(medication.id);
            continue;
          }
          await scheduleMedicationNotifications(medication, { personName: resolvePersonName(medication) });
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
      const personName = resolvePersonName(newMed);
      await scheduleMedicationNotifications(newMed, { requestPermissions: true, allowCatchUp: true, personName });
      await scheduleStockNotification(newMed, { requestPermissions: true, personName });
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
    const updatedMeds = get().medications.map(m => (m.id === id ? (toUpdate = mergeMedicationUpdate(m, updates)) : m));
    try {
      set({ medications: updatedMeds });
      await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(updatedMeds));
    } catch (error) {
      console.error('Error updating medication:', error);
      showErrorToast('Erro ao atualizar o medicamento.');
      return;
    }

    if (toUpdate && !toUpdate.endedAt) {
      try {
        const personName = resolvePersonName(toUpdate);
        await scheduleMedicationNotifications(toUpdate, { requestPermissions: true, allowCatchUp: true, personName });
        if (updates.stock !== undefined) {
          await scheduleStockNotification(toUpdate, { requestPermissions: true, personName });
        }
      } catch (notificationError) {
        console.error('Error updating medication notifications:', notificationError);
      }
    }
  },

  endMedication: async (id) => {
    const updatedMeds = get().medications.map(m => (m.id === id ? { ...m, endedAt: new Date().toISOString() } : m));
    try {
      set({ medications: updatedMeds });
      await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(updatedMeds));
    } catch (error) {
      console.error('Error ending medication:', error);
      showErrorToast('Erro ao encerrar o tratamento.');
      return;
    }

    try {
      // Também cancela o alerta de estoque.
      await cancelMedicationNotifications(id);
    } catch (notificationError) {
      console.error('Error cancelling medication notifications:', notificationError);
    }
  },

  resumeMedication: async (id) => {
    let resumed: Medication | undefined;
    const updatedMeds = get().medications.map(m => {
      if (m.id !== id) return m;
      const { endedAt: _endedAt, ...rest } = m;
      resumed = rest;
      return rest;
    });
    try {
      set({ medications: updatedMeds });
      await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(updatedMeds));
    } catch (error) {
      console.error('Error resuming medication:', error);
      showErrorToast('Erro ao retomar o tratamento.');
      return;
    }

    if (resumed) {
      try {
        const personName = resolvePersonName(resumed);
        await scheduleMedicationNotifications(resumed, { allowCatchUp: true, personName });
        await scheduleStockNotification(resumed, { personName });
      } catch (notificationError) {
        console.error('Error scheduling medication notifications:', notificationError);
      }
    }
  },

  // Reagenda os lembretes de todos (ex.: depois de renomear uma pessoa). Sem catch-up, sem
  // pedido de permissão e sem repetir alerta de estoque.
  rescheduleAll: async () => {
    for (const medication of get().medications) {
      try {
        if (medication.endedAt) {
          await cancelMedicationNotifications(medication.id);
          continue;
        }
        // O agendamento já cancela os lembretes anteriores do remédio.
        await scheduleMedicationNotifications(medication, { personName: resolvePersonName(medication) });
      } catch (notificationError) {
        console.error('Error rescheduling medication notifications:', notificationError);
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
      personId: med.personId,
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
      if (!updatedMed.endedAt) await scheduleStockNotification(updatedMed, { personName: resolvePersonName(updatedMed) });
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
