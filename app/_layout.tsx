import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from 'expo-notifications';
import React, { useEffect, useMemo, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootSiblingParent } from 'react-native-root-siblings';
import { useAppLoadingStore } from "@/hooks/useAppLoadingStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useMedicationStore } from "@/hooks/useMedicationStore";
import { useDoseHistoryStore } from "@/hooks/useDoseHistoryStore";
import { useAppointmentStore } from "@/hooks/useAppointmentStore";
import { useAnamnesisStore } from "@/hooks/useAnamnesisStore";
import { setupNotificationCategories } from "@/lib/notifications";
import { colors } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

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
  const { loadMedications, logDose } = useMedicationStore();
  const { loadUserProfile } = useAuthStore();
  const { loadHistory } = useDoseHistoryStore();
  const { loadAppointments } = useAppointmentStore();
  const { loadAnamnesis } = useAnamnesisStore();
  const { isLoading, stopLoading } = useAppLoadingStore();

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

  const handledResponsesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleNotificationResponse = async (response: Notifications.NotificationResponse | null) => {
      if (!response) return;

      const { actionIdentifier, notification } = response;
      if (actionIdentifier !== 'dose-taken' && actionIdentifier !== 'dose-skipped') {
        return;
      }

      const data = notification.request.content.data || {};
      const medicationId = typeof data.medicationId === 'string' ? data.medicationId : undefined;
      if (!medicationId) {
        return;
      }

      const responseKey = `${notification.request.identifier}:${actionIdentifier}:${notification.date ?? '0'}`;
      if (handledResponsesRef.current.has(responseKey)) {
        return;
      }
      handledResponsesRef.current.add(responseKey);

      const scheduledTimestamp = typeof data.scheduledTimestamp === 'string' ? new Date(data.scheduledTimestamp) : undefined;
      const triggerDate = notification.date ? new Date(notification.date) : undefined;
      const scheduledTime = [scheduledTimestamp, triggerDate, new Date()].find((date) => date && !Number.isNaN(date.getTime()))!;

      try {
        await logDose(medicationId, scheduledTime, actionIdentifier === 'dose-taken' ? 'taken' : 'skipped');
      } catch (error) {
        console.error('Error handling notification response:', error);
      }
    };

    Notifications.getLastNotificationResponseAsync().then(handleNotificationResponse);
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => subscription.remove();
  }, [logDose]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  const statusBarStyle = useMemo<'light' | 'dark'>(() => {
    const hex = (colors.background ?? '#FFFFFF').replace('#', '').padEnd(6, 'f');
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 140 ? 'dark' : 'light';
  }, []);

  return (
    <RootSiblingParent>
      <SafeAreaProvider>
        <StatusBar style={statusBarStyle} backgroundColor={colors.background} translucent={false} />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </RootSiblingParent>
  );
}
