import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootSiblingParent } from 'react-native-root-siblings';
import { useAuthStore } from "@/hooks/useAuthStore";
import { useMedicationStore } from "@/hooks/useMedicationStore";
import { useDoseHistoryStore } from "@/hooks/useDoseHistoryStore"; 
import { useAppointmentStore } from "@/hooks/useAppointmentStore"; 
import { useAnamnesisStore } from "@/hooks/useAnamnesisStore"; 
import { registerForPushNotificationsAsync, setupNotificationCategories } from "@/lib/notifications";
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
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: "Criar Conta" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      <Stack.Screen 
        name="(modals)/add-medication" 
        options={{ presentation: 'modal', headerShown: false }} 
      />

      <Stack.Screen 
        name="(modals)/add-appointment" 
        options={{ presentation: 'modal', headerShown: false }} 
      />

      <Stack.Screen 
        name="(modals)/edit-profile" 
        options={{ presentation: 'modal', headerShown: false }} 
      />
      
      <Stack.Screen 
        name="(modals)/anamnesis" 
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
  const loadUserProfile = useAuthStore(state => state.loadUserProfile);
  const loadHistory = useDoseHistoryStore(state => state.loadHistory);
  const loadAppointments = useAppointmentStore(state => state.loadAppointments); 
  const loadAnamnesis = useAnamnesisStore(state => state.loadAnamnesis);

  const isMedsLoading = useMedicationStore(state => state.isLoading);
  const isProfileLoading = useAuthStore(state => state.isLoading);
  const isHistoryLoading = useDoseHistoryStore(state => state.isLoadingHistory); 
  const isAppointmentsLoading = useAppointmentStore(state => state.isLoadingAppointments); 
  const isAnamnesisLoading = useAnamnesisStore(state => state.isLoadingAnamnesis);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        loadMedications();
        loadHistory();
        loadUserProfile();
        loadAppointments();
        loadAnamnesis();
        
        await registerForPushNotificationsAsync();
        await setupNotificationCategories();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const allDataLoaded = !isMedsLoading && !isProfileLoading && !isHistoryLoading && !isAppointmentsLoading && !isAnamnesisLoading;
    if (allDataLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isMedsLoading, isProfileLoading, isHistoryLoading, isAppointmentsLoading, isAnamnesisLoading]);

  return (
    <RootSiblingParent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </RootSiblingParent>
  );
}