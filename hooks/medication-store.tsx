import { useMemo } from 'react';
import { useMedicationStore } from './useMedicationStore';
import { useDoseHistoryStore } from './useDoseHistoryStore';
import { ScheduledDose } from '@/types/medication';
import { expandMedicationTimes, isScheduledOnDate, parseTime, toDayKey } from '@/lib/schedule';

export function useDoseSchedule(): ScheduledDose[] {
    const medications = useMedicationStore((state) => state.medications);
    const doseHistory = useDoseHistoryStore((state) => state.doseHistory);

    return useMemo(() => {
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayKey = toDayKey(today);
        const allTodaysDoses: ScheduledDose[] = [];
        const loggedDoseIds = new Set(
            doseHistory
                .map((h) => h.doseId ?? h.id)
                .filter((value): value is string => Boolean(value))
        );

        for (const med of medications) {
            // Semanal só aparece nos dias escolhidos; "quando necessário" nunca aparece.
            if (!med.times?.length || !isScheduledOnDate(med, today)) {
                continue;
            }

            const createdAt = med.createdAt ? new Date(med.createdAt) : null;

            for (const time of expandMedicationTimes(med)) {
                const parsed = parseTime(time);
                if (!parsed) continue;

                const doseTime = new Date(today);
                doseTime.setHours(parsed.h, parsed.m, 0, 0);

                // Dose de hoje anterior ao cadastro não conta como pendente.
                if (createdAt && !Number.isNaN(createdAt.getTime()) && createdAt.getTime() > doseTime.getTime()) {
                    continue;
                }

                const doseId = `${med.id}::${todayKey}::${time}`;
                if (loggedDoseIds.has(doseId)) continue;

                allTodaysDoses.push({
                    ...med,
                    doseId,
                    scheduledTime: time,
                    scheduledDateTime: doseTime,
                    isToday: true,
                    isMissed: doseTime < now,
                });
            }
        }

        return allTodaysDoses.sort((a, b) => {
            if (a.isMissed && !b.isMissed) return -1;
            if (!a.isMissed && b.isMissed) return 1;
            return a.scheduledDateTime.getTime() - b.scheduledDateTime.getTime();
        });
    }, [medications, doseHistory]);
}
