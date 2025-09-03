import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';
import React from 'react';

export default function AddAppointmentLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Adicionar Consulta',
          headerBackTitleVisible: false,
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.primary,
          headerShown: true,
        }} 
      />
    </Stack>
  );
}