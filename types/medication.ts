export interface Medication {
  id: string;
  name: string;
  dosage: string;
  color?: string;
  form: 'comprimido' | 'cápsula' | 'líquido' | 'injeção' | 'pomada' | 'gotas';
  frequency: 'diária' | 'a cada 8h' | 'a cada 12h' | 'semanal' | 'quando necessário';
  times: string[];
  stock: number;
  stockAlertThreshold: number; // <-- NOVO CAMPO ADICIONADO AQUI
  instructions?: string;
  doctor?: string;
  createdAt: string;
  condition: string;
}

// ... (O resto do arquivo DoseHistory e UserProfile permanece igual)
export interface DoseHistory {
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  takenTime?: string;
  status: 'taken' | 'skipped' | 'pending';
}

export interface UserProfile {
  id: string;
  name: string;
  type: 'patient' | 'caregiver';
  createdAt: string;
  onboardingCompleted: boolean;
  photoUrl?: string; // <-- NOVO: URL da foto de perfil
  email?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other' | 'preferNotToSay';
  birthYear?: number;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  location: string;
  date: string;
  notes?: string;
  createdAt: string;
  recipeImageUrl?: string;
}

export interface Anamnesis {
  id: string;
  chronicConditions: string[];
  allergies: string[];
  surgeries: string[];
  familyHistory: {
    hypertension?: boolean;
    diabetes?: boolean;
    heartDisease?: boolean;
    cancer?: boolean;
    other?: string;
  };
  otherNotes?: string;
  lastUpdated: string;
}

export type ScheduledDose = Medication & {
  doseId: string;
  scheduledTime: string;
  scheduledDateTime: Date;
  isToday: boolean;
};