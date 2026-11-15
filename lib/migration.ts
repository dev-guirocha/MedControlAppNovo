import type {
  Anamnesis,
  Appointment,
  DoseHistory,
  Medication,
  Person,
  UserProfile,
} from '@/types/medication';
import { pickPersonColor } from '@/lib/people';

// Migração pura v1 → v2 (várias pessoas). Sem React Native nem stores.

export interface DataSnapshot {
  version: string | null;
  profile: UserProfile | null;
  people: Person[] | null;
  medications: Medication[];
  doseHistory: DoseHistory[];
  appointments: Appointment[];
  anamnesis: Anamnesis | Record<string, Anamnesis> | null;
}

export interface MigrationDeps {
  newId: () => string;
  now: () => string;
  palette: string[];
}

export type MigratedSnapshot = DataSnapshot & {
  version: '2';
  people: Person[];
  anamnesis: Record<string, Anamnesis>;
};

/** A anamnese antiga era um único objeto (tem `chronicConditions`); a nova é um mapa por pessoa. */
function isOldAnamnesis(value: unknown): value is Anamnesis {
  return !!value && typeof value === 'object' && 'chronicConditions' in value;
}

export function migrateToV2(snapshot: DataSnapshot, deps: MigrationDeps): MigratedSnapshot {
  let people: Person[] = snapshot.people ?? [];

  // version '2' nunca cria pessoa de propósito (quem apagou todas não deve ser recriado;
  // a Task 3 nem chama a função nesse caso).
  const hasV1Data =
    snapshot.medications.length > 0 ||
    snapshot.doseHistory.length > 0 ||
    snapshot.appointments.length > 0 ||
    snapshot.anamnesis !== null;

  if (people.length === 0 && snapshot.version !== '2' && (snapshot.profile || hasV1Data)) {
    const { profile } = snapshot;
    // Sem perfil mas com dados (ex.: perfil ilegível): pessoa genérica 'Eu', sem isSelf,
    // para não perder nem deixar sem dono os registros. Sem perfil e sem dados: onboarding cria.
    people = [
      profile
        ? {
            id: deps.newId(),
            name: profile.name,
            color: pickPersonColor([], deps.palette),
            birthYear: profile.birthYear,
            gender: profile.gender,
            ...(profile.type === 'patient' ? { isSelf: true } : {}),
            createdAt: deps.now(),
          }
        : {
            id: deps.newId(),
            name: 'Eu',
            color: pickPersonColor([], deps.palette),
            createdAt: deps.now(),
          },
    ];
  }

  const firstId = people[0]?.id;
  const validIds = new Set(people.map((p) => p.id));
  const withPerson = <T extends { personId?: string }>(record: T): T =>
    firstId && !(record.personId && validIds.has(record.personId))
      ? { ...record, personId: firstId }
      : record;

  let anamnesis: Record<string, Anamnesis> = {};
  if (isOldAnamnesis(snapshot.anamnesis)) {
    if (firstId) anamnesis = { [firstId]: snapshot.anamnesis };
  } else if (snapshot.anamnesis) {
    anamnesis = snapshot.anamnesis;
  }

  return {
    ...snapshot,
    version: '2',
    people,
    medications: snapshot.medications.map(withPerson),
    doseHistory: snapshot.doseHistory.map(withPerson),
    appointments: snapshot.appointments.map(withPerson),
    anamnesis,
  };
}
