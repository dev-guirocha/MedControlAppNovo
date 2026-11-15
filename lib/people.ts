import type { Person } from '@/types/medication';

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
