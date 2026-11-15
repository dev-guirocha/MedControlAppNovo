import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import { migrateToV2, type DataSnapshot } from '@/lib/migration';
import { medicationColors } from '@/constants/theme';
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

/**
 * Executa a migração v1 → v2 (várias pessoas) no AsyncStorage.
 * Coleções migradas são gravadas primeiro e `@data_version` por último: se o processo
 * morrer no meio, a próxima execução refaz (a migração é idempotente).
 */

let migrationPromise: Promise<void> | null = null;

function parseOr<T>(raw: string | null, fallback: T): T {
  // JSON ilegível em dado de usuário lança de propósito: melhor não gravar a versão
  // (e tentar de novo depois) do que migrar por cima de dados que não conseguimos ler.
  return raw ? (JSON.parse(raw) as T) : fallback;
}

async function runMigration(): Promise<void> {
  const [version, profileRaw, peopleRaw, medsRaw, historyRaw, appointmentsRaw, anamnesisRaw] =
    await Promise.all([
      AsyncStorage.getItem(DATA_VERSION_KEY),
      AsyncStorage.getItem(PROFILE_KEY),
      AsyncStorage.getItem(PEOPLE_KEY),
      AsyncStorage.getItem(MEDS_KEY),
      AsyncStorage.getItem(DOSE_HISTORY_KEY),
      AsyncStorage.getItem(APPOINTMENTS_KEY),
      AsyncStorage.getItem(ANAMNESIS_KEY),
    ]);

  if (version === '2') return;

  // Perfil ilegível vira null: a migração cai na pessoa genérica 'Eu' se houver dados.
  let profile: UserProfile | null = null;
  try {
    profile = parseOr<UserProfile | null>(profileRaw, null);
  } catch {
    profile = null;
  }

  const snapshot: DataSnapshot = {
    version,
    profile,
    people: parseOr(peopleRaw, null),
    medications: parseOr(medsRaw, []),
    doseHistory: parseOr(historyRaw, []),
    appointments: parseOr(appointmentsRaw, []),
    anamnesis: parseOr(anamnesisRaw, null),
  };

  const migrated = migrateToV2(snapshot, {
    newId: () => Crypto.randomUUID(),
    now: () => new Date().toISOString(),
    palette: medicationColors,
  });

  await AsyncStorage.multiSet([
    [PEOPLE_KEY, JSON.stringify(migrated.people)],
    [MEDS_KEY, JSON.stringify(migrated.medications)],
    [DOSE_HISTORY_KEY, JSON.stringify(migrated.doseHistory)],
    [APPOINTMENTS_KEY, JSON.stringify(migrated.appointments)],
    [ANAMNESIS_KEY, JSON.stringify(migrated.anamnesis)],
  ]);
  await AsyncStorage.setItem(DATA_VERSION_KEY, '2');
}

/** Garante a migração uma vez por runtime JS; se falhar, permite nova tentativa depois. */
export function ensureDataMigrated(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = runMigration().catch((error) => {
      migrationPromise = null;
      throw error;
    });
  }
  return migrationPromise;
}
