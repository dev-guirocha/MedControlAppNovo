import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Text } from '@/components/StyledText';
import { BellRing } from 'lucide-react-native';
import { registerForPushNotificationsAsync } from '@/lib/notifications';

export default function NotificationsScreen() {
  const router = useRouter();

  const handleAllow = async () => {
    await registerForPushNotificationsAsync();
    router.push('/(onboarding)/step6-complete');
  };

  const handleSkip = () => {
    router.push('/(onboarding)/step6-complete');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <BellRing size={64} color={colors.primary} />
        </View>
        <Text style={styles.title}>Nunca perca uma dose!</Text>
        <Text style={styles.subtitle}>
          Para garantir que você receba lembretes na hora certa, precisamos da sua permissão para enviar notificações.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button 
          title="Permitir notificações" 
          onPress={handleAllow} 
          size="large" 
          variant="success"
        />
         <Button 
          title="Agora não" 
          onPress={handleSkip} 
          size="large" 
          variant="secondary"
          style={{marginTop: spacing.sm}}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: spacing.xl 
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: getFontSize('large').xxxl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: getFontSize('large').lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: getFontSize('large').lg * 1.5,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  }
});