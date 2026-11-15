import { Stack } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { AppState } from "react-native";
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
import { usePeopleStore } from "@/hooks/usePeopleStore";
import { ensureDataMigrated } from "@/lib/dataMigration";
import { initializeNotificationsAsync } from "@/lib/notifications";
import { handleDoseActionResponse, hydrateDoseStoresFromStorage, registerDoseActionTaskAsync } from "@/lib/doseNotificationActions";
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
      <Stack.Screen name="(modals)/people" options={{ presentation: 'modal', headerShown: false }} />
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
  const { loadPeople } = usePeopleStore();
  const { stopLoading } = useAppLoadingStore();

  useEffect(() => {
    const initializeApp = async () => {
      let responseSubscription: { remove: () => void } | null = null;
      let appStateSubscription: { remove: () => void } | null = null;

      // Dedupe e reidratação ficam em handleDoseActionResponse: o mesmo toque pode chegar
      // pela task em segundo plano e por este listener.
      const handleNotificationResponse = async (response: NotificationResponse) => {
        try {
          await handleDoseActionResponse(response);
        } catch (error) {
          console.error('Error handling medication notification action:', error);
        }
      };

      try {
        await initializeNotificationsAsync();
        const Notifications = await import('expo-notifications');

        // Migra os dados para o formato com pessoas antes de qualquer store ler o disco.
        // Se falhar, segue com os loads (dados v1 intactos no disco); a task tenta de novo.
        try {
          await ensureDataMigrated();
        } catch (error) {
          console.error('Error migrating data:', error);
        }

        // Pessoas antes dos demais, para o loadAnamnesis enxergar a pessoa ativa.
        await loadPeople();

        await Promise.all([
          loadMedications(),
          loadSuggestions(),
          loadHistory(),
          loadUserProfile(),
          loadAppointments(),
          loadAnamnesis(),
        ]);

        try {
          await registerDoseActionTaskAsync();
        } catch (error) {
          console.error('Error registering dose action task:', error);
        }

        // Dose registrada pela notificação com o app em segundo plano pode ter sido gravada
        // por outro runtime JS: ao voltar para a frente, relê o disco.
        appStateSubscription = AppState.addEventListener('change', (state) => {
          if (state === 'active') {
            void hydrateDoseStoresFromStorage().catch((error) =>
              console.error('Error refreshing doses on resume:', error)
            );
          }
        });

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
        appStateSubscription?.remove();
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
