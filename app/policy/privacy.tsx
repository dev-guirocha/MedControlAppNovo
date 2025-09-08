import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Text } from '@/components/StyledText';
import { colors, spacing } from '@/constants/theme';
import { useAuthStore } from '@/hooks/useAuthStore';
import { getFontSize } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.paragraph, { fontSize: fontSize.sm, color: colors.textSecondary }]}>
          Última atualização: 7 de Setembro de 2025
        </Text>
        <Text style={[styles.paragraph, { fontSize: fontSize.md, lineHeight: fontSize.md * 1.5 }]}>
          Bem-vindo ao MedControl. A sua privacidade é nossa prioridade.
        </Text>
        <Text style={[styles.title, { fontSize: fontSize.lg }]}>1. Informações Coletadas</Text>
        <Text style={[styles.paragraph, { fontSize: fontSize.md, lineHeight: fontSize.md * 1.5 }]}>
          Todas as informações que você nos fornece (nome, medicamentos, dosagens, horários, etc.) são armazenadas exclusivamente no seu dispositivo. Nós não coletamos, enviamos ou temos acesso a nenhum dos seus dados pessoais ou de saúde.
        </Text>
        <Text style={[styles.title, { fontSize: fontSize.lg }]}>2. Uso das Informações</Text>
        <Text style={[styles.paragraph, { fontSize: fontSize.md, lineHeight: fontSize.md * 1.5 }]}>
          Suas informações são utilizadas apenas para o funcionamento local do aplicativo, como agendar notificações de lembretes e exibir seu histórico.
        </Text>
        <Text style={[styles.title, { fontSize: fontSize.lg }]}>3. Segurança</Text>
        <Text style={[styles.paragraph, { fontSize: fontSize.md, lineHeight: fontSize.md * 1.5 }]}>
          A segurança dos seus dados está diretamente ligada à segurança do seu próprio dispositivo. Recomendamos que utilize as medidas de segurança do seu aparelho, como senhas e biometria.
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