import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as s from '../schedule';

// Casos usam construtores locais de Date (fuso do aparelho), como no app.
// Medicamentos parciais: só os campos que a agenda lê.
const m = (x: object) => x as any;

const sun = new Date(2026, 10, 15, 10, 0);

test('semanal só nos dias escolhidos', () => {
  const med = m({ frequency: 'semanal', times: ['08:00'], weekdays: [1, 4], createdAt: '2026-11-01T10:00:00Z' });
  assert.equal(s.isScheduledOnDate(med, sun), false);
  assert.equal(s.isScheduledOnDate(med, new Date(2026, 10, 16)), true);
  assert.equal(s.listDoseDates(med, new Date(2026, 10, 15), 7).length, 2);
});

test('semanal legado usa dia do cadastro', () => {
  const med = m({ frequency: 'semanal', times: ['08:00'], createdAt: new Date(2026, 10, 11, 9).toISOString() }); // quarta
  assert.deepEqual(s.getMedicationWeekdays(med), [3]);
});

test('diária todo dia', () => assert.equal(s.isScheduledOnDate(m({ frequency: 'diária', times: ['08:00'] }), sun), true));

test('a cada 8h atravessa meia-noite', () => assert.deepEqual(s.expandMedicationTimes(m({ frequency: 'a cada 8h', times: ['20:00'] })), ['04:00', '12:00', '20:00']));

test('a cada 12h', () => assert.deepEqual(s.expandMedicationTimes(m({ frequency: 'a cada 12h', times: ['21:30'] })), ['09:30', '21:30']));

test('lembrete 5 min antes, mesmo dia', () => assert.deepEqual(s.getReminderSlot('08:00', 5, 1), { hour: 7, minute: 55, weekday: 1 }));

test('lembrete de dose 00:02 recua o dia', () => {
  assert.deepEqual(s.getReminderSlot('00:02', 5, 1), { hour: 23, minute: 57, weekday: 0 });
  assert.deepEqual(s.getReminderSlot('00:02', 5, 0), { hour: 23, minute: 57, weekday: 6 });
  assert.deepEqual(s.getReminderSlot('00:02', 5, null), { hour: 23, minute: 57, weekday: null });
});

test('toque após meia-noite registra o dia certo', () => {
  const fired = new Date(2026, 10, 14, 23, 55); // lembrete da dose das 00:00 de 15/11
  const d = s.resolveDoseDateFromNotification('00:00', fired, 5);
  assert.equal(d!.getDate(), 15); assert.equal(d!.getHours(), 0);
  const fired2 = new Date(2026, 10, 15, 7, 55); // dose 08:00, tocou depois
  const d2 = s.resolveDoseDateFromNotification('08:00', fired2, 5);
  assert.equal(d2!.getDate(), 15); assert.equal(d2!.getHours(), 8);
  const fired3 = new Date(2026, 10, 15, 23, 50); // dose 23:55
  assert.equal(s.resolveDoseDateFromNotification('23:55', fired3, 5)!.getDate(), 15);
});

test('próxima dose semanal pula para o dia certo', () => {
  const med = m({ frequency: 'semanal', times: ['08:00'], weekdays: [3] });
  const d = s.getClosestScheduledDate(med, sun);
  assert.equal(d!.getDay(), 3); assert.equal(d!.getDate(), 18);
});

test('quando necessário sem agenda', () => assert.equal(s.getClosestScheduledDate(m({ frequency: 'quando necessário', times: ['08:00'] }), sun), null));

test('weekdays como string de params', () => assert.deepEqual(s.normalizeWeekdays('4,1,1,9'), [1, 4]));

test('tratamento encerrado não tem dose agendada', () => {
  const med = m({ frequency: 'diária', times: ['08:00'], endedAt: '2026-11-10T00:00:00Z' });
  assert.equal(s.isScheduledOnDate(med, sun), false);
  assert.deepEqual(s.listDoseDates(med, new Date(2026, 10, 15), 7), []);
});

test('mergeMedicationUpdate mantém personId e endedAt e aplica o resto', () => {
  const merged = s.mergeMedicationUpdate(m({ id: 'a', name: 'Velho', personId: 'p1', endedAt: 'X', createdAt: 'C' }), { name: 'Novo' });
  assert.equal(merged.personId, 'p1');
  assert.equal(merged.endedAt, 'X');
  assert.equal(merged.name, 'Novo');
});

test('mergeMedicationUpdate nunca troca personId, id nem createdAt', () => {
  const merged = s.mergeMedicationUpdate(m({ id: 'a', personId: 'p1', createdAt: 'C' }), { personId: 'p2', id: 'z', createdAt: 'D' } as any);
  assert.equal(merged.personId, 'p1');
  assert.equal(merged.id, 'a');
  assert.equal(merged.createdAt, 'C');
});
