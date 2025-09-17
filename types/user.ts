export type ProfileType = 'patient' | 'caregiver';

export interface UserProfile {
  name?: string;
  type?: ProfileType;
  age?: number;
  city?: string;
  notificationsEnabled?: boolean;
  onboardingCompleted?: boolean;
  photoUrl?: string;
}
