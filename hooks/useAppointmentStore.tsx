import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment } from '@/types/medication';

const APPOINTMENTS_KEY = '@appointments';

interface AppointmentState {
  appointments: Appointment[];
  isLoadingAppointments: boolean;
  loadAppointments: () => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
  isLoadingAppointments: true,
  loadAppointments: async () => {
    try {
      const storedAppointments = await AsyncStorage.getItem(APPOINTMENTS_KEY);
      if (storedAppointments) {
        set({ appointments: JSON.parse(storedAppointments) });
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      set({ isLoadingAppointments: false });
    }
  },
  addAppointment: async (data) => {
    const newAppointment: Appointment = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updatedAppointments = [...get().appointments, newAppointment];
    set({ appointments: updatedAppointments });
    await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updatedAppointments));
  },
  deleteAppointment: async (id) => {
    const updatedAppointments = get().appointments.filter(app => app.id !== id);
    set({ appointments: updatedAppointments });
    await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updatedAppointments));
  },
}));