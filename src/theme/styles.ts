import { StyleSheet } from 'react-native';
import { colors, spacing, fontSizes } from './tokens';

export const mk = {
  screen: StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
  }),
  text: StyleSheet.create({
    title: {
      fontSize: fontSizes.xxl,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: fontSizes.lg,
      fontWeight: '600',
      color: colors.text,
    },
    body: {
      fontSize: fontSizes.md,
      color: colors.text,
    },
    muted: {
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
    },
  }),
  card: StyleSheet.create({
    base: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: spacing.lg,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
  }),
};
