import React from 'react';
import { Text as DefaultText, StyleSheet, TextProps } from 'react-native';
import { useAuthStore } from '@/hooks/useAuthStore';
import { getFontSize } from '@/constants/theme';

// Usamos React.memo para evitar re-renderizações desnecessárias
export const Text = React.memo((props: TextProps) => {
  const { style, ...rest } = props;
  const fontScale = useAuthStore((state) => state.fontScale);
  const fontSize = getFontSize(fontScale);

  const baseStyle = { fontSize: fontSize.md };

  return <DefaultText style={[baseStyle, style]} {...rest} />;
});