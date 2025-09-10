import React from 'react';
import { View, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Text } from '@/components/StyledText';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image 
          // Usando require para a imagem local
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Bem-vindo ao MedControl</Text>
        <Text style={styles.subtitle}>
          Seu assistente pessoal para gerenciar medicamentos, consultas e seu bem-estar.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button 
          title="Começar" 
          onPress={() => router.push('/(onboarding)/step2-profile-type')} 
          size="large" 
          variant="success"
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
    logo: {
      width: 120,
      height: 120,
      marginBottom: spacing.lg,
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