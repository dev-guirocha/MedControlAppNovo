import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import { createEnsureOnce, runDataMigration } from '@/lib/dataMigrationCore';
import { medicationColors } from '@/constants/theme';

/**
 * Adaptador fino: roda a migração v1 → v2 (várias pessoas) no AsyncStorage real.
 * A lógica (ordem de gravação, versão por último, retry) está em dataMigrationCore.ts.
 */
export const ensureDataMigrated = createEnsureOnce(() =>
  runDataMigration(AsyncStorage, {
    newId: () => Crypto.randomUUID(),
    now: () => new Date().toISOString(),
    palette: medicationColors,
  })
);
