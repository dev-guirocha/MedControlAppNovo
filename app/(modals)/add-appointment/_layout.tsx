import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';
import React from 'react';

export default function AddAppointmentLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerBackTitleVisible: false,
        headerTitleStyle: { color: colors.text },
        // ✅ Aplica uma cor de fundo ao contêiner do modal para uma transição suave
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Nova Consulta',
        }}
      />
    </Stack>
  );
}