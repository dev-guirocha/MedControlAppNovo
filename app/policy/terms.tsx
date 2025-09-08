import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Text } from '@/components/StyledText';
import { colors, spacing } from '@/constants/theme';
import { useAuthStore } from '@/hooks/useAuthStore';
import { getFontSize } from '@/constants/theme';

export default function TermsOfServiceScreen() {
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.paragraph, { fontSize: fontSize.sm, color: colors.textSecondary }]}>
          Última atualização: 7 de Setembro de 2025
        </Text>
        <Text style={[styles.title, { fontSize: fontSize.lg }]}>1. Aceitação dos Termos</Text>
        <Text style={[styles.paragraph, { fontSize: fontSize.md, lineHeight: fontSize.md * 1.5 }]}>
          Ao utilizar o aplicativo MedControl ("Serviço"), você concorda em cumprir estes Termos de Serviço.
        </Text>
        <Text style={[styles.title, { fontSize: fontSize.lg }]}>2. Isenção de Responsabilidade Médica</Text>
        <Text style={[styles.paragraph, { fontSize: fontSize.md, lineHeight: fontSize.md * 1.5 }]}>
          O MedControl é uma ferramenta de auxílio e não substitui o aconselhamento, diagnóstico ou tratamento médico profissional. A responsabilidade pelo gerenciamento correto da sua medicação é inteiramente sua. Sempre consulte seu médico para qualquer dúvida sobre sua saúde.
        </Text>
        <Text style={[styles.title, { fontSize: fontSize.lg }]}>3. Limitação de Responsabilidade</Text>
        <Text style={[styles.paragraph, { fontSize: fontSize.md, lineHeight: fontSize.md * 1.5 }]}>
          O uso do Serviço é por sua conta e risco. Não nos responsabilizamos por quaisquer imprecisões, falhas de notificação ou problemas decorrentes do uso do aplicativo.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { fontWeight: 'bold', marginBottom: spacing.sm, marginTop: spacing.md, color: colors.text },
  paragraph: { color: colors.textSecondary, marginBottom: spacing.md },
});