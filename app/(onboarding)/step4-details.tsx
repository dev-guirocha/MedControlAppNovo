import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Text } from '@/components/StyledText';
import { Check } from 'lucide-react-native';

const GENDERS = [
  { key: 'female', label: 'Feminino' },
  { key: 'male', label: 'Masculino' },
  { key: 'other', label: 'Outro' },
  { key: 'preferNotToSay', label: 'Prefiro não dizer' },
];

export default function DetailsScreen() {
  const router = useRouter();
  const { userProfile, updateUserProfile } = useAuthStore();
  const [gender, setGender] = useState(userProfile?.gender);
  // O ano de nascimento é opcional, então não o tornaremos obrigatório
  const [birthYear, setBirthYear] = useState(userProfile?.birthYear);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    await updateUserProfile({ gender, birthYear });
    setLoading(false);
    router.push('/(onboarding)/step5-notifications');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Conte-nos um pouco sobre você</Text>
        <Text style={styles.subtitle}>Essas informações são opcionais e nos ajudam a personalizar o aplicativo.</Text>
        
        <Text style={styles.sectionTitle}>Gênero</Text>
        <View style={styles.optionsContainer}>
          {GENDERS.map((item) => (
            <TouchableOpacity 
              key={item.key} 
              style={[styles.optionButton, gender === item.key && styles.optionButtonSelected]}
              onPress={() => setGender(item.key as any)}
            >
              <Text style={[styles.optionText, gender === item.key && styles.optionTextSelected]}>{item.label}</Text>
              {gender === item.key && <Check size={16} color={colors.background} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Adicione o seletor de ano de nascimento aqui se desejar */}
        {/* Por simplicidade, pulamos a implementação de um picker complexo,
            mas você pode adicionar um TextInput ou um picker customizado aqui. */}

      </ScrollView>
      <View style={styles.footer}>
        <Button title="Próximo" onPress={handleContinue} size="large" loading={loading}/>
        <TouchableOpacity onPress={() => router.push('/(onboarding)/step5-notifications')}>
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center' },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
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
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: getFontSize('large').lg,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 56,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: getFontSize('large').md,
    color: colors.text,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: colors.background,
  },
  skipText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    fontWeight: '500',
  }
});