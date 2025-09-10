import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@/hooks/useAuthStore';
import { colors } from '@/constants/theme';
import { useAppLoadingStore } from '@/hooks/useAppLoadingStore';

export default function IndexScreen() {
  const router = useRouter();
  const { userProfile } = useAuthStore();
  const { isLoading } = useAppLoadingStore();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // Apenas redireciona quando a navegação estiver pronta e o app não estiver carregando
    if (rootNavigationState?.key == null || isLoading) {
      return;
    }

    if (userProfile && userProfile.onboardingCompleted) {
      // Usuário antigo, vai para a home
      router.replace('/(tabs)/home');
    } else {
      // Novo usuário (ou onboarding incompleto), vai para o início do fluxo de onboarding
      router.replace('/(onboarding)');
    }
  }, [isLoading, userProfile, rootNavigationState?.key, router]);

  // Exibe o loading enquanto o app inicializa e a navegação é montada
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Carregando o aplicativo" />
    </View>
  );
}