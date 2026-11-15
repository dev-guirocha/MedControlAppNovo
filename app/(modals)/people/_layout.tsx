import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';
import React from 'react';

export default function PeopleLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Pessoas', headerShown: true }} />
      <Stack.Screen name="edit" options={{ title: 'Pessoa', headerShown: true }} />
    </Stack>
  );
}
