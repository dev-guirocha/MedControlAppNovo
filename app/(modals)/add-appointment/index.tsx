import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, SafeAreaView, TouchableOpacity, Modal, Pressable, Image, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppointmentStore } from '@/hooks/useAppointmentStore';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Button } from '@/components/Button';
import { Text } from '@/components/StyledText';
import DateTimePicker from '@react-native-community/datetimepicker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';

export default function AddAppointmentForm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addAppointment, updateAppointment } = useAppointmentStore();
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);

  const isEditing = !!params.id;

  const [formData, setFormData] = useState({
    id: params.id as string | undefined,
    doctorName: Array.isArray(params.doctorName) ? params.doctorName[0] : params.doctorName ?? '',
    specialty: Array.isArray(params.specialty) ? params.specialty[0] : params.specialty ?? '',
    location: Array.isArray(params.location) ? params.location[0] : params.location ?? '',
    notes: Array.isArray(params.notes) ? params.notes[0] : params.notes ?? '',
    date: params.date ? new Date(params.date as string) : new Date(),
    recipeImageUrl: Array.isArray(params.recipeImageUrl) ? params.recipeImageUrl[0] : (params.recipeImageUrl as string | undefined),
  });

  const [showPicker, setShowPicker] = useState(false);
  const [loadingCamera, setLoadingCamera] = useState(false);

  const handleTakePicture = useCallback(async () => {
    setLoadingCamera(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão Negada', 'Você precisa permitir o acesso à câmera para tirar fotos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
      if (!result.canceled && result.assets.length > 0) {
        setFormData(prev => ({ ...prev, recipeImageUrl: result.assets[0].uri }));
      }
    } catch (error) {
      console.error("Erro ao abrir a câmera: ", error);
      Alert.alert('Erro', 'Não foi possível abrir a câmera.');
    } finally {
      setLoadingCamera(false);
    }
  }, []);

  const handleSave = async () => {
    const appointmentData = {
      doctorName: formData.doctorName,
      specialty: formData.specialty,
      location: formData.location,
      notes: formData.notes,
      date: formData.date.toISOString(),
      recipeImageUrl: formData.recipeImageUrl,
    };
    if (isEditing) {
      await updateAppointment(formData.id!, appointmentData);
    } else {
      await addAppointment(appointmentData);
    }
    router.back();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || formData.date;
    setShowPicker(Platform.OS === 'ios');
    setFormData(prev => ({ ...prev, date: currentDate }));
  };

  const handleConfirmPicker = () => setShowPicker(false);
  const isValid = formData.doctorName && formData.specialty && formData.location;
  const dynamicStyles = {
    label: { fontSize: fontSize.md },
    input: { fontSize: fontSize.lg },
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Campos do formulário ... */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Nome do Doutor(a) *</Text>
            <TextInput style={[styles.input, dynamicStyles.input]} value={formData.doctorName} onChangeText={(text) => setFormData(prev => ({ ...prev, doctorName: text }))} placeholder="Ex: Dra. Ana Costa"/>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Especialidade *</Text>
            <TextInput style={[styles.input, dynamicStyles.input]} value={formData.specialty} onChangeText={(text) => setFormData(prev => ({ ...prev, specialty: text }))} placeholder="Ex: Cardiologista"/>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Local *</Text>
            <TextInput style={[styles.input, dynamicStyles.input]} value={formData.location} onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))} placeholder="Ex: Clínica São Lucas"/>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Data e Hora *</Text>
            <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.input, styles.dateInput]}>
              <Text style={dynamicStyles.input}>{formData.date.toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Notas (Opcional)</Text>
            <TextInput style={[styles.input, styles.textArea, dynamicStyles.input]} value={formData.notes} onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))} placeholder="Ex: Levar exames anteriores." multiline/>
          </View>
          
          {/* ✅ Área de visualização da receita */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Receita (Opcional)</Text>
            {formData.recipeImageUrl ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: formData.recipeImageUrl }} style={styles.image} />
                <Button title="Remover Receita" onPress={() => setFormData(prev => ({ ...prev, recipeImageUrl: undefined }))} variant="danger" style={{ marginTop: spacing.sm }} iconName="X" />
              </View>
            ) : (
              <View style={styles.noRecipeContainer}>
                <Text style={styles.noRecipeText}>Nenhuma receita anexada.{'\n'}Use o botão no rodapé para adicionar.</Text>
              </View>
            )}
          </View>
        </View>
      </KeyboardAwareScrollView>

      {showPicker && (Platform.OS === 'ios' ? (
        <Modal transparent visible={showPicker} animationType="slide" onRequestClose={handleConfirmPicker}>
          <Pressable style={styles.modalBackdrop} onPress={handleConfirmPicker} />
          <View style={styles.modalContent}>
            <DateTimePicker value={formData.date} mode="datetime" display="spinner" onChange={onDateChange} />
            <Button title="Concluído" onPress={handleConfirmPicker} />
          </View>
        </Modal>
      ) : (
        <DateTimePicker value={formData.date} mode="datetime" display="default" onChange={onDateChange} />
      ))}

      {/* ✅ Rodapé com os dois botões */}
      <View style={styles.footer}>
        <Button 
          title={formData.recipeImageUrl ? "Alterar Receita" : "Anexar Receita"} 
          onPress={handleTakePicture} 
          variant="secondary" 
          loading={loadingCamera} 
          iconName="Camera" 
          style={styles.footerButton}
        />
        <Button 
          title={isEditing ? 'Salvar' : 'Adicionar'} 
          onPress={handleSave} 
          variant="success" 
          disabled={!isValid}
          style={[styles.footerButton, { flex: 2 }]} // Botão principal maior
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: { padding: spacing.lg, paddingBottom: 0 },
  footer: { 
    flexDirection: 'row', 
    padding: spacing.lg, 
    backgroundColor: colors.background, 
    borderTopWidth: 1, 
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  footerButton: {
    flex: 1,
  },
  inputGroup: { marginBottom: spacing.lg },
  label: { fontWeight: '500', color: colors.text, marginBottom: spacing.sm },
  input: { borderWidth: 2, borderColor: colors.border, borderRadius: 12, padding: spacing.md, color: colors.text, backgroundColor: colors.cardBackground, minHeight: 56 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  dateInput: { justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: spacing.lg, paddingBottom: 40 },
  imageContainer: { alignItems: 'center' },
  image: { width: '100%', height: 200, borderRadius: 12, resizeMode: 'cover' },
  noRecipeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    minHeight: 100,
  },
  noRecipeText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});