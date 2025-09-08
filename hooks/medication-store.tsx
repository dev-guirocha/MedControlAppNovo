import { useMemo } from 'react';
import { useMedicationStore } from './useMedicationStore';
import { useDoseHistoryStore } from './useDoseHistoryStore';
import { Medication, ScheduledDose } from '@/types/medication';

export function useDoseSchedule(): ScheduledDose[] {
    const medications = useMedicationStore((state) => state.medications);
    const doseHistory = useDoseHistoryStore((state) => state.doseHistory);

    return useMemo(() => {
        const now = new Date();
        const allUpcomingDoses: ScheduledDose[] = [];

        // ✅ Criamos um conjunto com os IDs das doses já registradas para uma verificação rápida.
        const loggedDoseIds = new Set(doseHistory.map(h => h.id));

        for (const med of medications) {
            if (!med.times || med.times.length === 0) continue;

            // Lógica para gerar doses para as próximas semanas.
            // O ideal é expandir isso para tratar corretamente as diferentes frequências (semanal, etc.).
            for (let dayOffset = 0; dayOffset < 21; dayOffset++) {
                const targetDate = new Date(now);
                targetDate.setDate(now.getDate() + dayOffset);
                
                for (const time of med.times) {
                    const [hour, minute] = time.split(':').map(Number);
                    const doseTime = new Date(targetDate);
                    doseTime.setHours(hour, minute, 0, 0);

                    const doseId = `${med.id}-${doseTime.toISOString()}`;

                    // ✅ AQUI ESTÁ A MUDANÇA:
                    // Verificamos se a dose está no futuro E se ela AINDA NÃO foi registrada.
                    if (doseTime > now && !loggedDoseIds.has(doseId)) {
                        allUpcomingDoses.push({
                            ...med,
                            doseId: doseId,
                            scheduledTime: time,
                            scheduledDateTime: doseTime,
                            isToday: now.toDateString() === doseTime.toDateString(),
                        });
                    }
                }
            }
        }
        
        // Ordena as doses da mais próxima para a mais distante
        return allUpcomingDoses.sort((a, b) => a.scheduledDateTime.getTime() - b.scheduledDateTime.getTime());

    }, [medications, doseHistory]);
}