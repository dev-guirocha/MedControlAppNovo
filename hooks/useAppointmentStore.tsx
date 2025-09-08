import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Appointment } from '@/types/medication';
import * as Crypto from 'expo-crypto';
import { APPOINTMENTS_KEY } from '../src/constants/keys'; 
import { showErrorToast } from '@/lib/toastHelper';

interface AppointmentState {
  appointments: Appointment[];
  // ✅ Removendo o estado de carregamento local
  loadAppointments: () => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
  // ✅ Removendo o estado de carregamento inicial
  
  loadAppointments: async () => {
    try {
      const storedAppointments = await AsyncStorage.getItem(APPOINTMENTS_KEY);
      if (storedAppointments) {
        set({ appointments: JSON.parse(storedAppointments) });
      }
    } catch (error) { 
      console.error('Error loading appointments:', error); 
    }
    // ✅ Removendo o set({ isLoadingAppointments: false })
  },
  
  addAppointment: async (appointmentData) => {
    // ...
    try {
      const updatedAppointments = [...get().appointments, newAppointment];
      set({ appointments: updatedAppointments });
      await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updatedAppointments));
    } catch (error) {
      console.error('Error adding appointment:', error);
      showErrorToast('Erro ao adicionar a consulta.'); // ✅ 2. Adicionar feedback de erro
    }
  },

  updateAppointment: async (id, updates) => {
    // ...
    try {
      set({ appointments: updatedAppointments });
      await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updatedAppointments));
    } catch (error) {
      console.error('Error updating appointment:', error);
      showErrorToast('Erro ao atualizar a consulta.'); // ✅ 2. Adicionar feedback de erro
    }
  },

  deleteAppointment: async (id) => {
    // ...
    try {
      set({ appointments: updatedAppointments });
      await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updatedAppointments));
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showErrorToast('Erro ao excluir a consulta.'); // ✅ 2. Adicionar feedback de erro
    }
  },
}));