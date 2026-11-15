/** Pessoa cuidada (o próprio usuário, pai, mãe...). */
export interface Person {
  id: string;
  name: string;
  color: string;
  birthYear?: number;
  gender?: UserProfile['gender'];
  /** Marca a pessoa que é o próprio usuário do app. */
  isSelf?: boolean;
  createdAt: string;
}

export interface Medication {
  id: string;
  /** Dono do remédio. */
  personId: string;
  name: string;
  dosage: string;
  color?: string;
  form: 'comprimido' | 'cápsula' | 'líquido' | 'injeção' | 'pomada' | 'gotas';
  frequency: 'diária' | 'a cada 8h' | 'a cada 12h' | 'semanal' | 'quando necessário';
  times: string[];
  /** Só para frequência 'semanal': dias da semana, 0 = domingo … 6 = sábado. */
  weekdays?: number[];
  stock: number;
  stockAlertThreshold: number; // <-- NOVO CAMPO ADICIONADO AQUI
  instructions?: string;
  doctor?: string;
  createdAt: string;
  condition: string;
  /** Quando o tratamento foi encerrado (ISO); ausente = em uso. */
  endedAt?: string;
}

// ... (O resto do arquivo DoseHistory e UserProfile permanece igual)
export interface DoseHistory {
  id: string;
  personId?: string;
  doseId?: string;
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
  /** Dono da consulta. */
  personId: string;
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
  isMissed: boolean;
};
