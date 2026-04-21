import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/hooks/useAuthStore';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Text } from '@/components/StyledText';
import { User, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
    const router = useRouter();
    const { userProfile, updateUserProfile } = useAuthStore();
    const fontSize = getFontSize(useAuthStore.getState().fontScale);
    const [name, setName] = useState(userProfile?.name || '');
    const [photoUri, setPhotoUri] = useState(userProfile?.photoUrl || '');
    const [loading, setLoading] = useState(false);
    const [loadingPhoto, setLoadingPhoto] = useState(false);

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
            console.error('Erro ao selecionar foto de perfil:', error);
            Alert.alert('Erro', 'Nao foi possivel abrir a galeria.');
        } finally {
            setLoadingPhoto(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setLoading(true);
        await updateUserProfile({
            name: name.trim(),
            photoUrl: photoUri || undefined,
        });
        setLoading(false);
        router.back();
    };

    if (!userProfile) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    const dynamicStyles = StyleSheet.create({
        label: { fontSize: fontSize.md, fontWeight: '500', color: colors.text, marginBottom: spacing.sm },
        input: {
            fontSize: fontSize.lg,
            borderWidth: 2,
            borderColor: colors.border,
            borderRadius: 12,
            padding: spacing.md,
            color: colors.text,
            backgroundColor: colors.cardBackground,
            minHeight: 56,
        },
        placeholderText: { fontSize: fontSize.md, color: colors.textSecondary },
        nameTitle: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={dynamicStyles.nameTitle}>Editar Dados do Perfil</Text>
                
                <View style={styles.photoContainer}>
                    {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.photoImage} />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <ImageIcon size={64} color={colors.textSecondary} />
                        </View>
                    )}
                    <TouchableOpacity style={styles.editPhotoButton} onPress={handlePickImage} disabled={loadingPhoto}>
                        <Text style={styles.editPhotoText}>
                            {loadingPhoto ? 'Abrindo galeria...' : 'Alterar Foto'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[dynamicStyles.label]}>Seu Nome</Text>
                    <TextInput 
                        style={[styles.input, dynamicStyles.input]}
                        value={name} 
                        onChangeText={setName} 
                        placeholder="Ex: Maria da Silva" 
                        autoCapitalize="words"
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>
                
                <View style={styles.bottomButtons}>
                    <Button title="Salvar Alterações" onPress={handleSave} variant="success" size="large" disabled={!name.trim()} loading={loading}/>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, justifyContent: 'space-between' },
    content: { flex: 1, padding: spacing.xl },
    photoContainer: { alignItems: 'center', marginBottom: spacing.xxl },
    photoPlaceholder: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: colors.cardBackground,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: colors.border,
        marginBottom: spacing.md,
    },
    photoImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: spacing.md,
    },
    editPhotoButton: {
        backgroundColor: '#D7E9FF',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 16,
    },
    editPhotoText: { color: '#143A63', fontWeight: '700' },
    inputGroup: { marginBottom: spacing.xl },
    input: {
        borderWidth: 2,
        borderColor: colors.border,
        borderRadius: 12,
        padding: spacing.md,
        color: colors.text,
        backgroundColor: colors.cardBackground,
        minHeight: 56,
    },
    bottomButtons: {
        marginTop: 'auto',
    },
});
