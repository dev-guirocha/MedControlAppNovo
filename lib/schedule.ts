import type { Medication } from '@/types/medication';

// Regras de agenda compartilhadas por Home, detalhes e notificações.
// Arquivo puro (sem React Native) para poder ser testado fora do app.

type ScheduleFields = Pick<Medication, 'frequency' | 'times' | 'createdAt'> & { weekdays?: number[] };

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function parseTime(time: string): { h: number; m: number } | null {
  const [hours, minutes] = String(time).split(':').map((part) => Number(part));
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return { h: hours, m: minutes };
}

export function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Normaliza a lista de dias (0 = domingo … 6 = sábado), sem repetição e ordenada. */
export function normalizeWeekdays(value: unknown): number[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  const parsed = raw
    .map((item) => Number(item))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  return Array.from(new Set(parsed)).sort((a, b) => a - b);
}

/**
 * Dias da semana em que um medicamento semanal é tomado.
 * Cadastros antigos (antes do campo `weekdays`) caem no dia da semana em que foram criados.
 */
export function getMedicationWeekdays(medication: ScheduleFields): number[] {
  const weekdays = normalizeWeekdays(medication.weekdays);
  if (weekdays.length > 0) return weekdays;

  const createdAt = medication.createdAt ? new Date(medication.createdAt) : null;
  if (createdAt && !Number.isNaN(createdAt.getTime())) return [createdAt.getDay()];
  return [new Date().getDay()];
}

/** Horários do dia em que há dose. "A cada Xh" cobre as 24h a partir do primeiro horário, inclusive depois da meia-noite. */
export function expandMedicationTimes(medication: ScheduleFields): string[] {
  const parsed = (medication.times ?? [])
    .map(parseTime)
    .filter((value): value is { h: number; m: number } => value !== null);

  if (medication.frequency === 'a cada 8h' || medication.frequency === 'a cada 12h') {
    const first = parsed[0];
    if (!first) return [];
    const interval = medication.frequency === 'a cada 12h' ? 12 : 8;
    const result: string[] = [];
    for (let offset = 0; offset < 24; offset += interval) {
      result.push(formatTime((first.h + offset) % 24, first.m));
    }
    return Array.from(new Set(result)).sort();
  }

  return Array.from(new Set(parsed.map(({ h, m }) => formatTime(h, m)))).sort();
}

export function isScheduledOnDate(medication: ScheduleFields, date: Date): boolean {
  if (medication.frequency === 'quando necessário') return false;
  if (medication.frequency === 'semanal') {
    return getMedicationWeekdays(medication).includes(date.getDay());
  }
  return true;
}

/** Datas de dose num intervalo de dias a partir de `fromDay` (inclusive), em ordem. */
export function listDoseDates(medication: ScheduleFields, fromDay: Date, days: number): Date[] {
  const times = expandMedicationTimes(medication);
  const result: Date[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const day = new Date(fromDay);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + offset);
    if (!isScheduledOnDate(medication, day)) continue;
    for (const time of times) {
      const { h, m } = parseTime(time)!;
      const date = new Date(day);
      date.setHours(h, m, 0, 0);
      result.push(date);
    }
  }
  return result.sort((a, b) => a.getTime() - b.getTime());
}

/** Próxima dose a partir de agora; se não houver na próxima semana, a mais recente. */
export function getClosestScheduledDate(medication: ScheduleFields, now = new Date()): Date | null {
  if (medication.frequency === 'quando necessário') return null;
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  const candidates = listDoseDates(medication, start, 15);
  if (candidates.length === 0) return null;
  const upcoming = candidates.find((candidate) => candidate.getTime() >= now.getTime());
  if (upcoming) return upcoming;
  return candidates[candidates.length - 1];
}

/**
 * Converte um horário de dose em gatilho de lembrete `leadMinutes` antes.
 * Quando o lembrete cai no dia anterior (dose logo após a meia-noite), o dia da semana recua junto.
 * `weekday` segue o padrão JS (0 = domingo); null significa todo dia.
 */
export function getReminderSlot(time: string, leadMinutes: number, weekday: number | null) {
  const parsed = parseTime(time);
  if (!parsed) return null;
  const total = parsed.h * 60 + parsed.m - leadMinutes;
  const dayShift = Math.floor(total / (24 * 60));
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return {
    hour: Math.floor(normalized / 60),
    minute: normalized % 60,
    weekday: weekday === null ? null : (((weekday + dayShift) % 7) + 7) % 7,
  };
}

/**
 * Descobre a qual dose uma notificação se refere, a partir do instante em que ela foi disparada.
 * Escolhe a ocorrência de `time` mais próxima de (disparo + antecedência), o que acerta o dia
 * mesmo quando o lembrete toca antes da meia-noite ou o usuário toca nele no dia seguinte.
 */
export function resolveDoseDateFromNotification(time: string, firedAt: Date, leadMinutes: number): Date | null {
  const parsed = parseTime(time);
  if (!parsed) return null;
  const anchor = new Date(firedAt.getTime() + leadMinutes * 60 * 1000);
  let best: Date | null = null;
  for (const offset of [-1, 0, 1]) {
    const candidate = new Date(anchor);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(parsed.h, parsed.m, 0, 0);
    if (!best || Math.abs(candidate.getTime() - anchor.getTime()) < Math.abs(best.getTime() - anchor.getTime())) {
      best = candidate;
    }
  }
  return best;
}
