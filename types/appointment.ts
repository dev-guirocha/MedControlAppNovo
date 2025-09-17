export interface Appointment {
    id: string;
    doctorName: string;
    specialty: string;
    location: string;
    date: string;           // ISO
    notes?: string;
    recipeImageUrl?: string;
    createdAt: string;      // ISO
  }