// src/constants/medication-presets.ts
import type { MedicationPayload } from '@/types/medication';

export type MedicationPreset = {
  name: string;     // sem forma farmacêutica no título
  dosage: string;   // ex.: "500 mg", "20 mg/mL", "25 mg"
  form?: MedicationPayload['form']; // guardado separadamente
};

export const MEDICATION_PRESETS: MedicationPreset[] = [
  // Analgésicos / antitérmicos
  { name: 'Dipirona',     dosage: '500 mg',    form: 'comprimido' },
  { name: 'Paracetamol',  dosage: '750 mg',    form: 'comprimido' },
  { name: 'Ibuprofeno',   dosage: '400 mg',    form: 'comprimido' },
  { name: 'Amoxicilina',  dosage: '500 mg',    form: 'cápsula'    },

  // Gastro
  { name: 'Omeprazol',    dosage: '20 mg',     form: 'cápsula'    },
  { name: 'Domperidona',  dosage: '10 mg',     form: 'comprimido' },

  // Cardio/Metabólico
  { name: 'Losartana',    dosage: '50 mg',     form: 'comprimido' },
  { name: 'Metformina',   dosage: '850 mg',    form: 'comprimido' },
  { name: 'Sinvastatina', dosage: '20 mg',     form: 'comprimido' },

  // Alergia
  { name: 'Cetirizina',   dosage: '10 mg',     form: 'comprimido' },
  { name: 'Loratadina',   dosage: '10 mg',     form: 'comprimido' },

  // Pediatria (exemplo com solução mas sem poluir o título)
  { name: 'Paracetamol',  dosage: '200 mg/mL', form: 'líquido'    },
  { name: 'Dipirona',     dosage: '500 mg/mL', form: 'líquido'    },
];