// MedControlAppNovo/app/(modals)/font-size-settings.tsx

import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Text } from '@/components/StyledText';
import { Check } from 'lucide-react-native';

export default function FontSizeSettingsModal() {
  const router = useRouter();
  const { fontScale, setFontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale); // Para ter o tamanho da fonte atual no modal

  const handleSelectFontScale = (scale: 'small' | 'medium' | 'large') => {
    setFontScale(scale);
    router.back(); // Volta para a tela de perfil após a seleção
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Tamanho do Texto' }} />

      <View style={styles.content}>
        {['small', 'medium', 'large'].map((scale) => (
          <TouchableOpacity
            key={scale}
            style={styles.optionItem}
            onPress={() => handleSelectFontScale(scale as any)}
          >
            <View>
              <Text style={[styles.optionText, {fontSize: getFontSize(scale).md}]}>
                {scale === 'small' ? 'Pequeno' : scale === 'medium' ? 'Médio' : 'Grande'}
              </Text>
              <Text style={[styles.optionDescription, {fontSize: getFontSize(scale).sm}]}>
                Este é um texto de exemplo para o tamanho {scale === 'small' ? 'Pequeno' : scale === 'medium' ? 'Médio' : 'Grande'}.
              </Text>
            </View>
            {fontScale === scale && <Check size={24} color={colors.primary} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    fontWeight: 'bold',
    color: colors.text,
  },
  optionDescription: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});