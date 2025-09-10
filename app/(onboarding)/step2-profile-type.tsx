import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { User, Heart } from 'lucide-react-native';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Text } from '@/components/StyledText';
import * as Crypto from 'expo-crypto';
import { UserProfile } from '@/types/medication';

export default function ProfileTypeScreen() {
  const router = useRouter();
  const saveUserProfile = useAuthStore((state) => state.saveUserProfile);

  const handleSelectType = (type: 'patient' | 'caregiver') => {
    // Cria um objeto de perfil inicial. O resto dos dados será preenchido nas próximas telas.
    const profile: UserProfile = {
      id: Crypto.randomUUID(),
      name: '',
      type,
      createdAt: new Date().toISOString(),
      onboardingCompleted: false,
    };
    saveUserProfile(profile);
    router.push('/(onboarding)/step3-name');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Para quem é este perfil?</Text>
        <Text style={styles.subtitle}>Isso nos ajuda a personalizar sua experiência.</Text>
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionBox} onPress={() => handleSelectType('patient')} activeOpacity={0.7}>
            <View style={styles.iconContainer}><User size={48} color={colors.primary} /></View>
            <Text style={styles.optionTitle}>Para Mim</Text>
            <Text style={styles.optionDescription}>Vou gerenciar meus próprios medicamentos.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionBox} onPress={() => handleSelectType('caregiver')} activeOpacity={0.7}>
            <View style={styles.iconContainer}><Heart size={48} color={colors.primary} /></View>
            <Text style={styles.optionTitle}>Para Outra Pessoa</Text>
            <Text style={styles.optionDescription}>Sou cuidador(a) e vou ajudar alguém.</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  title: {
    fontSize: getFontSize('large').xxxl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: getFontSize('large').lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  optionsContainer: { gap: spacing.lg },
  optionBox: { 
    backgroundColor: colors.cardBackground, 
    padding: spacing.lg, 
    borderRadius: 16, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  iconContainer: { marginBottom: spacing.md },
  optionTitle: {
    fontSize: getFontSize('large').xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: getFontSize('large').md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});