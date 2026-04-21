import React from 'react';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Pill, User, History, Plus } from 'lucide-react-native';
import { colors } from '@/constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  const renderTabIcon = (
    Icon: typeof Home,
    color: string,
    focused: boolean
  ) => (
    <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
      <Icon color={color} size={20} strokeWidth={2.3} />
    </View>
  );

  const isConsultasRoute = pathname === '/consultas' || pathname === '/(tabs)/consultas';
  const centerActionLabel = isConsultasRoute ? 'Adicionar consulta' : 'Adicionar medicamento';
  const handleCenterAction = () => {
    router.push(isConsultasRoute ? '/(modals)/add-appointment' : '/(modals)/add-medication');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabBarIcon,
        tabBarInactiveTintColor: colors.tabBarIconInactive,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: Math.max(insets.bottom, 12),
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.tabBarOutline,
          height: 64,
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: 26,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 18,
          elevation: 14,
        },
        tabBarItemStyle: {
          marginHorizontal: 2,
          borderRadius: 20,
        },
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontSize: 18, fontWeight: '600' },
        headerShadowVisible: false,
      }}>
      <Tabs.Screen name="home" options={{ title: 'Hoje', headerShown: false, tabBarIcon: ({ color, focused }) => renderTabIcon(Home, color, focused) }} />
      <Tabs.Screen name="medicamentos" options={{ title: 'Medicamentos', tabBarIcon: ({ color, focused }) => renderTabIcon(Pill, color, focused) }} />
      <Tabs.Screen
        name="consultas"
        options={{
          title: 'Adicionar',
          tabBarButton: () => (
            <TouchableOpacity
              style={styles.centerActionButton}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={centerActionLabel}
              onPress={handleCenterAction}
            >
              <Plus color={colors.textInverse} size={24} strokeWidth={2.6} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen name="historico" options={{ title: 'Histórico', tabBarIcon: ({ color, focused }) => renderTabIcon(History, color, focused) }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color, focused }) => renderTabIcon(User, color, focused) }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapperActive: {
    backgroundColor: colors.tabBarItemActive,
  },
  centerActionButton: {
    width: 58,
    height: 58,
    borderRadius: 22,
    marginTop: -18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.background,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 16,
  },
});
