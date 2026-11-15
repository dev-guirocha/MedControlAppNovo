import React, { useRef, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { colors, getContentColorOn, getFontSize, medicationColors, spacing } from '@/constants/theme';
import { useAuthStore } from '@/hooks/useAuthStore';
import { usePeopleStore } from '@/hooks/usePeopleStore';
import { addPerson, deletePerson, updatePerson } from '@/lib/personActions';
import { parseBirthYear, pickPersonColor } from '@/lib/people';
import { showErrorToast } from '@/lib/toastHelper';
import { Button } from '@/components/Button';
import { Text } from '@/components/StyledText';
import type { Person } from '@/types/medication';

const GENDERS: { key: NonNullable<Person['gender']>; label: string }[] = [
  { key: 'female', label: 'Feminino' },
  { key: 'male', label: 'Masculino' },
  { key: 'other', label: 'Outro' },
  { key: 'preferNotToSay', label: 'Prefiro não dizer' },
];

const GENERIC_ERROR = 'Não foi possível salvar. Tente novamente.';

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : GENERIC_ERROR;
}

export default function EditPersonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const people = usePeopleStore((s) => s.people);
  const fontSize = getFontSize(useAuthStore((s) => s.fontScale));

  const editing = id ? people.find((p) => p.id === id) : undefined;
  const firstPerson = people.length === 1 ? people[0] : undefined;

  // Etapa 1: ao cadastrar a segunda pessoa (já existe exatamente uma), confirmar o nome
  // da primeira. Derivado aqui, sem depender de parâmetro de rota.
  const [step, setStep] = useState<'confirm' | 'form'>(!id && firstPerson ? 'confirm' : 'form');
  // Marca exclusão em andamento/concluída: evita piscar "Pessoa não encontrada" ao voltar.
  const deleted = useRef(false);
  const [firstName, setFirstName] = useState(firstPerson?.name ?? '');

  const [name, setName] = useState(editing?.name ?? '');
  const [color, setColor] = useState(editing?.color ?? pickPersonColor(people, medicationColors));
  const [birthYearText, setBirthYearText] = useState(editing?.birthYear ? String(editing.birthYear) : '');
  const [gender, setGender] = useState<Person['gender']>(editing?.gender);
  const [loading, setLoading] = useState(false);

  const dynamic = StyleSheet.create({
    title: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
    label: { fontSize: fontSize.md, fontWeight: '500', color: colors.text, marginBottom: spacing.sm },
    input: {
      fontSize: fontSize.lg,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      padding: spacing.md,
      color: colors.text,
      backgroundColor: colors.cardBackground,
      minHeight: 56,
    },
    helper: { fontSize: fontSize.sm, color: colors.danger, marginTop: spacing.xs },
    optionText: { fontSize: fontSize.md, color: colors.text },
  });

  // Editando um id que não existe mais (ex.: acabou de ser excluída).
  if (id && !editing) {
    if (deleted.current) return null;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={dynamic.title}>Pessoa não encontrada.</Text>
          <Button title="Voltar" onPress={() => router.back()} variant="success" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const handleConfirmFirst = async () => {
    const trimmed = firstName.trim();
    if (!trimmed || !firstPerson) return;
    if (trimmed !== firstPerson.name) {
      setLoading(true);
      try {
        // Corrigir o nome aqui significa "estes remédios são de outra pessoa": deixa de ser "eu".
        await updatePerson(firstPerson.id, { name: trimmed, ...(firstPerson.isSelf ? { isSelf: false } : {}) });
      } catch (error) {
        showErrorToast(errorMessage(error));
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    setStep('form');
  };

  if (step === 'confirm') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={dynamic.title}>Os remédios atuais são de quem?</Text>
          <Text style={[styles.hint, { fontSize: fontSize.md }]}>
            Confirme o nome antes de adicionar outra pessoa. Ele aparecerá nos lembretes e nos remédios.
          </Text>
          <Text style={dynamic.label}>Nome</Text>
          <TextInput
            style={dynamic.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Ex: Maria"
            autoCapitalize="words"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Nome da pessoa dos remédios atuais"
          />
        </ScrollView>
        <View style={styles.footer}>
          <Button
            title="Continuar"
            onPress={handleConfirmFirst}
            variant="success"
            size="large"
            disabled={!firstName.trim()}
            loading={loading}
          />
        </View>
      </SafeAreaView>
    );
  }

  const birth = parseBirthYear(birthYearText);
  const canSave = name.trim().length > 0 && birth.valid;

  const handleSave = async () => {
    if (!canSave) return;
    setLoading(true);
    try {
      if (editing) {
        await updatePerson(editing.id, {
          name: name.trim(),
          color,
          birthYear: birth.value,
          gender,
        });
      } else {
        await addPerson({ name: name.trim(), color, birthYear: birth.value, gender });
      }
      router.back();
    } catch (error) {
      showErrorToast(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert(
      `Excluir ${editing.name}?`,
      `Remédios, doses, consultas e anamnese de ${editing.name} serão apagados. Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            deleted.current = true;
            try {
              await deletePerson(editing.id);
              router.back();
            } catch (error) {
              deleted.current = false;
              showErrorToast(errorMessage(error));
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={dynamic.title}>{editing ? 'Editar pessoa' : 'Nova pessoa'}</Text>

        <View style={styles.group}>
          <Text style={dynamic.label}>Nome</Text>
          <TextInput
            style={dynamic.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Maria"
            autoCapitalize="words"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Nome da pessoa"
          />
        </View>

        <View style={styles.group}>
          <Text style={dynamic.label}>Cor</Text>
          <View style={styles.colorRow} accessibilityRole="radiogroup">
            {medicationColors.map((c) => {
              const selected = c === color;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Cor ${medicationColors.indexOf(c) + 1}`}
                  style={[styles.swatch, { backgroundColor: c }, selected && styles.swatchSelected]}
                >
                  {selected && <Check size={20} color={getContentColorOn(c)} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.group}>
          <Text style={dynamic.label}>Ano de nascimento (opcional)</Text>
          <TextInput
            style={dynamic.input}
            value={birthYearText}
            onChangeText={(t) => setBirthYearText(t.replace(/\D/g, '').slice(0, 4))}
            placeholder="Ex: 1950"
            keyboardType="number-pad"
            maxLength={4}
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Ano de nascimento"
          />
          {!birth.valid && (
            <Text style={dynamic.helper}>Use 4 dígitos, entre 1900 e {new Date().getFullYear()}.</Text>
          )}
        </View>

        <View style={styles.group}>
          <Text style={dynamic.label}>Gênero (opcional)</Text>
          <View style={styles.optionsContainer}>
            {GENDERS.map((item) => {
              const selected = gender === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setGender(selected ? undefined : item.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={item.label}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Text style={[dynamic.optionText, selected && { color: colors.textInverse }]}>{item.label}</Text>
                  {selected && <Check size={16} color={colors.textInverse} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {editing && people.length > 1 && (
          <Button title="Excluir pessoa" onPress={handleDelete} variant="danger" size="large" disabled={loading} />
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={editing ? 'Salvar alterações' : 'Adicionar pessoa'}
          onPress={handleSave}
          variant="success"
          size="large"
          disabled={!canSave}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  hint: { color: colors.textSecondary, marginBottom: spacing.lg },
  group: { marginBottom: spacing.lg },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  swatch: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: colors.text },
  optionsContainer: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  footer: { padding: spacing.lg },
});
