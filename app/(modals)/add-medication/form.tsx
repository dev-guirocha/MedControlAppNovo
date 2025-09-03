import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Modal, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, getFontSize, spacing, medicationColors } from '@/constants/theme';
import { Button } from '@/components/Button';
import { ChevronDown, X, Sun, Moon, CloudSun, Check } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { COMMON_MEDICATIONS } from '@/constants/commonMedications';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Text } from '@/components/StyledText';

const FORMS = ['comprimido', 'cápsula', 'líquido', 'injeção', 'pomada', 'gotas'];
const FREQUENCIES = ['diária', 'a cada 8h', 'a cada 12h', 'semanal', 'quando necessário'];

const TimePreset = ({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) => (
    <TouchableOpacity style={styles.presetButton} onPress={onPress}>
        {icon}
        <Text style={styles.presetText}>{label}</Text>
    </TouchableOpacity>
);

export default function MedicationFormScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { fontScale } = useAuthStore();
    const fontSize = getFontSize(fontScale);

    // Inicialização segura do estado usando os parâmetros da URL
    const [formData, setFormData] = useState({
        id: params.id as string | undefined,
        name: Array.isArray(params.name) ? params.name[0] : params.name ?? '',
        dosage: Array.isArray(params.dosage) ? params.dosage[0] : params.dosage ?? '',
        color: (Array.isArray(params.color) ? params.color[0] : params.color) ?? medicationColors[0],
        form: (Array.isArray(params.form) ? params.form[0] : params.form) ?? 'comprimido',
        frequency: (Array.isArray(params.frequency) ? params.frequency[0] : params.frequency) ?? 'diária',
        times: Array.isArray(params.times) ? params.times : (params.times ? [params.times] : ['08:00']),
        stock: Array.isArray(params.stock) ? params.stock[0] : params.stock ?? '',
        stockAlertThreshold: Array.isArray(params.stockAlertThreshold) ? params.stockAlertThreshold[0] : params.stockAlertThreshold ?? '',
        instructions: Array.isArray(params.instructions) ? params.instructions[0] : params.instructions ?? '',
        doctor: Array.isArray(params.doctor) ? params.doctor[0] : params.doctor ?? '',
    });

    const isEditing = !!params.id;
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [timePickerIndex, setTimePickerIndex] = useState(0);
    const [tempTime, setTempTime] = useState(new Date());
    const [showFormPicker, setShowFormPicker] = useState(false);
    const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

    const handleSelectCommonMed = (med: { name: string, dosage: string }) => {
        setFormData(prev => ({ ...prev, name: med.name, dosage: med.dosage }));
    };

    const handleSelectColor = (color: string) => {
        setFormData(prev => ({ ...prev, color }));
    };

    const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || tempTime;
        setTempTime(currentDate);
    };
    
    const handleConfirmTime = () => {
        const [h, m] = [tempTime.getHours(), tempTime.getMinutes()];
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        handleTimeChange(timePickerIndex, time);
        setShowTimePicker(false);
    }
    
    const showPickerFor = (index: number) => {
        const [h, m] = formData.times[index].split(':').map(Number);
        const newTempTime = new Date();
        newTempTime.setHours(h, m);
        setTempTime(newTempTime);
        setTimePickerIndex(index);
        setShowTimePicker(true);
    };

    const handleTimeChange = (index: number, value: string) => {
        const newTimes = [...formData.times];
        newTimes[index] = value;
        setFormData(prev => ({ ...prev, times: newTimes }));
    };

    const handleRemoveTime = (index: number) => {
        if (formData.times.length > 1) {
            const newTimes = formData.times.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, times: newTimes }));
        }
    };

    const handleAddTime = () => setFormData(prev => ({ ...prev, times: [...prev.times, '12:00'] }));
    const setTimePreset = (times: string[]) => setFormData(prev => ({ ...prev, times }));
    
    const handleNext = () => {
        router.push({ 
            pathname: '/(modals)/add-medication/confirm', 
            params: { ...formData } 
        });
    };

    // Validação aprimorada
    const isValid =
        formData.name.trim() !== '' &&
        formData.dosage.trim() !== '' &&
        formData.times.length > 0 &&
        !isNaN(Number(formData.stock)) &&
        Number(formData.stock) > 0 &&
        !isNaN(Number(formData.stockAlertThreshold)) &&
        Number(formData.stockAlertThreshold) >= 0 &&
        Number(formData.stockAlertThreshold) <= Number(formData.stock);

    const dynamicStyles = {
        label: { fontSize: fontSize.md },
        input: { fontSize: fontSize.lg },
        pickerText: { fontSize: fontSize.lg },
        pickerOptionText: { fontSize: fontSize.lg },
        timeText: { fontSize: fontSize.lg },
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Nome do Medicamento *</Text>
                        <TextInput style={[styles.input, dynamicStyles.input]} value={formData.name} onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))} placeholder="Digite ou selecione abaixo"/>
                        
                        <Text style={styles.suggestionsTitle}>Sugestões de Uso Comum</Text>
                        <View style={styles.suggestionsContainer}>
                            {COMMON_MEDICATIONS.map(med => (
                                <TouchableOpacity key={med.name} style={styles.suggestionChip} onPress={() => handleSelectCommonMed(med)}>
                                    <Text style={styles.suggestionText}>{med.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}><Text style={[styles.label, dynamicStyles.label]}>Dosagem *</Text><TextInput style={[styles.input, dynamicStyles.input]} value={formData.dosage} onChangeText={(text) => setFormData(prev => ({ ...prev, dosage: text }))} placeholder="Ex: 50mg"/></View>
                    
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Cor de Identificação</Text>
                        <View style={styles.colorSelectorContainer}>
                            {medicationColors.map(color => (
                                <TouchableOpacity key={color} style={[styles.colorOption, { backgroundColor: color }]} onPress={() => handleSelectColor(color)}>
                                    {formData.color === color && <Check size={24} color="white" />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}><Text style={[styles.label, dynamicStyles.label]}>Médico(a) (Opcional)</Text><TextInput style={[styles.input, dynamicStyles.input]} value={formData.doctor} onChangeText={(text) => setFormData(prev => ({ ...prev, doctor: text }))} placeholder="Ex: Dr. Carlos Andrade"/></View>
                    <View style={styles.inputGroup}><Text style={[styles.label, dynamicStyles.label]}>Forma *</Text><TouchableOpacity style={styles.picker} onPress={() => setShowFormPicker(v => !v)}><Text style={[styles.pickerText, dynamicStyles.pickerText]}>{formData.form}</Text><ChevronDown size={20} color={colors.textSecondary} /></TouchableOpacity>{showFormPicker && <View style={styles.pickerOptions}>{FORMS.map(f => <TouchableOpacity key={f} style={styles.pickerOption} onPress={() => { setFormData(prev => ({ ...prev, form: f as any })); setShowFormPicker(false); }}><Text style={[styles.pickerOptionText, dynamicStyles.pickerOptionText]}>{f}</Text></TouchableOpacity>)}</View>}</View>
                    <View style={styles.inputGroup}><Text style={[styles.label, dynamicStyles.label]}>Frequência *</Text><TouchableOpacity style={styles.picker} onPress={() => setShowFrequencyPicker(v => !v)}><Text style={[styles.pickerText, dynamicStyles.pickerText]}>{formData.frequency}</Text><ChevronDown size={20} color={colors.textSecondary} /></TouchableOpacity>{showFrequencyPicker && <View style={styles.pickerOptions}>{FREQUENCIES.map(f => <TouchableOpacity key={f} style={styles.pickerOption} onPress={() => { setFormData(prev => ({ ...prev, frequency: f as any })); setShowFrequencyPicker(false); }}><Text style={[styles.pickerOptionText, dynamicStyles.pickerOptionText]}>{f}</Text></TouchableOpacity>)}</View>}</View>
                    
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Horários *</Text>
                        <View style={styles.presetContainer}>
                            <TimePreset label="Manhã" icon={<Sun size={18} color={colors.primary} />} onPress={() => setTimePreset(['08:00'])} />
                            <TimePreset label="Tarde" icon={<CloudSun size={18} color={colors.primary} />} onPress={() => setTimePreset(['14:00'])} />
                            <TimePreset label="Noite" icon={<Moon size={18} color={colors.primary} />} onPress={() => setTimePreset(['20:00'])} />
                        </View>
                        {formData.times.map((time, index) => <View key={index} style={styles.timeRow}><TouchableOpacity style={[styles.input, styles.timeInput]} onPress={() => showPickerFor(index)}><Text style={[styles.timeText, dynamicStyles.timeText]}>{time}</Text></TouchableOpacity>{formData.times.length > 1 && <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveTime(index)}><X size={20} color={colors.danger} /></TouchableOpacity>}</View>)}
                        <TouchableOpacity style={styles.addTimeButton} onPress={handleAddTime}><Text style={styles.addTimeText}>+ Adicionar horário</Text></TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Estoque Inicial *</Text>
                        <TextInput 
                            style={[styles.input, dynamicStyles.input]} 
                            value={String(formData.stock)} 
                            onChangeText={(text) => setFormData(prev => ({ ...prev, stock: text.replace(/[^0-9]/g, '') }))} 
                            placeholder="Ex: 30" 
                            keyboardType="numeric"
                        />
                    </View>
                    
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Limite para Alerta de Estoque *</Text>
                        <TextInput 
                            style={[styles.input, dynamicStyles.input]} 
                            value={String(formData.stockAlertThreshold)} 
                            onChangeText={(text) => setFormData(prev => ({ ...prev, stockAlertThreshold: text.replace(/[^0-9]/g, '') }))} 
                            placeholder="Ex: 5" 
                            keyboardType="numeric"
                        />
                    </View>
                    
                    <View style={styles.inputGroup}><Text style={[styles.label, dynamicStyles.label]}>Instruções Especiais (Opcional)</Text><TextInput style={[styles.input, styles.textArea, dynamicStyles.input]} value={formData.instructions} onChangeText={(text) => setFormData(prev => ({ ...prev, instructions: text }))} placeholder="Ex: Tomar com alimentos" multiline/></View>
                </View>
            </KeyboardAwareScrollView>

            <Modal transparent={true} visible={showTimePicker} animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setShowTimePicker(false)} />
                <View style={styles.modalContent}>
                    <DateTimePicker value={tempTime} mode="time" is24Hour={true} display="spinner" onChange={onTimeChange}/>
                    <Button title="Concluído" onPress={handleConfirmTime} variant="primary" size="large" />
                </View>
            </Modal>

            <View style={styles.footer}>
                <Button title={isEditing ? "Salvar Alterações" : "Próximo"} onPress={handleNext} size="large" variant="success" disabled={!isValid}/>
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
    picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: colors.border, borderRadius: 12, padding: spacing.md, backgroundColor: colors.cardBackground, minHeight: 56 },
    pickerText: { color: colors.text },
    pickerOptions: { marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.background },
    pickerOption: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    pickerOptionText: { color: colors.text },
    timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    timeInput: { flex: 1, justifyContent: 'center' },
    timeText: { color: colors.text },
    removeButton: { marginLeft: spacing.sm, padding: spacing.sm },
    addTimeButton: { padding: spacing.md, alignItems: 'center' },
    addTimeText: { color: colors.primary, fontWeight: '500' },
    presetContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md },
    presetButton: { alignItems: 'center', padding: spacing.sm, backgroundColor: colors.cardBackground, borderRadius: 8, borderWidth: 1, borderColor: colors.border, flex: 1, marginHorizontal: spacing.xs },
    presetText: { color: colors.primary, marginTop: spacing.xs },
    suggestionsTitle: { color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm },
    suggestionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    suggestionChip: { backgroundColor: colors.cardBackground, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    suggestionText: { color: colors.primary, fontWeight: '500' },
    colorSelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
    colorOption: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContent: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: spacing.lg, paddingBottom: 40 },
});