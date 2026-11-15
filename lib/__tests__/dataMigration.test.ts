import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEnsureOnce, runDataMigration, type MigrationStorage } from '../dataMigrationCore';

const deps = { newId: () => 'p1', now: () => '2026-11-15T10:00:00Z', palette: ['#111111'] };

function fakeStorage(initial: Record<string, string>, opts: { failMultiSet?: () => boolean } = {}) {
  const data = new Map(Object.entries(initial));
  const log: string[] = [];
  const storage: MigrationStorage = {
    multiGet: async (keys) => keys.map((k) => [k, data.get(k) ?? null] as const),
    multiSet: async (pairs) => {
      if (opts.failMultiSet?.()) throw new Error('disco cheio');
      for (const [k, v] of pairs) {
        data.set(k, v);
        log.push(k);
      }
    },
    setItem: async (k, v) => {
      data.set(k, v);
      log.push(k);
    },
  };
  return { storage, data, log };
}

const v1Data = {
  '@user_profile': JSON.stringify({ id: 'u', name: 'Ana', type: 'patient' }),
  '@medications': JSON.stringify([{ id: 'm1' }]),
};

test('grava as coleções antes e @data_version por último', async () => {
  const { storage, data, log } = fakeStorage(v1Data);
  await runDataMigration(storage, deps);
  assert.equal(log[log.length - 1], '@data_version');
  assert.equal(log.filter((k) => k === '@data_version').length, 1);
  assert.ok(log.indexOf('@medications') < log.indexOf('@data_version'));
  assert.equal(data.get('@data_version'), '2');
  assert.equal(JSON.parse(data.get('@medications')!)[0].personId, 'p1');
});

test('versão 2 (ou maior) não grava nada', async () => {
  for (const v of ['2', '3']) {
    const { storage, log } = fakeStorage({ ...v1Data, '@data_version': v });
    await runDataMigration(storage, deps);
    assert.deepEqual(log, []);
  }
});

test('multiSet rejeitando não grava a versão e a próxima chamada tenta de novo', async () => {
  let fail = true;
  const { storage, data } = fakeStorage(v1Data, { failMultiSet: () => fail });
  const ensure = createEnsureOnce(() => runDataMigration(storage, deps));
  await assert.rejects(ensure(), /disco cheio/);
  assert.equal(data.has('@data_version'), false);
  fail = false;
  await ensure();
  assert.equal(data.get('@data_version'), '2');
});

test('ensure executa uma única vez quando tem sucesso', async () => {
  let runs = 0;
  const ensure = createEnsureOnce(async () => {
    runs++;
  });
  await Promise.all([ensure(), ensure()]);
  await ensure();
  assert.equal(runs, 1);
});
