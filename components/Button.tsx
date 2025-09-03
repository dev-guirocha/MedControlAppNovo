import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle,
  View,
  AccessibilityProps 
} from 'react-native';
import { colors, fontSize, spacing } from '@/constants/theme';

interface ButtonProps extends AccessibilityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'success' | 'danger' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  loading = false, 
  style, 
  icon,
  accessibilityLabel,
  accessibilityHint,
  ...accessibilityProps 
}: ButtonProps) {
  const buttonStyles = [
    styles.button, 
    styles[variant], 
    styles[size], 
    (disabled || loading) && styles.disabled, 
    style
  ];
  
  const textStyles = [
    styles.text, 
    styles[`${size}Text`], 
    variant === 'secondary' && styles.secondaryText
  ];

  const getActivityIndicatorColor = () => {
    if (variant === 'secondary') return colors.primary;
    if (variant === 'danger') return colors.background;
    return colors.background;
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      {...accessibilityProps}
    >
      {loading ? (
        <ActivityIndicator 
          color={getActivityIndicatorColor()} 
          size="small" 
          accessibilityLabel="Carregando"
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={textStyles} numberOfLines={1} adjustsFontSizeToFit>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: 12, 
    gap: spacing.sm,
    minWidth: 64,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  primary: { 
    backgroundColor: colors.primary,
  },
  success: { 
    backgroundColor: colors.success,
  },
  danger: { 
    backgroundColor: colors.danger,
  },
  secondary: { 
    backgroundColor: colors.background, 
    borderWidth: 2, 
    borderColor: colors.primary,
  },
  small: { 
    paddingVertical: spacing.sm, 
    paddingHorizontal: spacing.md, 
    minHeight: 40,
  },
  medium: { 
    paddingVertical: spacing.md, 
    paddingHorizontal: spacing.lg, 
    minHeight: 56,
  },
  large: { 
    paddingVertical: spacing.lg, 
    paddingHorizontal: spacing.xl, 
    minHeight: 64,
  },
  disabled: { 
    opacity: 0.6,
  },
  text: { 
    color: colors.background, 
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryText: { 
    color: colors.primary,
  },
  smallText: { 
    fontSize: fontSize.sm,
  },
  mediumText: { 
    fontSize: fontSize.md,
  },
  largeText: { 
    fontSize: fontSize.lg,
  },
});