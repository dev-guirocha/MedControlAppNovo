import React, { useState } from 'react';
import { View, StyleSheet, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Text } from '@/components/StyledText';
import { usePeopleStore } from '@/hooks/usePeopleStore';
import { addPerson } from '@/lib/personActions';
import { parseBirthYear } from '@/lib/people';
import { showErrorToast } from '@/lib/toastHelper';
import type { Person } from '@/types/medication';

const GENDERS: { key: NonNullable<Person['gender']>; label: string }[] = [
  { key: 'female', label: 'Feminino' },
  { key: 'male', label: 'Masculino' },
  { key: 'other', label: 'Outro' },
  { key: 'preferNotToSay', label: 'Prefiro não dizer' },
];

// Só cuidador sem pessoas cadastradas chega aqui (vindo de step4-details).
export default function OnboardingPeopleScreen() {
  const router = useRouter();
  const people = usePeopleStore((s) => s.people);
  const [name, setName] = useState('');
  const [birthYearText, setBirthYearText] = useState('');
  const [gender, setGender] = useState<Person['gender']>();
  const [loading, setLoading] = useState(false);

  const birth = parseBirthYear(birthYearText);
  const hasName = name.trim().length > 0;
  const canAddCurrent = hasName && birth.valid;
  // Para continuar: a pessoa atual (se preenchida) ou alguma já adicionada.
  const canContinue = people.length > 0 ? !hasName || canAddCurrent : canAddCurrent;

  const saveCurrent = async (): Promise<boolean> => {
    try {
      await addPerson({ name: name.trim(), birthYear: birth.value, gender });
      return true;
    } catch (error) {
      showErrorToast(error instanceof Error && error.message ? error.message : 'Não foi possível salvar. Tente novamente.');
      return false;
    }
  };

  const handleAddAnother = async () => {
    if (!canAddCurrent || loading) return;
    setLoading(true);
    const ok = await saveCurrent();
    setLoading(false);
    if (ok) {
      setName('');
      setBirthYearText('');
      setGender(undefined);
    }
  };

  const handleContinue = async () => {
    if (!canContinue || loading) return;
    if (hasName) {
      setLoading(true);
      const ok = await saveCurrent();
      setLoading(false);
      if (!ok) return;
    }
    router.push('/(onboarding)/step5-notifications');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Quem você vai acompanhar?</Text>
          {people.length > 0 && (
            <Text style={styles.added}>Já adicionadas: {people.map((p) => p.name).join(', ')}</Text>
          )}
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nome da pessoa"
            autoCapitalize="words"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Nome da pessoa"
          />
          <Text style={styles.label}>Ano de nascimento (opcional)</Text>
          <TextInput
            style={styles.input}
            value={birthYearText}
            onChangeText={(t) => setBirthYearText(t.replace(/\D/g, '').slice(0, 4))}
            placeholder="Ex: 1950"
            keyboardType="number-pad"
            maxLength={4}
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Ano de nascimento"
          />
          {!birth.valid && (
            <Text style={styles.error}>Use 4 dígitos, entre 1900 e {new Date().getFullYear()}.</Text>
          )}
          <Text style={styles.label}>Gênero (opcional)</Text>
          <View style={styles.optionsContainer}>
            {GENDERS.map((item) => {
              const selected = gender === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => setGender(selected ? undefined : item.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={item.label}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{item.label}</Text>
                  {selected && <Check size={16} color={colors.textInverse} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button title="Adicionar outra" onPress={handleAddAnother} variant="secondary" size="large" disabled={!canAddCurrent} loading={loading} />
          <Button title="Próximo" onPress={handleContinue} size="large" disabled={!canContinue} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  footer: { padding: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  title: {
    fontSize: getFontSize('large').xxxl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  added: { fontSize: getFontSize('large').md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  label: { fontSize: getFontSize('large').md, fontWeight: '500', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  input: {
    fontSize: getFontSize('large').lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
    backgroundColor: colors.cardBackground,
    minHeight: 56,
  },
  error: { fontSize: getFontSize('large').sm, color: colors.danger, marginTop: spacing.xs },
  optionsContainer: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 52,
  },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontSize: getFontSize('large').md, color: colors.text, fontWeight: '500' },
  optionTextSelected: { color: colors.textInverse },
});
