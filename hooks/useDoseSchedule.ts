import { useMemo } from 'react';
import { useMedicationStore } from './useMedicationStore';
import { useDoseHistoryStore } from './useDoseHistoryStore';
import type { ScheduledDose, Medication, DoseHistory } from '@/types';

type WeeklyMedication = Medication & { weekDays?: number[] };

export function useDoseSchedule(): ScheduledDose[] {
  const medications = useMedicationStore((s) => s.medications);
  const doseHistory = useDoseHistoryStore((s) => s.doseHistory as DoseHistory[]);

  return useMemo(() => {
    const now = new Date();

    // zera para “início do dia” local
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayKey = toLocalDayKey(today);

    // histórico já tomado/pulado neste dia
    const logged = new Set(
      doseHistory
        .map((h) => h.doseId ?? h.id)
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
    );

    const out: ScheduledDose[] = [];

    for (const med of medications) {
      // pula SOS (“quando necessário”) e itens sem horários
      if (med.frequency === 'quando necessário' || !med.times?.length) continue;

      // semanal: respeita weekDays (0=domingo ... 6=sábado), se existir
      if (med.frequency === 'semanal') {
        const w = (med as WeeklyMedication).weekDays;
        if (Array.isArray(w) && w.length > 0) {
          const weekday = today.getDay();
          if (!w.includes(weekday)) continue;
        }
      }

      const createdAt = med.createdAt ? new Date(med.createdAt) : null;
      const times = getTimesForFrequency(med);
      for (const time of times) {
        let dt = timeToDate(today, time);
        if (!dt) continue; // ignora horários inválidos

        let effectiveDayKey = dayKey;
        if (createdAt && !Number.isNaN(createdAt.getTime()) && createdAt.getTime() > dt.getTime()) {
          dt = new Date(dt.getTime());
          dt.setDate(dt.getDate() + 1);
          effectiveDayKey = toLocalDayKey(dt);
        }

        if (effectiveDayKey !== dayKey) {
          continue;
        }

        const doseId = `${med.id}::${effectiveDayKey}::${time}`;
        if (logged.has(doseId)) continue;

        out.push({
          ...med,
          doseId,
          scheduledTime: time,
          scheduledDateTime: dt,
          isToday: true,
          isMissed: dt < now,
        });
      }
    }

    // ordena: primeiro atrasadas (missed), depois por horário
    return out.sort((a, b) => {
      if (a.isMissed !== b.isMissed) return a.isMissed ? -1 : 1;
      return a.scheduledDateTime.getTime() - b.scheduledDateTime.getTime();
    });
  }, [medications, doseHistory]);
}

/** normaliza os horários definidos na medicação conforme a frequência */
function getTimesForFrequency(med: Medication): string[] {
  const baseTimes = dedupeAndSortTimes(med.times ?? []);

  switch (med.frequency) {
    case 'diária':
    case 'semanal':
      return baseTimes;

    case 'a cada 12h':
    case 'a cada 8h': {
      const interval = med.frequency === 'a cada 12h' ? 12 : 8;
      const first = baseTimes[0] ?? '08:00';
      const parsed = parseTime(first);
      if (!parsed) return baseTimes; // fallback seguro

      const { h: sh, m: sm } = parsed;
      const res: string[] = [];
      let h = sh;
      while (h < 24) {
        res.push(`${pad2(h)}:${pad2(sm)}`);
        h += interval;
      }
      return res;
    }

    default:
      return baseTimes;
  }
}

/** yyyy-mm-dd (local) */
function toLocalDayKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** 'HH:mm' -> Date no dia informado; retorna null se inválido */
function timeToDate(day: Date, hhmm: string): Date | null {
  const t = parseTime(hhmm);
  if (!t) return null;
  const dt = new Date(day);
  dt.setHours(t.h, t.m, 0, 0);
  return dt;
}

/** parse seguro de 'HH:mm' */
function parseTime(hhmm: string): { h: number; m: number } | null {
  const [hs, ms] = String(hhmm).split(':');
  const h = Number(hs);
  const m = Number(ms);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

/** ordena e remove duplicatas; também normaliza formato 0-pad */
function dedupeAndSortTimes(times: string[]): string[] {
  const norm = times
    .map(parseTime)
    .filter((t): t is { h: number; m: number } => !!t)
    .map(({ h, m }) => `${pad2(h)}:${pad2(m)}`);

  return Array.from(new Set(norm)).sort(); // ordenação lexicográfica funciona para HH:mm
}
