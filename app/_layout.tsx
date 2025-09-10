import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootSiblingParent } from 'react-native-root-siblings';
import { useAppLoadingStore } from "@/hooks/useAppLoadingStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useMedicationStore } from "@/hooks/useMedicationStore";
import { useDoseHistoryStore } from "@/hooks/useDoseHistoryStore";
import { useAppointmentStore } from "@/hooks/useAppointmentStore";
import { useAnamnesisStore } from "@/hooks/useAnamnesisStore";
import { setupNotificationCategories } from "@/lib/notifications";
import { colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      headerBackTitleVisible: false,
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* ✅ As linhas abaixo foram removidas pois os arquivos foram deletados */}
      {/* <Stack.Screen name="welcome" options={{ presentation: 'modal', headerShown: false }} /> */}
      {/* <Stack.Screen name="register" options={{ presentation: 'modal', title: "Criar Conta" }} /> */}

      <Stack.Screen name="(modals)/add-medication" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="(modals)/add-appointment" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="(modals)/edit-profile" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="(modals)/anamnesis" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="medication/[id]" options={{ presentation: 'modal', title: "Detalhes" }} />
      <Stack.Screen name="policy/privacy" options={{ title: "Política de Privacidade" }} />
      <Stack.Screen name="policy/terms" options={{ title: "Termos de Serviço" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const { loadMedications } = useMedicationStore();
  const { loadUserProfile } = useAuthStore();
  const { loadHistory } = useDoseHistoryStore();
  const { loadAppointments } = useAppointmentStore();
  const { loadAnamnesis } = useAnamnesisStore();
  const { isAppLoading, stopLoading } = useAppLoadingStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await Promise.all([
          loadMedications(),
          loadHistory(),
          loadUserProfile(),
          loadAppointments(),
          loadAnamnesis(),
          setupNotificationCategories(),
        ]);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        stopLoading();
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (!isAppLoading) {
      SplashScreen.hideAsync();
    }
  }, [isAppLoading]);

  return (
    <RootSiblingParent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </RootSiblingParent>
  );
}