import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';
import React from 'react';

export default function AnamnesisLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Questionário de Anamnese',
          headerBackTitleVisible: false,
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.primary,
          headerShown: true,
        }} 
      />
    </Stack>
  );
}