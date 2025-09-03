import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function AddMedicationLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: '500' },
      headerBackTitle: "Voltar",
    }}>
      <Stack.Screen name="index" options={{ title: "Adicionar" }} />
      <Stack.Screen name="form" options={{ title: "Cadastrar Remédio" }} />
      <Stack.Screen name="confirm" options={{ title: "Confirmar Dados" }} />
      {/* Registramos a nova tela aqui */}
      <Stack.Screen name="logAsNeeded" options={{ title: "Registrar Dose Avulsa" }} />
    </Stack>
  );
}