import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { User, Heart } from 'lucide-react-native';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Text } from '@/components/StyledText'; // Importação alterada

export default function WelcomeScreen() {
  const router = useRouter();
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);

  const dynamicStyles = StyleSheet.create({
    title: {
        fontSize: fontSize.xxxl,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: fontSize.lg,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xxl,
    },
    optionTitle: {
        fontSize: fontSize.xl,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    optionDescription: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={dynamicStyles.title}>Bem-vindo ao MedControl</Text>
        <Text style={dynamicStyles.subtitle}>Para quem é este perfil?</Text>
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionBox} onPress={() => router.push({ pathname: '/register', params: { type: 'patient' } })} activeOpacity={0.7}>
            <View style={styles.iconContainer}><User size={48} color={colors.primary} /></View>
            <Text style={dynamicStyles.optionTitle}>Para Mim</Text>
            <Text style={dynamicStyles.optionDescription}>Vou gerenciar meus próprios medicamentos.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionBox} onPress={() => router.push({ pathname: '/register', params: { type: 'caregiver' } })} activeOpacity={0.7}>
            <View style={styles.iconContainer}><Heart size={48} color={colors.primary} /></View>
            <Text style={dynamicStyles.optionTitle}>Para Outra Pessoa</Text>
            <Text style={dynamicStyles.optionDescription}>Sou cuidador(a) e vou ajudar alguém.</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  optionsContainer: { gap: spacing.lg },
  optionBox: { backgroundColor: colors.cardBackground, padding: spacing.lg, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  iconContainer: { marginBottom: spacing.md },
});