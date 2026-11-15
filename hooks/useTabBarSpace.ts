import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/constants/theme';

// Medidas da barra de abas flutuante (app/(tabs)/_layout.tsx). Ela fica por cima do conteúdo,
// então toda tela de aba precisa reservar esse espaço no fim da rolagem.
export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_MIN_BOTTOM_GAP = 12;

export function useTabBarBottomOffset() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_GAP);
}

/** Espaço livre a deixar no fim de uma lista/rolagem para nada ficar sob a barra. */
export function useTabBarSpace() {
  return TAB_BAR_HEIGHT + useTabBarBottomOffset() + spacing.md;
}
