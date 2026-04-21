import { Stack } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import type { NotificationResponse } from 'expo-notifications';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootSiblingParent } from 'react-native-root-siblings';
import { useAppLoadingStore } from "@/hooks/useAppLoadingStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useMedicationStore } from "@/hooks/useMedicationStore";
import { useMedicationSuggestionsStore } from "@/hooks/useMedicationSuggestionsStore";
import { useDoseHistoryStore } from "@/hooks/useDoseHistoryStore";
import { useAppointmentStore } from "@/hooks/useAppointmentStore";
import { useAnamnesisStore } from "@/hooks/useAnamnesisStore";
import { getMedicationActionFromNotificationResponse, initializeNotificationsAsync } from "@/lib/notifications";
import { colors } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

function RootLayoutNav() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      headerTitleStyle: { color: colors.text },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: colors.background },
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
  const { loadSuggestions } = useMedicationSuggestionsStore();
  const { loadUserProfile } = useAuthStore();
  const { loadHistory } = useDoseHistoryStore();
  const { loadAppointments } = useAppointmentStore();
  const { loadAnamnesis } = useAnamnesisStore();
  const { stopLoading } = useAppLoadingStore();
  const handledNotificationResponsesRef = useRef(new Set<string>());

  useEffect(() => {
    const initializeApp = async () => {
      let responseSubscription: { remove: () => void } | null = null;

      const handleNotificationResponse = async (response: NotificationResponse) => {
        const responseKey = `${response.notification.request.identifier}:${response.actionIdentifier}`;
        if (handledNotificationResponsesRef.current.has(responseKey)) {
          return;
        }

        handledNotificationResponsesRef.current.add(responseKey);

        const medicationAction = getMedicationActionFromNotificationResponse(response);
        if (!medicationAction) {
          return;
        }

        try {
          await useMedicationStore.getState().logDose(
            medicationAction.medicationId,
            medicationAction.scheduledDate,
            medicationAction.status
          );
        } catch (error) {
          console.error('Error handling medication notification action:', error);
        }
      };

      try {
        await initializeNotificationsAsync();
        const Notifications = await import('expo-notifications');

        await Promise.all([
          loadMedications(),
          loadSuggestions(),
          loadHistory(),
          loadUserProfile(),
          loadAppointments(),
          loadAnamnesis(),
        ]);

        responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
          void handleNotificationResponse(response);
        });

        const lastResponse = await Notifications.getLastNotificationResponseAsync();
        if (lastResponse) {
          await handleNotificationResponse(lastResponse);
          await Notifications.clearLastNotificationResponseAsync();
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        stopLoading();
      }

      return () => {
        responseSubscription?.remove();
      };
    };

    let cleanup: (() => void) | undefined;

    void initializeApp().then((maybeCleanup) => {
      cleanup = maybeCleanup;
    });

    return () => {
      cleanup?.();
    };
  }, []);
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
