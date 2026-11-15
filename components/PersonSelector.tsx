import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors, getContentColorOn, getFontSize, spacing } from '@/constants/theme';
import { useAuthStore } from '@/hooks/useAuthStore';
import { usePeopleStore } from '@/hooks/usePeopleStore';
import { Text } from '@/components/StyledText';

/** Escolhe a pessoa ativa (filtro de Remédios, Histórico, Consultas e Anamnese). Some com menos de 2 pessoas. */
export function PersonSelector() {
  const people = usePeopleStore((s) => s.people);
  const activePersonId = usePeopleStore((s) => s.activePersonId);
  const setActivePerson = usePeopleStore((s) => s.setActivePerson);
  const fontScale = useAuthStore((s) => s.fontScale);
  const fontSize = getFontSize(fontScale);

  if (people.length < 2) return null;

  return (
    <View accessibilityRole="radiogroup">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.scroll}
      >
        {people.map((person) => {
          const selected = person.id === activePersonId;
          const textColor = getContentColorOn(person.color);
          return (
            <TouchableOpacity
              key={person.id}
              onPress={() => void setActivePerson(person.id)}
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

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
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
});
