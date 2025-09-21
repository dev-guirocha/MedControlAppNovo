import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { DevSettings } from 'react-native';
import { THEME_MODE_KEY, THEME_BOOT_APPLIED_KEY } from '../src/constants/keys';

export type ThemePref = 'system' | 'light' | 'dark';

type ThemeState = {
  mode: ThemePref;
  loadTheme: () => Promise<void>;
  setTheme: (mode: ThemePref, reload?: boolean) => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  loadTheme: async () => {
    try {
      const saved = (await AsyncStorage.getItem(THEME_MODE_KEY)) as ThemePref | null;
      const m: ThemePref = saved || 'system';
      (globalThis as any).__THEME_MODE__ = m;
      set({ mode: m });
      // Aplicar a preferência no primeiro boot sem entrar em loop: usa uma flag persistida
      const applied = await AsyncStorage.getItem(THEME_BOOT_APPLIED_KEY);
      if (m !== 'system' && applied !== 'yes') {
        await AsyncStorage.setItem(THEME_BOOT_APPLIED_KEY, 'yes');
        DevSettings.reload();
      }
    } catch {}
  },
  setTheme: async (mode, reload = true) => {
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, mode);
      (globalThis as any).__THEME_MODE__ = mode;
      set({ mode });
      if (reload) {
        await AsyncStorage.setItem(THEME_BOOT_APPLIED_KEY, 'yes');
        // recarrega o app para aplicar cores globais
        DevSettings.reload();
      }
    } catch {}
  },
}));
