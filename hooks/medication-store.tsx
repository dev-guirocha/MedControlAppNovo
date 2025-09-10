import { useMemo } from 'react';
import { useMedicationStore } from './useMedicationStore';
import { useDoseHistoryStore } from './useDoseHistoryStore';
import { Medication, ScheduledDose } from '@/types/medication';

export function useDoseSchedule(): ScheduledDose[] {
    const medications = useMedicationStore((state) => state.medications);
    const doseHistory = useDoseHistoryStore((state) => state.doseHistory);

    return useMemo(() => {
        const now = new Date();
        const allTodaysDoses: ScheduledDose[] = [];
        const loggedDoseIds = new Set(doseHistory.map(h => h.id));

        for (const med of medications) {
            if (med.frequency === 'quando necessário' || !med.times || med.times.length === 0) {
                continue;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let potentialTimes: string[] = [];

            // ✅ LÓGICA CENTRALIZADA COM SWITCH PARA CADA FREQUÊNCIA
            switch (med.frequency) {
                case 'diária':
                case 'semanal': // A lógica para 'semanal' é a mesma para um único dia.
                               // Poderia ser aprimorada para checar o dia da semana.
                    potentialTimes = med.times;
                    break;

                case 'a cada 12h':
                case 'a cada 8h':
                    const interval = med.frequency === 'a cada 12h' ? 12 : 8;
                    const firstTime = med.times[0];
                    const [startHour, startMinute] = firstTime.split(':').map(Number);
                    
                    let currentHour = startHour;
                    while (currentHour < 24) {
                        const hourString = currentHour.toString().padStart(2, '0');
                        const minuteString = startMinute.toString().padStart(2, '0');
                        potentialTimes.push(`${hourString}:${minuteString}`);
                        currentHour += interval;
                    }
                    break;
            }

            // Gera as doses com base nos horários calculados
            for (const time of potentialTimes) {
                const [hour, minute] = time.split(':').map(Number);
                const doseTime = new Date(today);
                doseTime.setHours(hour, minute);

                const doseId = `${med.id}-${doseTime.toISOString()}`;

                if (!loggedDoseIds.has(doseId)) {
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
        }
        
        return allTodaysDoses.sort((a, b) => {
            if (a.isMissed && !b.isMissed) return -1;
            if (!a.isMissed && b.isMissed) return 1;
            return a.scheduledDateTime.getTime() - b.scheduledDateTime.getTime();
        });

    }, [medications, doseHistory]);
}