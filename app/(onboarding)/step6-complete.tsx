import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Text } from '@/components/StyledText';
import { CheckCircle2 } from 'lucide-react-native';
import { usePeopleStore } from '@/hooks/usePeopleStore';
import { addPerson } from '@/lib/personActions';
import { showErrorToast } from '@/lib/toastHelper';

const ChecklistItem = ({ text, done }: { text: string; done: boolean }) => (
  <View style={styles.checklistItem}>
    <View style={[styles.checklistIcon, done && styles.checklistIconDone]}>
      <CheckCircle2 size={20} color={done ? colors.textInverse : colors.textSecondary} />
    </View>
    <Text style={[styles.checklistText, done && styles.checklistTextDone]}>{text}</Text>
  </View>
);


export default function OnboardingCompleteScreen() {
  const router = useRouter();
  const { userProfile, updateUserProfile } = useAuthStore();

  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // "Para mim" sem ninguém cadastrado: cria a pessoa "eu" com os dados do perfil.
      // Se já existem pessoas (refazer configuração), o sync do perfil cuida da pessoa "eu".
      if (userProfile?.type === 'patient' && usePeopleStore.getState().people.length === 0) {
        await addPerson({
          name: userProfile.name,
          birthYear: userProfile.birthYear,
          gender: userProfile.gender,
          isSelf: true,
        });
      }
      await updateUserProfile({ onboardingCompleted: true });
      router.replace('/(tabs)/home');
    } catch (error) {
      showErrorToast(error instanceof Error && error.message ? error.message : 'Não foi possível concluir. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Tudo pronto, {userProfile?.name}!</Text>
        <Text style={styles.subtitle}>
          Seu perfil foi criado. Agora você pode começar a gerenciar sua saúde.
        </Text>
        
        <View style={styles.checklistContainer}>
          <Text style={styles.checklistTitle}>Próximos passos</Text>
          <ChecklistItem text="Crie seu perfil" done={true} />
          <ChecklistItem text="Configure os lembretes" done={true} />
          <ChecklistItem text="Adicione seus medicamentos" done={false} />
          <ChecklistItem text="Adicione suas consultas" done={false} />
        </View>

      </View>
      <View style={styles.footer}>
        <Button 
          title="Ir para o Início" 
          onPress={handleFinish} 
          size="large" 
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: spacing.xl 
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: getFontSize('large').xxxl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: getFontSize('large').lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checklistContainer: {
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checklistTitle: {
    fontSize: getFontSize('large').lg,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checklistIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checklistIconDone: {
    backgroundColor: colors.success,
  },
  checklistText: {
    fontSize: getFontSize('large').md,
    color: colors.textSecondary,
  },
  checklistTextDone: {
    color: colors.text,
    textDecorationLine: 'line-through',
  },
});
