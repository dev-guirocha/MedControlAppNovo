import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { UserProfile } from '@/types/medication';
import { showErrorToast } from '@/lib/toastHelper';
import { PROFILE_KEY, FONT_SCALE_KEY } from '../src/constants/keys';

export type FontScale = 'small' | 'medium' | 'large';

interface AuthState {
  userProfile: UserProfile | null;
  // ✅ Removendo o estado de carregamento local
  fontScale: FontScale;
  loadUserProfile: () => Promise<void>;
  saveUserProfile: (profile: UserProfile) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  setFontScale: (scale: FontScale) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userProfile: null,
  // ✅ Removendo o estado de carregamento inicial
  fontScale: 'medium',
  
  loadUserProfile: async () => {
    try {
      const storedProfile = await AsyncStorage.getItem(PROFILE_KEY);
      if (storedProfile) set({ userProfile: JSON.parse(storedProfile) });

      const storedFontScale = await AsyncStorage.getItem(FONT_SCALE_KEY);
      if (storedFontScale) set({ fontScale: storedFontScale as FontScale });

    } catch (error) { 
      console.error('Error loading user profile:', error); 
    }
    // ✅ Removendo o set({ isLoading: false })
  },
  
  saveUserProfile: async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      set({ userProfile: profile });
    } catch (error) { 
      console.error('Error saving user profile:', error); 
      showErrorToast('Erro ao salvar o perfil.'); // ✅ 2. Adicionar feedback de erro
    }
  },
  
  updateUserProfile: async (updates: Partial<UserProfile>) => {
    try {
      const currentProfile = get().userProfile;
      // Se não houver perfil, não faz nada (isso não deve acontecer no fluxo de onboarding)
      if (!currentProfile) return;

      const updatedProfile = { ...currentProfile, ...updates };
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
      set({ userProfile: updatedProfile });
    } catch (error) { 
      console.error('Error updating user profile:', error); 
      showErrorToast('Erro ao atualizar o perfil.');
    }
  },
  
  setFontScale: async (scale: FontScale) => {
      try {
          await AsyncStorage.setItem(FONT_SCALE_KEY, scale);
          set({ fontScale: scale });
      } catch (error) { 
        console.error('Error saving font scale:', error); 
        showErrorToast('Erro ao salvar preferência de fonte.'); // ✅ 2. Adicionar feedback de erro
      }
  },
}));