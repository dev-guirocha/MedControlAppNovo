// hooks/medication-store.tsx
import { useMemo } from 'react';
import { useMedicationStore } from './useMedicationStore';
import { Medication } from '@/types/medication';

export const useMedications = useMedicationStore;
// Estendemos o tipo Medication para incluir dados específicos da dose agendada
export type ScheduledDose = Medication & {
  doseId: string;
  scheduledTime: string;
  scheduledDateTime: Date;
  isToday: boolean;
};

export function useDoseSchedule(): ScheduledDose[] {
    const medications = useMedicationStore((state) => state.medications);

    return useMemo(() => {
        const now = new Date();
        const allUpcomingDoses: ScheduledDose[] = [];

        for (const med of medications) {
            if (!med.times || med.times.length === 0) continue;

            // Lógica para hoje e amanhã
            for (let i = 0; i < 2; i++) {
                const targetDate = new Date(now);
                targetDate.setDate(now.getDate() + i);

                for (const time of med.times) {
                    const [hour, minute] = time.split(':').map(Number);
                    const doseTime = new Date(targetDate);
                    doseTime.setHours(hour, minute, 0, 0);

                    if (doseTime > now) {
                        allUpcomingDoses.push({
                            ...med,
                            doseId: `${med.id}-${doseTime.toISOString()}`,
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

    }, [medications]);
}