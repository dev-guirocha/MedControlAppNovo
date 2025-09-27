import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function AddMedicationLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
      headerTitleStyle: { fontWeight: '500' },
      headerBackTitle: "Voltar",
    }}>
      <Stack.Screen name="index" options={{ title: "Adicionar Medicação" }} />
      <Stack.Screen name="form" options={{ title: "Cadastrar Remédio" }} />
      <Stack.Screen name="confirm" options={{ title: "Confirmar Dados" }} />
      <Stack.Screen name="logAsNeeded" options={{ title: "Registrar Dose Avulsa" }} />
      <Stack.Screen name="search" options={{ title: "Buscar Medicamento" }} />
    </Stack>
  );
}
