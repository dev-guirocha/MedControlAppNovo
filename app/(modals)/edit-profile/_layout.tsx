import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';
import React from 'react';

export default function EditProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Editar Perfil',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}
