import React from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { icons } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { ButtonProps } from '@/types/button';

export function Button({
  onPress,
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  iconName,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isSecondary = variant === 'secondary';
  const isSuccess = variant === 'success';
  const isDanger = variant === 'danger';

  const IconComponent = iconName ? icons[iconName] : null;
  const hasValidIcon = !!IconComponent;

  const buttonStyles = [
    styles.buttonBase,
    variant === 'primary' && styles.primaryButton,
    isSecondary && styles.secondaryButton,
    isSuccess && styles.successButton,
    isDanger && styles.dangerButton,
    isDisabled && styles.disabledButton,
  ];

  const textStyles = [
    styles.textBase,
    variant === 'primary' && styles.primaryText,
    isSecondary && styles.secondaryText,
    isSuccess && styles.successText,
    isDanger && styles.dangerText,
    isDisabled && styles.disabledText,
  ];

  const iconColor = isSecondary ? colors.primary : colors.background;

  return (
    <Pressable
        style={({ pressed }) => [
            ...buttonStyles,
            style,
            pressed && !isDisabled && styles.pressedButton,
        ]}
        onPress={onPress}
        disabled={isDisabled}
        accessibilityLabel={loading ? 'Carregando' : title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={iconColor} />
        ) : (
          <>
            {hasValidIcon && IconComponent && (
              <IconComponent
                size={18}
                color={iconColor}
                style={styles.icon}
              />
            )}
            <Text style={textStyles}>{title}</Text>
          </>
        )}
      </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  primaryButton: { backgroundColor: colors.primary },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.text },
  successButton: { backgroundColor: colors.success },
  dangerButton: { backgroundColor: colors.danger },
  disabledButton: { opacity: 0.6 },
  pressedButton: { opacity: 0.8 },
  textBase: { fontSize: 16, fontWeight: '600' },
  primaryText: { color: colors.background },
  secondaryText: { color: colors.text },
  successText: { color: colors.background },
  dangerText: { color: colors.background },
  disabledText: { color: colors.textSecondary },
  icon: { marginRight: 8 },
});