import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNotificationText,
  needsRescheduleOnPeopleChange,
  pickPersonColor,
  removePersonFromSnapshot,
  resolveActivePersonId,
  shouldShowPersonNames,
} from '../people';
import type { Person } from '@/types/medication';

const P = ['#111111', '#222222', '#333333'];
const pessoa = (id: string, color: string): Person => ({
  id,
  name: id,
  color,
  createdAt: '2026-11-15T10:00:00Z',
});
const a = pessoa('a', P[0]);
const b = pessoa('b', P[1]);

test('lembrete antecipado com pessoa', () => {
  assert.deepEqual(
    buildNotificationText({ kind: 'lead', personName: 'Mãe', medicationName: 'Losartana', time: '08:00', leadMinutes: 5 }),
    { title: 'Mãe: Losartana às 08:00', body: 'Em 5 min. Toque em Tomei quando der a dose.' },
  );
});

test('lembrete antecipado sem pessoa', () => {
  assert.deepEqual(
    buildNotificationText({ kind: 'lead', personName: null, medicationName: 'Losartana', time: '08:00', leadMinutes: 5 }),
    { title: 'Losartana às 08:00', body: 'Em 5 min. Toque em Tomei quando der a dose.' },
  );
});

test('lembrete na hora', () => {
  assert.deepEqual(
    buildNotificationText({ kind: 'now', personName: 'Mãe', medicationName: 'Losartana', time: '08:00' }),
    { title: 'Mãe: Losartana agora', body: 'Dose das 08:00. Toque em Tomei quando der a dose.' },
  );
  assert.equal(
    buildNotificationText({ kind: 'now', personName: null, medicationName: 'Losartana', time: '08:00' }).title,
    'Losartana agora',
  );
});

test('estoque baixo com e sem pessoa', () => {
  assert.deepEqual(
    buildNotificationText({ kind: 'stock', personName: 'Mãe', medicationName: 'Losartana', stock: 3 }),
    { title: 'Mãe: estoque baixo de Losartana', body: 'Restam 3 unidades.' },
  );
  assert.equal(
    buildNotificationText({ kind: 'stock', personName: null, medicationName: 'Losartana', stock: 3 }).title,
    'Estoque baixo de Losartana',
  );
});

test('pickPersonColor escolhe a primeira cor livre', () => {
  assert.equal(pickPersonColor([], P), P[0]);
  assert.equal(pickPersonColor([a], P), P[1]);
});

test('pickPersonColor reaproveita a paleta quando todas estão em uso', () => {
  const todas = P.map((c, i) => pessoa(String(i), c));
  assert.equal(pickPersonColor(todas, P), P[3 % P.length]);
});

test('resolveActivePersonId', () => {
  assert.equal(resolveActivePersonId([a, b], b.id), b.id);
  assert.equal(resolveActivePersonId([a, b], 'sumiu'), a.id);
  assert.equal(resolveActivePersonId([a, b], null), a.id);
  assert.equal(resolveActivePersonId([], 'x'), null);
});

test('shouldShowPersonNames só com 2 ou mais pessoas', () => {
  assert.equal(shouldShowPersonNames([a]), false);
  assert.equal(shouldShowPersonNames([a, b]), true);
});

test('removePersonFromSnapshot remove só os registros da pessoa e a chave da anamnese', () => {
  const med = (id: string, personId: string) => ({ id, personId }) as never;
  const dose = (id: string, personId: string) => ({ id, personId }) as never;
  const appt = (id: string, personId: string) => ({ id, personId }) as never;
  const result = removePersonFromSnapshot(
    {
      medications: [med('m1', 'a'), med('m2', 'b')],
      doseHistory: [dose('d1', 'a'), dose('d2', 'b')],
      appointments: [appt('c1', 'a'), appt('c2', 'b')],
      anamnesis: { a: { id: 'x' } as never, b: { id: 'y' } as never },
    },
    'b',
  );
  assert.deepEqual(result.medications.map((m) => m.id), ['m1']);
  assert.deepEqual(result.doseHistory.map((d) => d.id), ['d1']);
  assert.deepEqual(result.appointments.map((c) => c.id), ['c1']);
  assert.deepEqual(Object.keys(result.anamnesis as object), ['a']);
});

test('needsRescheduleOnPeopleChange', () => {
  assert.equal(needsRescheduleOnPeopleChange([a], [a, b]), true);
  assert.equal(needsRescheduleOnPeopleChange([a, b], [a]), true);
  assert.equal(needsRescheduleOnPeopleChange([a, b], [a, b]), false);
  assert.equal(needsRescheduleOnPeopleChange([a, b], [a, { ...b, name: 'Outro' }]), true);
  assert.equal(needsRescheduleOnPeopleChange([a, b], [a, { ...b, color: '#999999' }]), false);
  assert.equal(needsRescheduleOnPeopleChange([a], [{ ...a, name: 'Outro' }]), false);
});

test('resolveActivePersonId cai na primeira quando a ativa foi excluída', () => {
  assert.equal(resolveActivePersonId([a], b.id), a.id);
});
