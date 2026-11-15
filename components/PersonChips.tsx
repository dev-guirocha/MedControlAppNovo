import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors, getContentColorOn, getFontSize, spacing } from '@/constants/theme';
import { useAuthStore } from '@/hooks/useAuthStore';
import { usePeopleStore } from '@/hooks/usePeopleStore';
import { shouldShowPersonNames } from '@/lib/people';
import { Text } from '@/components/StyledText';

type PersonChipsProps = {
  value: string | null | undefined;
  onChange: (personId: string) => void;
  /** Recuo horizontal da fileira (a barra do app usa spacing.lg; nos formulários, 0). */
  inset?: number;
};

/** Chips de pessoa controlados por `value`/`onChange` (não mexem na pessoa ativa do app). Somem com menos de 2 pessoas. */
export function PersonChips({ value, onChange, inset = 0 }: PersonChipsProps) {
  const people = usePeopleStore((s) => s.people);
  const fontScale = useAuthStore((s) => s.fontScale);
  const fontSize = getFontSize(fontScale);

  if (people.length < 2) return null;

  return (
    <View accessibilityRole="radiogroup">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, { paddingHorizontal: inset }]}
        style={styles.scroll}
      >
        {people.map((person) => {
          const selected = person.id === value;
          const textColor = getContentColorOn(person.color);
          return (
            <TouchableOpacity
              key={person.id}
              onPress={() => onChange(person.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={person.name}
              activeOpacity={0.7}
              // Selecionado: preenchido com a cor e borda forte; os demais: só a cor na borda e no ponto.
              style={[
                styles.chip,
                selected
                  ? { backgroundColor: person.color, borderColor: colors.text }
                  : { backgroundColor: colors.cardBackground, borderColor: colors.border },
              ]}
            >
              {!selected && <View style={[styles.dot, { backgroundColor: person.color }]} />}
              <Text
                numberOfLines={1}
                style={{
                  fontSize: fontSize.md,
                  fontWeight: selected ? '700' : '500',
                  color: selected ? textColor : colors.text,
                }}
              >
                {person.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

type PersonFieldProps = {
  value: string | null | undefined;
  onChange: (personId: string) => void;
  /** Na edição o dono não muda: mostra só "Para: <nome>". */
  readOnly?: boolean;
};

/** Linha "Para:" dos cadastros. Só aparece com 2+ pessoas. */
export function PersonField({ value, onChange, readOnly }: PersonFieldProps) {
  const people = usePeopleStore((s) => s.people);
  const fontScale = useAuthStore((s) => s.fontScale);
  const fontSize = getFontSize(fontScale);

  if (!shouldShowPersonNames(people)) return null;

  if (readOnly) {
    const name = people.find((p) => p.id === value)?.name;
    if (!name) return null;
    return (
      <View style={styles.field}>
        <Text style={[styles.label, { fontSize: fontSize.md }]}>Para: {name}</Text>
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { fontSize: fontSize.md }]}>Para:</Text>
      <PersonChips value={value} onChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { paddingVertical: spacing.sm, gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: 22,
    borderWidth: 2,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  field: { marginBottom: spacing.lg },
  label: { fontWeight: '600', color: colors.text },
});
