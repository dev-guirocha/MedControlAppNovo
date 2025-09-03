import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Home, Pill, Stethoscope, User, History } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { setupNotificationCategories, registerForPushNotificationsAsync } from '@/lib/notifications';

export default function TabLayout() {
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await registerForPushNotificationsAsync();
        await setupNotificationCategories();
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarStyle: { height: 60, paddingBottom: 10, paddingTop: 5 },
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontSize: 18, fontWeight: '600' },
      }}>
      <Tabs.Screen name="home" options={{ title: 'Hoje', headerShown: false, tabBarIcon: ({ color }) => <Home color={color} /> }} />
      <Tabs.Screen name="medicamentos" options={{ title: 'Medicamentos', tabBarIcon: ({ color }) => <Pill color={color} /> }} />
      <Tabs.Screen name="historico" options={{ title: 'Histórico', tabBarIcon: ({ color }) => <History color={color} /> }} />
      <Tabs.Screen name="consultas" options={{ title: 'Consultas', tabBarIcon: ({ color }) => <Stethoscope color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <User color={color} /> }} />
    </Tabs>
  );
}