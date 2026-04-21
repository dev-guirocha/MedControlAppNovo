import React, { useState } from 'react';
import { View, StyleSheet, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Text } from '@/components/StyledText';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';

export default function NameScreen() {
  const router = useRouter();
  const { userProfile, updateUserProfile } = useAuthStore();
  const [name, setName] = useState(userProfile?.name || '');
  const [photoUri, setPhotoUri] = useState<string | undefined>(userProfile?.photoUrl);
  const [loading, setLoading] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  const handleContinue = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await updateUserProfile({ name: name.trim(), photoUrl: photoUri });
    setLoading(false);
    router.push('/(onboarding)/step4-details');
  };

  const handlePickImage = async () => {
    setLoadingPhoto(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissao Necessaria', 'Voce precisa permitir o acesso a galeria para escolher uma foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: Platform.OS === 'ios',
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar foto no onboarding:', error);
      Alert.alert('Erro', 'Nao foi possivel abrir a galeria.');
    } finally {
      setLoadingPhoto(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.content}>
          <Text style={styles.title}>Como podemos te chamar?</Text>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} disabled={loadingPhoto}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Camera size={48} color={colors.primary} />
              </View>
            )}
            <Text style={styles.avatarText}>
              {loadingPhoto ? 'Abrindo galeria...' : 'Toque para adicionar uma foto (opcional)'}
            </Text>
          </TouchableOpacity>
          <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
            placeholder="Digite seu nome ou apelido" 
            autoCapitalize="words"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={styles.footer}>
          <Button title="Próximo" onPress={handleContinue} size="large" disabled={!name.trim()} loading={loading}/>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  title: {
    fontSize: getFontSize('large').xxxl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarText: {
    color: colors.primary,
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  input: {
    fontSize: getFontSize('large').lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
    backgroundColor: colors.cardBackground,
    minHeight: 56,
    textAlign: 'center',
  },
});
