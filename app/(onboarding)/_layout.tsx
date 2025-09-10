import { Stack } from 'expo-router';
import React from 'react';

// Este arquivo define a navegação para o fluxo de onboarding.
// screenOptions={{ headerShown: false }} esconde o cabeçalho em todas as telas deste fluxo.
export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="step2-profile-type" />
      <Stack.Screen name="step3-name" />
      <Stack.Screen name="step4-details" />
      <Stack.Screen name="step5-notifications" />
      <Stack.Screen name="step6-complete" />
    </Stack>
  );
}