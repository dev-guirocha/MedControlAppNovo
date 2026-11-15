import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { useAuthStore } from '@/hooks/useAuthStore';
import { usePeopleStore } from '@/hooks/usePeopleStore';
import { Button } from '@/components/Button';
import { Text } from '@/components/StyledText';

export default function PeopleListScreen() {
  const router = useRouter();
  const people = usePeopleStore((s) => s.people);
  const fontSize = getFontSize(useAuthStore((s) => s.fontScale));

  const handleAdd = () => {
    // Com só 1 pessoa, primeiro confirma de quem são os remédios atuais.
    if (people.length === 1) {
      router.push({ pathname: '/(modals)/people/edit', params: { confirmFirst: '1' } });
    } else {
      router.push('/(modals)/people/edit');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {people.map((person, index) => (
            <View key={person.id}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push({ pathname: '/(modals)/people/edit', params: { id: person.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Editar ${person.name}${person.isSelf ? ', você' : ''}`}
                activeOpacity={0.7}
              >
                <View style={[styles.dot, { backgroundColor: person.color }]} />
                <Text style={{ fontSize: fontSize.lg, color: colors.text, flexShrink: 1 }} numberOfLines={1}>
                  {person.name}
                </Text>
                {person.isSelf && (
                  <View style={styles.tag}>
                    <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>você</Text>
                  </View>
                )}
                <View style={{ flex: 1 }} />
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button title="Adicionar pessoa" onPress={handleAdd} variant="success" size="large" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  card: { backgroundColor: colors.cardBackground, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, minHeight: 56 },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  dot: { width: 16, height: 16, borderRadius: 8 },
  tag: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  footer: { padding: spacing.lg },
});
