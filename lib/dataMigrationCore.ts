import { migrateToV2, type DataSnapshot, type MigrationDeps } from '@/lib/migration';
import type { UserProfile } from '@/types/medication';
import {
  ANAMNESIS_KEY,
  APPOINTMENTS_KEY,
  DATA_VERSION_KEY,
  DOSE_HISTORY_KEY,
  MEDS_KEY,
  PEOPLE_KEY,
  PROFILE_KEY,
} from '@/src/constants/keys';

// Núcleo puro da migração no armazenamento (sem React Native): o armazenamento é injetado.

export interface MigrationStorage {
  multiGet(keys: string[]): Promise<readonly (readonly [string, string | null])[]>;
  multiSet(pairs: [string, string][]): Promise<void>;
  setItem(key: string, value: string): Promise<void>;
}

function parseOr<T>(raw: string | null | undefined, fallback: T): T {
  // JSON ilegível em dado de usuário lança de propósito: melhor não gravar a versão
  // (e tentar de novo depois) do que migrar por cima de dados que não conseguimos ler.
  return raw ? (JSON.parse(raw) as T) : fallback;
}

/** Lê tudo, migra e grava as coleções primeiro e `@data_version` por último. */
export async function runDataMigration(storage: MigrationStorage, deps: MigrationDeps): Promise<void> {
  const entries = await storage.multiGet([
    DATA_VERSION_KEY,
    PROFILE_KEY,
    PEOPLE_KEY,
    MEDS_KEY,
    DOSE_HISTORY_KEY,
    APPOINTMENTS_KEY,
    ANAMNESIS_KEY,
  ]);
  const raw = new Map(entries.map(([k, v]) => [k, v]));

  const version = raw.get(DATA_VERSION_KEY) ?? null;
  // Qualquer versão conhecida >= 2 já está migrada (não rodar v2 sobre dados de versão futura).
  if (version !== null && Number(version) >= 2) return;

  // Perfil ilegível vira null: a migração cai na pessoa genérica 'Eu' se houver dados.
  let profile: UserProfile | null = null;
  try {
    profile = parseOr<UserProfile | null>(raw.get(PROFILE_KEY), null);
  } catch {
    profile = null;
  }

  const snapshot: DataSnapshot = {
    version,
    profile,
    people: parseOr(raw.get(PEOPLE_KEY), null),
    medications: parseOr(raw.get(MEDS_KEY), []),
    doseHistory: parseOr(raw.get(DOSE_HISTORY_KEY), []),
    appointments: parseOr(raw.get(APPOINTMENTS_KEY), []),
    anamnesis: parseOr(raw.get(ANAMNESIS_KEY), null),
  };

  const migrated = migrateToV2(snapshot, deps);

  await storage.multiSet([
    [PEOPLE_KEY, JSON.stringify(migrated.people)],
    [MEDS_KEY, JSON.stringify(migrated.medications)],
    [DOSE_HISTORY_KEY, JSON.stringify(migrated.doseHistory)],
    [APPOINTMENTS_KEY, JSON.stringify(migrated.appointments)],
    [ANAMNESIS_KEY, JSON.stringify(migrated.anamnesis)],
  ]);
  await storage.setItem(DATA_VERSION_KEY, '2');
}

/** Uma execução por runtime; se rejeitar, limpa a promise para permitir nova tentativa. */
export function createEnsureOnce(run: () => Promise<void>): () => Promise<void> {
  let promise: Promise<void> | null = null;
  return () => {
    if (!promise) {
      promise = run().catch((error) => {
        promise = null;
        throw error;
      });
    }
    return promise;
  };
}
