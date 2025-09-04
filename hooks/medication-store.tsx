import { useMemo } from 'react';
import { useMedicationStore } from './useMedicationStore';
import { useDoseHistoryStore } from './useDoseHistoryStore'; // Importamos o store de histórico
import { Medication } from '@/types/medication';

// Estendemos o tipo Medication para incluir dados específicos da dose agendada
export type ScheduledDose = Medication & {
  doseId: string;
  scheduledTime: string;
  scheduledDateTime: Date;
  isToday: boolean;
};

export function useDoseSchedule(): ScheduledDose[] {
    const medications = useMedicationStore((state) => state.medications);
    const doseHistory = useDoseHistoryStore((state) => state.doseHistory);

    return useMemo(() => {
        const now = new Date();
        const allUpcomingDoses: ScheduledDose[] = [];

        for (const med of medications) {
            if (!med.times || med.times.length === 0) continue;

            // Encontra a última dose tomada para calcular a próxima dose com mais precisão
            const lastTakenDose = doseHistory
                .filter(d => d.medicationId === med.id && d.status === 'taken')
                .sort((a, b) => new Date(b.takenTime).getTime() - new Date(a.takenTime).getTime())[0];
            
            const startDate = lastTakenDose ? new Date(lastTakenDose.takenTime) : new Date(med.createdAt);
            
            let daysToAdd = 1;
            if (med.frequency === 'a cada 8h') {
                // A cada 8h, precisamos gerar 3 doses por dia. O loop abaixo já fará isso.
                daysToAdd = 1; 
            } else if (med.frequency === 'a cada 12h') {
                // A cada 12h, 2 doses por dia. O loop abaixo já fará isso.
                daysToAdd = 1;
            } else if (med.frequency === 'semanal') {
                daysToAdd = 7;
            }

            // Gerar doses para as próximas 3 semanas para ter um buffer
            for (let dayOffset = 0; dayOffset < 21; dayOffset += daysToAdd) {
                const targetDate = new Date(startDate);
                targetDate.setDate(startDate.getDate() + dayOffset);
                
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

    }, [medications, doseHistory]);
}