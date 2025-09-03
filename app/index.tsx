import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/hooks/useAuthStore';
import { colors } from '@/constants/theme';

export default function IndexScreen() {
  const router = useRouter();
  const { userProfile, isLoading } = useAuthStore();

  React.useEffect(() => {
    if (isLoading) return;
    if (userProfile?.onboardingCompleted) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/welcome');
    }
  }, [isLoading, userProfile]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}