// app/_layout.tsx
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootSiblingParent } from 'react-native-root-siblings';
import { useAuthStore } from "@/hooks/useAuthStore";
import { useMedicationStore } from "@/hooks/useMedicationStore";
import { useDoseHistoryStore } from "@/hooks/useDoseHistoryStore";
import { registerForPushNotificationsAsync } from "@/lib/notifications";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: "Criar Conta" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* CORREÇÃO: Adicionamos esta linha para registrar o grupo de modais */}
      <Stack.Screen 
        name="(modals)/add-medication" 
        options={{ presentation: 'modal', headerShown: false }} 
      />
      
      <Stack.Screen 
        name="medication/[id]" 
        options={{ presentation: 'modal', title: "Detalhes" }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const loadMedications = useMedicationStore(state => state.loadMedications);
  // A correção está aqui: o loadHistory agora é do useDoseHistoryStore
  const loadHistory = useDoseHistoryStore(state => state.loadHistory);
  const loadUserProfile = useAuthStore(state => state.loadUserProfile);
  const isMedsLoading = useMedicationStore(state => state.isLoading);
  const isProfileLoading = useAuthStore(state => state.isLoading);
  const isHistoryLoading = useDoseHistoryStore(state => state.isLoadingHistory);

  useEffect(() => {
    loadMedications();
    loadHistory();
    loadUserProfile();
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    if (!isMedsLoading && !isProfileLoading && !isHistoryLoading) {
      SplashScreen.hideAsync();
    }
  }, [isMedsLoading, isProfileLoading, isHistoryLoading]);

  return (
    <RootSiblingParent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </RootSiblingParent>
  );
}