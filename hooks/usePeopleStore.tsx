import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { resolveActivePersonId } from '@/lib/people';
import { showErrorToast } from '@/lib/toastHelper';
import type { Person } from '@/types/medication';
import { ACTIVE_PERSON_KEY, PEOPLE_KEY } from '../src/constants/keys';

interface PeopleState {
  people: Person[];
  activePersonId: string | null;
  loadPeople: () => Promise<void>;
  setActivePerson: (id: string) => Promise<void>;
  savePeople: (next: Person[]) => Promise<void>;
}

export const usePeopleStore = create<PeopleState>((set, get) => ({
  people: [],
  activePersonId: null,

  loadPeople: async () => {
    try {
      const [storedPeople, storedActive] = await Promise.all([
        AsyncStorage.getItem(PEOPLE_KEY),
        AsyncStorage.getItem(ACTIVE_PERSON_KEY),
      ]);
      const people: Person[] = storedPeople ? JSON.parse(storedPeople) : [];
      set({ people, activePersonId: resolveActivePersonId(people, storedActive) });
    } catch (error) {
      console.error('Error loading people:', error);
    }
  },

  setActivePerson: async (id) => {
    const activePersonId = resolveActivePersonId(get().people, id);
    set({ activePersonId });
    try {
      if (activePersonId) await AsyncStorage.setItem(ACTIVE_PERSON_KEY, activePersonId);
    } catch (error) {
      console.error('Error saving active person:', error);
    }
  },

  savePeople: async (next) => {
    try {
      await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(next));
      set({ people: next, activePersonId: resolveActivePersonId(next, get().activePersonId) });
    } catch (error) {
      console.error('Error saving people:', error);
      showErrorToast('Erro ao salvar as pessoas.');
    }
  },
}));

/** Nome da pessoa para textos (notificações etc.); null se não existir. */
export function getPersonName(personId: string): string | null {
  return usePeopleStore.getState().people.find((p) => p.id === personId)?.name ?? null;
}
