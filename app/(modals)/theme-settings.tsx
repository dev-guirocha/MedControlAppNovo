import { SafeAreaView, StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { colors, spacing } from '@/constants/theme';
import { useThemeStore, ThemePref } from '@/hooks/useThemeStore';
import { Text } from '@/components/StyledText';

const OPTIONS: { key: ThemePref; label: string; desc: string }[] = [
  { key: 'system', label: 'Seguir o sistema', desc: 'Usa o tema do aparelho' },
  { key: 'light', label: 'Claro', desc: 'Fundo branco e texto escuro' },
  { key: 'dark', label: 'Escuro', desc: 'Fundo escuro e texto claro' },
];

export default function ThemeSettingsModal() {
  const { mode, setTheme } = useThemeStore();

  const onSelect = async (key: ThemePref) => {
    await setTheme(key, false);
    Alert.alert('Tema atualizado', 'O app será recarregado para aplicar o tema.', [
      {
        text: 'OK',
        onPress: async () => {
          await setTheme(key, true);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Tema do App' }} />
      <View style={styles.content}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity key={opt.key} style={styles.item} onPress={() => onSelect(opt.key)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{opt.label}</Text>
              <Text style={styles.desc}>{opt.desc}</Text>
            </View>
            {mode === opt.key ? <Text style={{ color: colors.primary }}>✓</Text> : null}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  title: { fontWeight: '600', color: colors.text },
  desc: { color: colors.textSecondary },
});

