import { Appearance } from 'react-native';

export type FontScale = 'small' | 'medium' | 'large';
export type ThemeMode = 'light' | 'dark';

export const FONT_MULTIPLIER: Record<FontScale, number> = {
  small: 0.9,
  medium: 1,
  large: 1.15,
};

export const darkColors = {
  background: '#0B0B0B',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  disabled: '#6B7280',
  primary: '#4F7FFF',
  primaryFaded: 'rgba(79,127,255,0.10)',
  danger: '#EF4444',
  warning: '#F59E0B',
  border: '#2A2A2A',
  cardBackground: '#151515',
  success: '#10B981',
} as const;

export const lightColors = {
  background: '#FFFFFF',
  text: '#111111',
  textSecondary: '#4B5563',
  disabled: '#9CA3AF',
  primary: '#3B82F6',
  primaryFaded: 'rgba(59,130,246,0.10)',
  danger: '#DC2626',
  warning: '#D97706',
  border: '#E5E7EB',
  cardBackground: '#F9FAFB',
  success: '#059669',
} as const;

const pref: ThemeMode | 'system' = (globalThis as any).__THEME_MODE__ ?? 'system';
const resolved: ThemeMode = pref === 'system'
  ? (Appearance.getColorScheme() === 'light' ? 'light' : 'dark')
  : pref;
export type Colors = {
  background: string;
  text: string;
  textSecondary: string;
  disabled: string;
  primary: string;
  primaryFaded: string;
  danger: string;
  warning: string;
  border: string;
  cardBackground: string;
  success: string;
};

export const colors: Colors = resolved === 'light' ? (lightColors as Colors) : (darkColors as Colors);

export const placeholderColor = resolved === 'light' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)';

export function getStatusBarStyle(): 'light' | 'dark' {
  // Deriva a cor do texto da status bar pelo background atual
  const bg = (colors.background || '#000000').replace('#','');
  const r = parseInt(bg.slice(0,2), 16) || 0;
  const g = parseInt(bg.slice(2,4), 16) || 0;
  const b = parseInt(bg.slice(4,6), 16) || 0;
  // luminância aproximada
  const luminance = 0.2126*r + 0.7152*g + 0.0722*b;
  // fundos escuros -> texto claro ('light'); fundos claros -> texto escuro ('dark')
  return luminance < 140 ? 'light' : 'dark';
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const fontSizes = {
  xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24, xxxl: 28,
};

// paleta para identificar medicamentos
export const medicationColors = [
  '#3B82F6', // azul
  '#10B981', // verde
  '#F59E0B', // amarelo
  '#EF4444', // vermelho
  '#8B5CF6', // roxo
  '#EC4899', // rosa
  '#06B6D4', // ciano
  '#84CC16', // lima
];

function resolveMultiplier(input?: number | FontScale): number {
  if (typeof input === 'number' && Number.isFinite(input) && input > 0) return input;
  if (typeof input === 'string' && input in FONT_MULTIPLIER) return FONT_MULTIPLIER[input];
  return 1; // fallback seguro
}

export function getFontSize(scale?: number | FontScale) {
  const s = resolveMultiplier(scale);
  const round = (v: number) => Math.round(v);

  return {
    xs: round(fontSizes.xs * s),
    sm: round(fontSizes.sm * s),
    md: round(fontSizes.md * s),
    lg: round(fontSizes.lg * s),
    xl: round(fontSizes.xl * s),
    xxl: round(fontSizes.xxl * s),
    xxxl: round(fontSizes.xxxl * s),
  } as const;
}
