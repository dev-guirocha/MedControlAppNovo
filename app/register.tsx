import React, { useState } from 'react';
import { View, StyleSheet, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/hooks/useAuthStore';
import { UserProfile } from '@/types/medication';
import { Text } from '@/components/StyledText'; // Importação alterada

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type: string }>();
  const saveUserProfile = useAuthStore((state) => state.saveUserProfile);
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!params || !params.type) {
    return (
      <SafeAreaView style={styles.container}><ActivityIndicator size="large" color={colors.primary} /></SafeAreaView>
    );
  }
  const { type } = params;

  const handleCreateAccount = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const profile: UserProfile = {
      id: Date.now().toString(),
      name: name.trim(),
      type: type as 'patient' | 'caregiver',
      createdAt: new Date().toISOString(),
      onboardingCompleted: true,
    };
    await saveUserProfile(profile);
    setLoading(false);
    router.replace('/(tabs)/home');
  };

  const dynamicStyles = StyleSheet.create({
    title: { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm, textAlign: 'center' },
    subtitle: { fontSize: fontSize.lg, color: colors.textSecondary, marginBottom: spacing.xl, lineHeight: fontSize.lg * 1.5, textAlign: 'center' },
    label: { fontSize: fontSize.md, color: colors.text, marginBottom: spacing.sm, fontWeight: '500' },
    input: { fontSize: fontSize.lg },
});

return (
  <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
      <View style={styles.form}>
        <Text style={dynamicStyles.title}>Crie sua Conta</Text>
        <Text style={dynamicStyles.subtitle}>{type === 'patient' ? 'Digite seu nome para começar.' : 'Digite seu nome para cuidar de alguém.'}</Text>
        <View style={styles.inputContainer}>
          <Text style={dynamicStyles.label}>Seu Nome Completo</Text>
          <TextInput style={[styles.input, dynamicStyles.input]} value={name} onChangeText={setName} placeholder="Ex: Maria da Silva" autoCapitalize="words"/>
        </View>
        <Button title="Criar Conta e Entrar" onPress={handleCreateAccount} variant="success" size="large" disabled={!name.trim()} loading={loading}/>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
  content: { flex: 1 },
  form: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  inputContainer: { marginBottom: spacing.xl },
  input: { borderWidth: 2, borderColor: colors.border, borderRadius: 12, padding: spacing.md, color: colors.text, backgroundColor: colors.cardBackground },
});