import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { UserProfile } from '@/types/medication';

const PROFILE_KEY = '@user_profile';
const FONT_SCALE_KEY = '@font_scale';

export type FontScale = 'small' | 'medium' | 'large';

interface AuthState {
  userProfile: UserProfile | null;
  isLoading: boolean;
  fontScale: FontScale;
  loadUserProfile: () => Promise<void>;
  saveUserProfile: (profile: UserProfile) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  setFontScale: (scale: FontScale) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userProfile: null,
  isLoading: true,
  fontScale: 'medium',
  loadUserProfile: async () => {
    try {
      const storedProfile = await AsyncStorage.getItem(PROFILE_KEY);
      if (storedProfile) set({ userProfile: JSON.parse(storedProfile) });

      const storedFontScale = await AsyncStorage.getItem(FONT_SCALE_KEY);
      if (storedFontScale) set({ fontScale: storedFontScale as FontScale });

    } catch (error) { console.error('Error loading user profile:', error); }
    finally { set({ isLoading: false }); }
  },
  saveUserProfile: async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      set({ userProfile: profile });
    } catch (error) { console.error('Error saving user profile:', error); }
  },
  updateUserProfile: async (profile: Partial<UserProfile>) => {
    try {
      const currentProfile = get().userProfile;
      if (currentProfile) {
        const updatedProfile = { ...currentProfile, ...profile };
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
        set({ userProfile: updatedProfile });
      }
    } catch (error) { console.error('Error updating user profile:', error); }
  },
  setFontScale: async (scale: FontScale) => {
      try {
          await AsyncStorage.setItem(FONT_SCALE_KEY, scale);
          set({ fontScale: scale });
      } catch (error) { console.error('Error saving font scale:', error); }
  },
}));