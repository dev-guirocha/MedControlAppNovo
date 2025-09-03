export const colors = {
  primary: '#2D6A9F',
  primaryFaded: '#EAF1F8',
  background: '#FFFFFF',
  cardBackground: '#F7F9FC',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  disabled: '#D1D5DB',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

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