import * as Crypto from 'expo-crypto';

import { useAnamnesisStore } from '@/hooks/useAnamnesisStore';
import { useAppointmentStore } from '@/hooks/useAppointmentStore';
import { useDoseHistoryStore } from '@/hooks/useDoseHistoryStore';
import { useMedicationStore } from '@/hooks/useMedicationStore';
import { usePeopleStore } from '@/hooks/usePeopleStore';
import { medicationColors } from '@/constants/theme';
import { cancelMedicationNotifications } from '@/lib/notifications';
import { needsRescheduleOnPeopleChange, pickPersonColor, removePersonFromSnapshot } from '@/lib/people';
import type { Anamnesis, Person, UserProfile } from '@/types/medication';

// Reagendar também dispensa as notificações já exibidas desses remédios; é aceitável.
async function rescheduleIfNeeded(before: Person[], after: Person[]) {
  if (needsRescheduleOnPeopleChange(before, after)) {
    await useMedicationStore.getState().rescheduleAll();
  }
}

export async function addPerson(
  input: Omit<Person, 'id' | 'createdAt' | 'color'> & { color?: string },
): Promise<Person> {
  const before = usePeopleStore.getState().people;
  const person: Person = {
    ...input,
    id: Crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    color: input.color ?? pickPersonColor(before, medicationColors),
  };
  const after = [...before, person];
  await usePeopleStore.getState().savePeople(after);
  await rescheduleIfNeeded(before, after);
  return person;
}

export async function updatePerson(
  id: string,
  updates: Partial<Omit<Person, 'id' | 'createdAt'>>,
): Promise<void> {
  const before = usePeopleStore.getState().people;
  const after = before.map((p) => (p.id === id ? { ...p, ...updates } : p));
  await usePeopleStore.getState().savePeople(after);
  await rescheduleIfNeeded(before, after);
}

export async function deletePerson(id: string): Promise<void> {
  const before = usePeopleStore.getState().people;
  if (before.length <= 1) throw new Error('Não é possível excluir a última pessoa.');
  const remainingPeople = before.filter((p) => p.id !== id);

  const medications = useMedicationStore.getState().medications;
  for (const medication of medications.filter((m) => m.personId === id)) {
    await cancelMedicationNotifications(medication.id);
  }

  const remaining = removePersonFromSnapshot(
    {
      medications,
      doseHistory: useDoseHistoryStore.getState().doseHistory,
      appointments: useAppointmentStore.getState().appointments,
      anamnesis: useAnamnesisStore.getState().anamnesisByPerson,
    },
    id,
  );
  await useMedicationStore.getState().replaceAll(remaining.medications);
  await useDoseHistoryStore.getState().replaceAll(remaining.doseHistory);
  await useAppointmentStore.getState().replaceAll(remaining.appointments);
  await useAnamnesisStore.getState().replaceAll(remaining.anamnesis as Record<string, Anamnesis>);

  // savePeople também re-resolve a pessoa ativa.
  await usePeopleStore.getState().savePeople(remainingPeople);
  await rescheduleIfNeeded(before, remainingPeople);
}

/** Espelha nome, ano de nascimento e sexo do perfil na pessoa marcada como "eu". */
export async function syncSelfPersonFromProfile(profile: UserProfile): Promise<void> {
  const self = usePeopleStore.getState().people.find((p) => p.isSelf);
  if (!self) return;
  await updatePerson(self.id, { name: profile.name, birthYear: profile.birthYear, gender: profile.gender });
}
