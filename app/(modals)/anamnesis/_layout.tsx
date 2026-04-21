import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';
import React from 'react';

export default function AnamnesisLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Questionário de Anamnese',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}
