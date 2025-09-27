// MedControlAppNovo/app/(tabs)/profile.tsx

import React from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, ScrollView, ColorValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/hooks/useAuthStore';
import { FileText, ChevronRight, Pencil, ShieldCheck, FileType, TextQuote } from 'lucide-react-native';
import { Text } from '@/components/StyledText';

// --- Componentes Reutilizáveis para a Lista ---
type SettingsItemProps = {
    icon?: React.ComponentType<{ size?: number | string; color?: ColorValue; style?: any }>;
    text: string;
    onPress: () => void;
};

const SettingsItem: React.FC<SettingsItemProps> = ({ icon: Icon, text, onPress }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
        <View style={styles.itemContent}>
            {Icon && <Icon size={22} color={colors.textSecondary} style={styles.itemIcon} />}
            <Text style={styles.itemText}>{text}</Text>
        </View>
        <ChevronRight size={20} color={colors.disabled} />
    </TouchableOpacity>
);

// ✅ REMOVEMOS O COMPONENTE FontSizeSelector antigo daqui

// --- Tela Principal do Perfil ---

export default function ProfileScreen() {
  const router = useRouter();
  const { userProfile, saveUserProfile } = useAuthStore();
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);
  const userInitial = userProfile?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  const handleLogout = () => {
    Alert.alert('Sair da Conta', 'Tem certeza que deseja sair?',
      [{ text: 'Cancelar' }, { text: 'Sair', style: 'destructive',
          onPress: async () => {
            if (userProfile) {
              await saveUserProfile({ ...userProfile, onboardingCompleted: false });
              router.replace('/(onboarding)');
            }
          },
        },
      ]
    );
  };

  if (!userProfile) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  // Estilos dinâmicos baseados na escala da fonte
  const dynamicStyles = StyleSheet.create({
    userName: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text },
    userType: { fontSize: fontSize.md, color: colors.textSecondary, textTransform: 'capitalize' },
    sectionTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
    itemText: { fontSize: fontSize.md, color: colors.text, fontWeight: '500' },
  });


  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Cabeçalho do Perfil */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}><Text style={styles.avatarInitial}>{userInitial}</Text></View>
        <View style={styles.profileInfo}>
          <Text style={dynamicStyles.userName}>{userProfile.name}</Text>
          <Text style={dynamicStyles.userType}>{userProfile.type === 'patient' ? 'Paciente' : 'Cuidador(a)'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(modals)/edit-profile')} style={styles.editButton}>
          <Pencil size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>CONTA</Text>
            <View style={styles.card}>
                <SettingsItem text="Questionário de Anamnese" icon={FileText} onPress={() => router.push('/(modals)/anamnesis')} />
            </View>
        </View>
        
        {/* ✅ SEÇÃO DE PREFERÊNCIAS ATUALIZADA */}
        <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>PREFERÊNCIAS</Text>
            <View style={styles.card}>
                <SettingsItem 
                  text="Tamanho do Texto" 
                  icon={TextQuote} 
                  onPress={() => router.push('/(modals)/font-size-settings')} 
                />
            </View>
        </View>

        <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>SOBRE O APP</Text>
            <View style={styles.card}>
                <SettingsItem text="Política de Privacidade" icon={ShieldCheck} onPress={() => router.push('/policy/privacy')} />
                <View style={styles.divider} />
                <SettingsItem text="Termos de Serviço" icon={FileType} onPress={() => router.push('/policy/terms')} />
            </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Sair da Conta" variant="danger" onPress={handleLogout} />
      </View>
    </SafeAreaView>
  );
}

// Estilos foram ajustados para usar os estilos dinâmicos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.primaryFaded, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  avatarInitial: { fontSize: 28, fontWeight: '700', color: colors.primary },
  profileInfo: { flex: 1 },
  editButton: { padding: spacing.sm },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: 0,
    backgroundColor: colors.background,
  },
  section: { marginBottom: spacing.lg },
  card: { backgroundColor: colors.cardBackground, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  itemContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, minHeight: 56, backgroundColor: 'transparent' },
  itemContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemIcon: { marginRight: spacing.md },
  itemText: { color: colors.text, fontWeight: '500' }, // Tamanho da fonte agora é dinâmico
  divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.md * 2 + 22 },
  // ✅ REMOVEMOS OS ESTILOS ANTIGOS DO FONTSIZESELECTOR AQUI
});
