import React, { useState } from 'react';
import { View, StyleSheet, TextInput, SafeAreaView, TouchableOpacity, Platform, Modal, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppointmentStore } from '@/hooks/useAppointmentStore';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Button } from '@/components/Button';
import { Text } from '@/components/StyledText';
import DateTimePicker from '@react-native-community/datetimepicker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

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
  });

  const [showPicker, setShowPicker] = useState(false);

  const handleSave = async () => {
    if (isEditing) {
      await updateAppointment(formData.id!, {
        doctorName: formData.doctorName,
        specialty: formData.specialty,
        location: formData.location,
        notes: formData.notes,
        date: formData.date.toISOString(),
      });
    } else {
      await addAppointment({
        doctorName: formData.doctorName,
        specialty: formData.specialty,
        location: formData.location,
        notes: formData.notes,
        date: formData.date.toISOString(),
      });
    }
    router.back();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || formData.date;
    setFormData(prev => ({ ...prev, date: currentDate }));
  };

  const handleConfirmPicker = () => {
    setShowPicker(false);
  };

  const isValid = formData.doctorName && formData.specialty && formData.location;

  const dynamicStyles = {
    label: { fontSize: fontSize.md },
    input: { fontSize: fontSize.lg },
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Nome do Doutor(a) *</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={formData.doctorName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, doctorName: text }))}
              placeholder="Ex: Dra. Hellen Dutra Passos"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Especialidade *</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={formData.specialty}
              onChangeText={(text) => setFormData(prev => ({ ...prev, specialty: text }))}
              placeholder="Ex: Cardiologista"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Local *</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={formData.location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              placeholder="Ex: Clínica São Lucas"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Data e Hora *</Text>
            <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.input, styles.dateInput]}>
              <Text style={dynamicStyles.input}>
                {formData.date.toLocaleDateString('pt-BR')} às {formData.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Notas (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, dynamicStyles.input]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Ex: Levar exames anteriores."
              multiline
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <Modal transparent={true} visible={showPicker} animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowPicker(false)} />
        <View style={styles.modalContent}>
          <DateTimePicker
            value={formData.date}
            mode="datetime"
            display="spinner"
            onChange={onDateChange}
          />
          <Button title="Concluído" onPress={handleConfirmPicker} variant="primary" size="large" />
        </View>
      </Modal>

      <View style={styles.footer}>
        <Button title={isEditing ? 'Salvar Alterações' : 'Adicionar Consulta'} onPress={handleSave} size="large" variant="success" disabled={!isValid}/>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: { padding: spacing.lg },
  footer: { padding: spacing.lg, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  inputGroup: { marginBottom: spacing.lg },
  label: { fontWeight: '500', color: colors.text, marginBottom: spacing.sm },
  input: { borderWidth: 2, borderColor: colors.border, borderRadius: 12, padding: spacing.md, color: colors.text, backgroundColor: colors.cardBackground, minHeight: 56 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  dateInput: { justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: spacing.lg, paddingBottom: 40 },
});