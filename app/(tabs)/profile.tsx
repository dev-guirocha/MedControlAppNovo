import React from 'react';
import { View, StyleSheet, SafeAreaView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/Button';
import { useAuthStore, FontScale } from '@/hooks/useAuthStore';
import { User, LogOut, Text as TextIcon, FileText } from 'lucide-react-native';
import { Text } from '@/components/StyledText';

export default function ProfileScreen() {
  const router = useRouter();
  const { userProfile, saveUserProfile, isLoading, fontScale, setFontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);

  const handleLogout = () => {
    Alert.alert( 'Sair da Conta', 'Tem a certeza de que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive',
          onPress: async () => {
            if (userProfile) {
              await saveUserProfile({ ...userProfile, onboardingCompleted: false });
            }
            router.replace('/welcome');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/(modals)/edit-profile');
  };

  const handleAnamnesis = () => {
    router.push('/(modals)/anamnesis');
  };

  if (isLoading || !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const dynamicStyles = StyleSheet.create({
    userName: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
        color: colors.text,
    },
    userType: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        textTransform: 'capitalize',
    },
    sectionTitle: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    settingLabel: {
        fontSize: fontSize.md,
        color: colors.text,
        marginBottom: spacing.md,
    },
    fontScaleText: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: fontSize.md,
    },
    fontScaleTextSelected: {
        color: colors.background,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View>
          <TouchableOpacity style={styles.card} onPress={handleEditProfile} activeOpacity={0.7}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}><User size={32} color={colors.primary} /></View>
              <View>
                <Text style={dynamicStyles.userName}>{userProfile.name}</Text>
                <Text style={dynamicStyles.userType}>{userProfile.type === 'patient' ? 'Paciente' : 'Cuidador(a)'}</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Novo cartão para o Questionário de Anamnese */}
          <TouchableOpacity style={styles.card} onPress={handleAnamnesis} activeOpacity={0.7}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={colors.textSecondary} />
              <Text style={dynamicStyles.sectionTitle}>Questionário de Anamnese</Text>
            </View>
            <Text style={styles.subtitle}>Mantenha seus dados médicos salvos para consultas futuras.</Text>
          </TouchableOpacity>
          
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <TextIcon size={20} color={colors.textSecondary} />
              <Text style={dynamicStyles.sectionTitle}>Acessibilidade</Text>
            </View>
            <Text style={dynamicStyles.settingLabel}>Tamanho do Texto</Text>
            <View style={styles.fontScaleContainer}>
              <TouchableOpacity 
                style={[styles.fontScaleButton, fontScale === 'small' && styles.fontScaleButtonSelected]}
                onPress={() => setFontScale('small')}
              >
                <Text style={[dynamicStyles.fontScaleText, fontScale === 'small' && dynamicStyles.fontScaleTextSelected]}>Pequeno</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.fontScaleButton, fontScale === 'medium' && styles.fontScaleButtonSelected]}
                onPress={() => setFontScale('medium')}
              >
                <Text style={[dynamicStyles.fontScaleText, fontScale === 'medium' && dynamicStyles.fontScaleTextSelected]}>Médio</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.fontScaleButton, fontScale === 'large' && styles.fontScaleButtonSelected]}
                onPress={() => setFontScale('large')}
              >
                <Text style={[dynamicStyles.fontScaleText, fontScale === 'large' && dynamicStyles.fontScaleTextSelected]}>Grande</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.logoutContainer}>
          <Button title="Sair" onPress={handleLogout} variant="danger" icon={<LogOut size={20} color={colors.background} />} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  card: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  logoutContainer: { paddingBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  subtitle: { fontSize: getFontSize('medium').md, color: colors.textSecondary, marginTop: -spacing.sm },
  fontScaleContainer: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  fontScaleButton: { flex: 1, padding: spacing.md, alignItems: 'center' },
  fontScaleButtonSelected: { backgroundColor: colors.primary, borderRadius: 10 },
});