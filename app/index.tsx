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
    // Verifica se o estado de navegação foi inicializado e o carregamento terminou
    if (rootNavigationState?.key != null && !isLoading) {
      if (userProfile && userProfile.onboardingCompleted) {
        // Redireciona para a tela inicial se o usuário já fez o onboarding
        router.replace('/(tabs)/home');
      } else {
        // Redireciona para a tela de boas-vindas para novo usuário
        router.replace('/welcome');
      }
    }
  }, [isLoading, userProfile, router, rootNavigationState]);

  // Se o aplicativo ainda está carregando ou a navegação não foi inicializada, mostra o indicador de atividade
  if (isLoading || rootNavigationState?.key == null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Carregando o aplicativo" />
      </View>
    );
  }

  // Não renderiza nada se as condições acima não forem atendidas, esperando a navegação
  return null;
}