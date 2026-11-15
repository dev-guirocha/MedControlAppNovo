import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrateToV2, type DataSnapshot } from '../migration';
import type { Anamnesis, Appointment, DoseHistory, Medication, UserProfile } from '@/types/medication';

const palette = ['#111111', '#222222'];
const deps = () => ({ newId: () => 'p1', now: () => '2026-11-15T10:00:00Z', palette });

const profile = (type: UserProfile['type'] = 'patient'): UserProfile => ({
  id: 'u',
  name: 'Ana',
  type,
  createdAt: '2026-01-01T00:00:00Z',
  onboardingCompleted: true,
  birthYear: 1980,
  gender: 'female',
});
const med = (id: string, extra: Partial<Medication> = {}) => ({ id, name: id, ...extra }) as Medication;
const dose = (id: string, medicationId: string, extra: Partial<DoseHistory> = {}) =>
  ({ id, medicationId, ...extra }) as DoseHistory;
const consulta = { id: 'c1' } as Appointment;
const anamnese = { id: 'an', chronicConditions: ['x'] } as unknown as Anamnesis;

const v1 = (type: UserProfile['type'] = 'patient'): DataSnapshot => ({
  version: null,
  profile: profile(type),
  people: null,
  medications: [med('m1'), med('m2')],
  doseHistory: [dose('d1', 'm1'), dose('d2', 'm2'), dose('d3', 'm1')],
  appointments: [consulta],
  anamnesis: anamnese,
});

test('migra paciente: 1 pessoa, registros e anamnese vinculados', () => {
  const r = migrateToV2(v1(), deps());
  assert.equal(r.version, '2');
  assert.deepEqual(r.people, [
    { id: 'p1', name: 'Ana', color: palette[0], birthYear: 1980, gender: 'female', isSelf: true, createdAt: '2026-11-15T10:00:00Z' },
  ]);
  for (const x of [...r.medications, ...r.doseHistory, ...r.appointments]) assert.equal(x.personId, 'p1');
  assert.deepEqual(r.anamnesis, { p1: anamnese });
});

test('cuidador: pessoa sem isSelf', () => {
  const r = migrateToV2(v1('caregiver'), deps());
  assert.equal(r.people[0].name, 'Ana');
  assert.equal('isSelf' in r.people[0], false);
});

test('idempotente', () => {
  const once = migrateToV2(v1(), deps());
  let n = 0;
  const twice = migrateToV2(once, { ...deps(), newId: () => `novo${n++}` });
  assert.deepEqual(twice, once);
  assert.equal(twice.people.length, 1);
});

test('instalação nova (sem perfil): nenhuma pessoa criada', () => {
  const r = migrateToV2(
    { version: null, profile: null, people: null, medications: [], doseHistory: [], appointments: [], anamnesis: null },
    deps(),
  );
  assert.deepEqual(r.people, []);
  assert.deepEqual(r.medications, []);
  assert.deepEqual(r.anamnesis, {});
  assert.equal(r.version, '2');
});

test('dose de remédio excluído (órfã) recebe a pessoa 1', () => {
  const s = v1();
  s.doseHistory = [dose('d9', 'excluido')];
  assert.equal(migrateToV2(s, deps()).doseHistory[0].personId, 'p1');
});

test('registros com personId válido não mudam; inválido vai pra pessoa 1', () => {
  const once = migrateToV2(v1(), deps());
  const outra = { ...once.people[0], id: 'p2', name: 'Mãe' };
  const s: DataSnapshot = {
    ...once,
    people: [once.people[0], outra],
    medications: [med('a', { personId: 'p2' }), med('b', { personId: 'fantasma' })],
  };
  const r = migrateToV2(s, deps());
  assert.equal(r.medications[0].personId, 'p2');
  assert.equal(r.medications[1].personId, 'p1');
  assert.equal(r.people.length, 2);
});

test('anamnese nula vira {}', () => {
  const s = v1();
  s.anamnesis = null;
  assert.deepEqual(migrateToV2(s, deps()).anamnesis, {});
});

test('sem perfil mas com dados v1: pessoa "Eu" sem isSelf recebe tudo', () => {
  const r = migrateToV2(
    {
      version: null,
      profile: null,
      people: null,
      medications: [med('m1')],
      doseHistory: [dose('d1', 'm1')],
      appointments: [],
      anamnesis: anamnese,
    },
    deps(),
  );
  assert.equal(r.version, '2');
  assert.equal(r.people.length, 1);
  assert.equal(r.people[0].name, 'Eu');
  assert.equal('isSelf' in r.people[0], false);
  assert.equal(r.medications[0].personId, 'p1');
  assert.equal(r.doseHistory[0].personId, 'p1');
  assert.deepEqual(r.anamnesis, { p1: anamnese });
});

test('dose gravada por task entre leitura e migração (sem personId) ganha a pessoa 1', () => {
  const snap = v1();
  snap.doseHistory = [...snap.doseHistory, dose('d-task', 'm1')];
  const r = migrateToV2(snap, deps());
  assert.equal(r.doseHistory.find((d) => d.id === 'd-task')?.personId, 'p1');
});
