import type { DataSnapshot } from '@/lib/migration';
import type { Medication, Person } from '@/types/medication';

// Regras puras de pessoa (sem React Native nem stores) para poder testar fora do app.

export type ReminderKind = 'lead' | 'now' | 'stock';

/** Nomes de pessoa só aparecem na interface com 2 ou mais pessoas. */
export function shouldShowPersonNames(people: Person[]): boolean {
  return people.length >= 2;
}

/** Primeira cor da paleta ainda não usada; se todas estiverem em uso, recicla pela posição. */
export function pickPersonColor(people: Person[], palette: string[]): string {
  const used = new Set(people.map((p) => p.color));
  const free = palette.find((c) => !used.has(c));
  return free ?? palette[people.length % palette.length];
}

/** Pessoa ativa: a guardada se ainda existir, senão a primeira; null sem pessoas. */
export function resolveActivePersonId(people: Person[], storedId: string | null): string | null {
  if (people.length === 0) return null;
  if (storedId && people.some((p) => p.id === storedId)) return storedId;
  return people[0].id;
}

export function buildNotificationText(input: {
  kind: ReminderKind;
  personName: string | null;
  medicationName: string;
  time?: string;
  leadMinutes?: number;
  stock?: number;
}): { title: string; body: string } {
  const { kind, personName, medicationName, time, leadMinutes, stock } = input;
  const prefix = personName ? `${personName}: ` : '';
  const tapHint = 'Toque em Tomei quando der a dose.';

  if (kind === 'lead') {
    return { title: `${prefix}${medicationName} às ${time}`, body: `Em ${leadMinutes} min. ${tapHint}` };
  }
  if (kind === 'now') {
    return { title: `${prefix}${medicationName} agora`, body: `Dose das ${time}. ${tapHint}` };
  }
  const title = personName
    ? `${prefix}estoque baixo de ${medicationName}`
    : `Estoque baixo de ${medicationName}`;
  return { title, body: `Restam ${stock} unidades.` };
}

type PersonScopedSnapshot = Pick<DataSnapshot, 'medications' | 'doseHistory' | 'appointments' | 'anamnesis'>;

/** Dados que sobram depois de excluir uma pessoa (cascata); a anamnese é o mapa por pessoa. */
export function removePersonFromSnapshot(snapshot: PersonScopedSnapshot, personId: string): PersonScopedSnapshot {
  let anamnesis = snapshot.anamnesis;
  if (anamnesis && !('chronicConditions' in anamnesis)) {
    const { [personId]: _removed, ...rest } = anamnesis as Record<string, unknown>;
    anamnesis = rest as typeof anamnesis;
  }
  return {
    medications: snapshot.medications.filter((m) => m.personId !== personId),
    doseHistory: snapshot.doseHistory.filter((d) => d.personId !== personId),
    appointments: snapshot.appointments.filter((c) => c.personId !== personId),
    anamnesis,
  };
}

/** Reagendar notificações quando o prefixo de nome muda: cruzou 1↔2+ pessoas ou alguém foi renomeado. */
export function needsRescheduleOnPeopleChange(before: Person[], after: Person[]): boolean {
  if (shouldShowPersonNames(before) !== shouldShowPersonNames(after)) return true;
  // Com 1 pessoa não há prefixo de nome, então renomear não muda nenhuma notificação.
  if (!shouldShowPersonNames(after)) return false;
  return after.some((p) => {
    const previous = before.find((q) => q.id === p.id);
    return !!previous && previous.name !== p.name;
  });
}

/** Remédio da pessoa com esse nome (sem diferenciar maiúsculas nem espaços nas pontas). Nunca devolve remédio de outra pessoa. */
export function findMedicationForPerson(
  medications: Medication[],
  personId: string,
  name: string,
  options: { onlyActive?: boolean } = {},
): Medication | undefined {
  const wanted = name.trim().toLowerCase();
  return medications.find(
    (m) =>
      m.personId === personId &&
      m.name.trim().toLowerCase() === wanted &&
      (!options.onlyActive || !m.endedAt),
  );
}

/** Ano de nascimento: vazio é válido (opcional); senão 4 dígitos entre 1900 e o ano atual. */
export function parseBirthYear(text: string, currentYear = new Date().getFullYear()): { valid: boolean; value?: number } {
  const trimmed = text.trim();
  if (!trimmed) return { valid: true };
  if (!/^\d{4}$/.test(trimmed)) return { valid: false };
  const year = Number(trimmed);
  if (year < 1900 || year > currentYear) return { valid: false };
  return { valid: true, value: year };
}
