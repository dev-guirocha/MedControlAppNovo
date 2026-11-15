import * as Crypto from 'expo-crypto';

import { useAnamnesisStore } from '@/hooks/useAnamnesisStore';
import { useAppointmentStore } from '@/hooks/useAppointmentStore';
import { useDoseHistoryStore } from '@/hooks/useDoseHistoryStore';
import { useMedicationStore } from '@/hooks/useMedicationStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { usePeopleStore } from '@/hooks/usePeopleStore';
import { medicationColors } from '@/constants/theme';
import { cancelMedicationNotifications } from '@/lib/notifications';
import { needsRescheduleOnPeopleChange, pickPersonColor } from '@/lib/people';
import type { Person, UserProfile } from '@/types/medication';

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
  if (!before.some((p) => p.id === id)) throw new Error('Pessoa não encontrada.');
  const after = before.map((p) => (p.id === id ? { ...p, ...updates } : p));
  await usePeopleStore.getState().savePeople(after);
  await rescheduleIfNeeded(before, after);
  await mirrorSelfPersonToProfile(after.find((p) => p.id === id)!, updates);
}

/**
 * Pessoa "eu" editada em Pessoas: espelha nome/ano/sexo no UserProfile (a outra direção
 * é syncSelfPersonFromProfile). Anti-laço: só grava campos presentes em `updates` que
 * diferem do perfil atual, e usa skipPersonSync para o perfil não devolver o sync à pessoa.
 * Quando o sync vem do perfil, os valores já são iguais e nada é gravado.
 */
async function mirrorSelfPersonToProfile(
  person: Person,
  updates: Partial<Omit<Person, 'id' | 'createdAt'>>,
): Promise<void> {
  // `person` já é a versão atualizada: se deixou de ser isSelf (updates.isSelf === false), não espelha.
  if (!person.isSelf) return;
  const profile = useAuthStore.getState().userProfile;
  if (!profile) return;
  const changes: Partial<UserProfile> = {};
  if ('name' in updates && updates.name !== undefined && updates.name !== profile.name) changes.name = updates.name;
  if ('birthYear' in updates && updates.birthYear !== profile.birthYear) changes.birthYear = updates.birthYear;
  if ('gender' in updates && updates.gender !== profile.gender) changes.gender = updates.gender;
  if (Object.keys(changes).length === 0) return;
  await useAuthStore.getState().updateUserProfile(changes, { skipPersonSync: true });
}

export async function deletePerson(id: string): Promise<void> {
  const before = usePeopleStore.getState().people;
  if (!before.some((p) => p.id === id)) throw new Error('Pessoa não encontrada.');
  if (before.length <= 1) throw new Error('Não é possível excluir a última pessoa.');
  const remainingPeople = before.filter((p) => p.id !== id);

  for (const medication of useMedicationStore.getState().medications.filter((m) => m.personId === id)) {
    await cancelMedicationNotifications(medication.id);
  }

  // Cada store filtra o próprio estado atual na hora de gravar; qualquer falha propaga.
  await useMedicationStore.getState().removeByPersonId(id);
  await useDoseHistoryStore.getState().removeByPersonId(id);
  await useAppointmentStore.getState().removeByPersonId(id);
  await useAnamnesisStore.getState().removeByPersonId(id);

  // savePeople também re-resolve a pessoa ativa.
  await usePeopleStore.getState().savePeople(remainingPeople);
  await rescheduleIfNeeded(before, remainingPeople);
}

/** Espelha nome, ano de nascimento e sexo do perfil na pessoa marcada como "eu". */
export async function syncSelfPersonFromProfile(profile: UserProfile): Promise<void> {
  const self = usePeopleStore.getState().people.find((p) => p.isSelf);
  if (!self) return;
  // Só campos definidos: o perfil recriado no onboarding não apaga ano/gênero da pessoa.
  const updates: Partial<Pick<Person, 'name' | 'birthYear' | 'gender'>> = { name: profile.name };
  if (profile.birthYear !== undefined) updates.birthYear = profile.birthYear;
  if (profile.gender !== undefined) updates.gender = profile.gender;
  await updatePerson(self.id, updates);
}
