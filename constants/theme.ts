import { colors } from './colors';

export { colors };

export const medicationColors = [ '#2D6A9F', '#EF4444', '#F59E0B', '#10B981', '#6366F1', '#8B5CF6', '#EC4899' ];
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

const FONT_SCALE = {
    small: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 22, xxxl: 28 },
    medium: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24, xxxl: 32 },
    large: { xs: 14, sm: 16, md: 18, lg: 20, xl: 22, xxl: 28, xxxl: 36 },
};

export const getFontSize = (scale: 'small' | 'medium' | 'large' = 'medium') => {
    return FONT_SCALE[scale] || FONT_SCALE.medium;
};
export const fontSize = FONT_SCALE.medium;

function relativeLuminance(hex: string) {
    const clean = hex.replace('#', '');
    const channels = [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) / 255);
    const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Cor de texto/ícone legível sobre um fundo arbitrário (ex.: cor de identificação do remédio). */
export function getContentColorOn(background: string) {
    const dark = colors.textInverse;
    const light = colors.textOnDark;
    return contrastRatio(dark, background) >= contrastRatio(light, background) ? dark : light;
}
