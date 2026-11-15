import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Appointment } from '@/types/medication';
import { APPOINTMENTS_KEY } from '../src/constants/keys'; 
import { showErrorToast } from '@/lib/toastHelper';
import * as Crypto from 'expo-crypto';

interface AppointmentState {
  appointments: Appointment[];
  loadAppointments: () => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  /** Substitui a lista inteira (usado ao excluir uma pessoa). */
  replaceAll: (appointments: Appointment[]) => Promise<void>;
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
  
  loadAppointments: async () => {
    try {
      const storedAppointments = await AsyncStorage.getItem(APPOINTMENTS_KEY);
      if (storedAppointments) {
        set({ appointments: JSON.parse(storedAppointments) });
      }
    } catch (error) { 
      console.error('Error loading appointments:', error); 
    }
  },
  
  addAppointment: async (appointmentData) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: Crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    try {
      const updatedAppointments = [...get().appointments, newAppointment];
      set({ appointments: updatedAppointments });
      // ✅ CORREÇÃO: Usando a variável correta 'updatedAppointments'
      await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updatedAppointments));
    } catch (error) {
      console.error('Error adding appointment:', error);
      showErrorToast('Erro ao adicionar a consulta.');
    }
  },

  updateAppointment: async (id, updates) => {
    const updatedAppointments = get().appointments.map(a => 
      a.id === id ? { ...a, ...updates } : a
    );
    try {
      set({ appointments: updatedAppointments });
      await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updatedAppointments));
    } catch (error) {
      console.error('Error updating appointment:', error);
      showErrorToast('Erro ao atualizar a consulta.');
    }
  },

  replaceAll: async (appointments) => {
    try {
      set({ appointments });
      await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
    } catch (error) {
      console.error('Error replacing appointments:', error);
      showErrorToast('Erro ao salvar as consultas.');
    }
  },

  deleteAppointment: async (id) => {
    const updatedAppointments = get().appointments.filter(a => a.id !== id);
    try {
      set({ appointments: updatedAppointments });
      await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updatedAppointments));
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showErrorToast('Erro ao excluir a consulta.');
    }
  },
}));