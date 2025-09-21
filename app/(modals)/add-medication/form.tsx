import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Modal,
    Pressable,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, getFontSize, spacing, medicationColors } from '@/constants/theme';
import { Button } from '@/components/Button';
import { ChevronDown, X, Sun, Moon, CloudSun, Check } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuthStore } from '@/hooks/useAuthStore';
import type { FontScale } from '@/hooks/useAuthStore';
import { Text } from '@/components/StyledText';
import type { Medication } from '@/types/medication';

const FORMS = ['comprimido', 'cápsula', 'líquido', 'injeção', 'pomada', 'gotas'];
const FREQUENCIES = ['diária', 'a cada 8h', 'a cada 12h', 'semanal', 'quando necessário'];

type MedicationFormState = {
    id?: string;
    name: string;
    dosage: string;
    color: string;
    form: Medication['form'];
    frequency: Medication['frequency'];
    times: string[];
    stock: string;
    stockAlertThreshold: string;
    instructions: string;
    doctor: string;
    condition: string;
};

type PickerModalProps = {
    visible: boolean;
    title: string;
    options: string[];
    onSelect: (value: string) => void;
    onClose: () => void;
    fontScale: FontScale;
};

type PickerModalState = Omit<PickerModalProps, 'fontScale' | 'onClose'>;

const PickerModal: React.FC<PickerModalProps> = ({ visible, title, options, onSelect, onClose, fontScale }) => (
    <Modal visible={visible} transparent onRequestClose={onClose} animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.pickerModalContainer}>
            <View style={styles.pickerModalContent}>
                <Text style={[styles.pickerModalTitle, { fontSize: getFontSize(fontScale).lg }]}>{title}</Text>
                <ScrollView>
                    {options.map(option => (
                        <TouchableOpacity key={option} style={styles.pickerModalOption} onPress={() => onSelect(option)}>
                            <Text style={[styles.pickerModalOptionText, { fontSize: getFontSize(fontScale).md }]}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    </Modal>
);

type TimePresetProps = { label: string; icon: React.ReactNode; onPress: () => void };

const TimePreset: React.FC<TimePresetProps> = ({ label, icon, onPress }) => (
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

    const toStringParam = (value: unknown, fallback = ''): string => {
        if (Array.isArray(value)) {
            return value[0] ?? fallback;
        }
        if (typeof value === 'string') {
            return value;
        }
        return fallback;
    };

    const toTimesParam = (value: unknown): string[] => {
        if (!value) return ['08:00'];
        if (Array.isArray(value)) {
            return value.filter((item): item is string => Boolean(item));
        }
        if (typeof value === 'string') {
            return [value];
        }
        return ['08:00'];
    };

    const initialId = toStringParam(params.id);
    const initialSelectedName = toStringParam(params.selectedName);
    const [formData, setFormData] = useState<MedicationFormState>({
        id: initialId || undefined,
        name: initialSelectedName || toStringParam(params.name),
        dosage: toStringParam(params.selectedDosage) || toStringParam(params.dosage),
        color: toStringParam(params.color, medicationColors[0]),
        form: (toStringParam(params.form, 'comprimido') as Medication['form']),
        frequency: (toStringParam(params.frequency, 'diária') as Medication['frequency']),
        times: toTimesParam(params.times),
        stock: toStringParam(params.stock),
        stockAlertThreshold: toStringParam(params.stockAlertThreshold),
        instructions: toStringParam(params.instructions),
        doctor: toStringParam(params.doctor),
        condition: toStringParam(params.condition),
    });

    useEffect(() => {
        const selectedName = toStringParam(params.selectedName);
        if (selectedName) {
            setFormData((prev) => ({
                ...prev,
                name: selectedName,
                dosage: toStringParam(params.selectedDosage),
            }));
        }
    }, [params.selectedName, params.selectedDosage]);

    const isEditing = !!params.id;
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [timePickerIndex, setTimePickerIndex] = useState(0);
    const [tempTime, setTempTime] = useState(new Date());
    const [pickerModal, setPickerModal] = useState<PickerModalState>({
        visible: false,
        title: '',
        options: [],
        onSelect: () => {},
    });

    const showMultipleTimes = formData.frequency === 'diária' || formData.frequency === 'semanal';

    const stockNumber = Number(formData.stock);
    const thresholdNumber = Number(formData.stockAlertThreshold);
    const stockIsValid = !Number.isNaN(stockNumber) && stockNumber >= 0;
    const thresholdIsValid = !Number.isNaN(thresholdNumber) && thresholdNumber >= 0;
    const thresholdBelowStock = stockIsValid && thresholdIsValid ? thresholdNumber < stockNumber : true;

    const openPicker = (title: string, options: string[], onSelect: (value: string) => void) =>
        setPickerModal({ visible: true, title, options, onSelect });
    const closePicker = () => setPickerModal((prev) => ({ ...prev, visible: false }));
    const handleSelectForm = (value: string) => {
        setFormData((prev) => ({ ...prev, form: value as Medication['form'] }));
        closePicker();
    };
    const handleSelectFrequency = (value: string) => {
        const typedValue = value as Medication['frequency'];
        if ((typedValue === 'a cada 8h' || typedValue === 'a cada 12h') && formData.times.length > 1) {
            setFormData((prev) => ({ ...prev, frequency: typedValue, times: [prev.times[0]] }));
        } else {
            setFormData((prev) => ({ ...prev, frequency: typedValue }));
        }
        closePicker();
    };
    const handleSelectColor = (color: string) => setFormData((prev) => ({ ...prev, color }));
    const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || tempTime;
        if (Platform.OS === 'android') setShowTimePicker(false);
        setTempTime(currentDate);
        if (event.type === 'set' && Platform.OS === 'android') {
            const time = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;
            handleTimeChange(timePickerIndex, time);
        }
    };
    const handleConfirmTime = () => {
        const time = `${tempTime.getHours().toString().padStart(2, '0')}:${tempTime.getMinutes().toString().padStart(2, '0')}`;
        handleTimeChange(timePickerIndex, time);
        setShowTimePicker(false);
    };
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
        setFormData((prev) => ({ ...prev, times: [...newTimes].sort() }));
    };
    const handleRemoveTime = (index: number) => {
        if (formData.times.length > 1) {
            setFormData((prev) => ({ ...prev, times: prev.times.filter((_, i) => i !== index) }));
        }
    };
    const handleAddTime = () => setFormData((prev) => ({ ...prev, times: [...prev.times, '12:00'] }));
    const setTimePreset = (times: string[]) => setFormData((prev) => ({ ...prev, times: [...times] }));
    const handleNext = () => router.push({ pathname: '/(modals)/add-medication/confirm', params: { ...formData, times: formData.times } as any });
    const isValid = !!(formData.name.trim() && formData.dosage.trim() && formData.stock.trim() && formData.stockAlertThreshold.trim());

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAwareScrollView>
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, {fontSize: fontSize.md}]}>Nome do Medicamento *</Text>
                        <TouchableOpacity style={styles.picker} onPress={() => router.push({pathname: '/(modals)/add-medication/search', params: formData })}>
                            <Text style={[{fontSize: fontSize.lg}, !formData.name && styles.placeholderText]}>{formData.name || 'Clique para buscar'}</Text>
                            <ChevronDown size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.inputGroup}><Text style={[styles.label, {fontSize: fontSize.md}]}>Dosagem *</Text><TextInput style={[styles.input, {fontSize: fontSize.lg}]} value={formData.dosage} onChangeText={(text) => setFormData(prev => ({ ...prev, dosage: text }))} placeholder="Ex: 500mg ou 1 comprimido"/></View>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, {fontSize: fontSize.md}]}>Para que é este medicamento? (Opcional)</Text>
                        <TextInput style={[styles.input, {fontSize: fontSize.lg}]} value={formData.condition} onChangeText={(text) => setFormData(prev => ({ ...prev, condition: text }))} placeholder="Ex: Dor de cabeça, Hipertensão"/>
                    </View>
                    <View style={styles.inputGroup}><Text style={[styles.label, {fontSize: fontSize.md}]}>Cor de Identificação</Text><View style={styles.colorSelectorContainer}>{medicationColors.map(color => (<TouchableOpacity key={color} style={[styles.colorOption, { backgroundColor: color }]} onPress={() => handleSelectColor(color)}>{formData.color === color && <Check size={24} color="white" />}</TouchableOpacity>))}</View></View>
                    <View style={styles.inputGroup}><Text style={[styles.label, {fontSize: fontSize.md}]}>Médico(a) (Opcional)</Text><TextInput style={[styles.input, {fontSize: fontSize.lg}]} value={formData.doctor} onChangeText={(text) => setFormData(prev => ({ ...prev, doctor: text }))} placeholder="Ex: Dr. Carlos Andrade"/></View>
                    <View style={styles.inputGroup}><Text style={[styles.label, {fontSize: fontSize.md}]}>Forma *</Text><TouchableOpacity style={styles.picker} onPress={() => openPicker('Selecione a Forma', FORMS, handleSelectForm)}><Text style={{fontSize: fontSize.lg}}>{formData.form}</Text><ChevronDown size={20} color={colors.textSecondary} /></TouchableOpacity></View>
                    <View style={styles.inputGroup}><Text style={[styles.label, {fontSize: fontSize.md}]}>Frequência *</Text><TouchableOpacity style={styles.picker} onPress={() => openPicker('Selecione a Frequência', FREQUENCIES, handleSelectFrequency)}><Text style={{fontSize: fontSize.lg}}>{formData.frequency}</Text><ChevronDown size={20} color={colors.textSecondary} /></TouchableOpacity></View>
                    
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, {fontSize: fontSize.md}]}>
                            {showMultipleTimes ? 'Horários *' : 'Horário da Primeira Dose *'}
                        </Text>
                        {showMultipleTimes && (
                            <View style={styles.presetContainer}>
                                <TimePreset label="Manhã" icon={<Sun size={18} color={colors.primary} />} onPress={() => setTimePreset(['08:00'])} />
                                <TimePreset label="Tarde" icon={<CloudSun size={18} color={colors.primary} />} onPress={() => setTimePreset(['14:00'])} />
                                <TimePreset label="Noite" icon={<Moon size={18} color={colors.primary} />} onPress={() => setTimePreset(['20:00'])} />
                            </View>
                        )}
                        {formData.times.map((time, index) => (
                            <View key={index} style={styles.timeRow}>
                                <TouchableOpacity style={[styles.input, styles.timeInput]} onPress={() => showPickerFor(index)}>
                                    <Text style={{fontSize: fontSize.lg}}>{time}</Text>
                                </TouchableOpacity>
                                {showMultipleTimes && formData.times.length > 1 && (
                                    <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveTime(index)}>
                                        <X size={20} color={colors.danger} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                        {showMultipleTimes && (
                            <TouchableOpacity style={styles.addTimeButton} onPress={handleAddTime}>
                                <Text style={styles.addTimeText}>+ Adicionar horário</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, {fontSize: fontSize.md}]}>Estoque Inicial *</Text>
                        <TextInput
                            style={[styles.input, {fontSize: fontSize.lg}]}
                            value={String(formData.stock)}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, stock: text.replace(/[^0-9]/g, '') }))}
                            placeholder="Ex: 30"
                            keyboardType="numeric"
                        />
                        {stockIsValid && (
                            <Text style={[styles.helperText, { color: colors.textSecondary }]}>Estoque atual: {stockNumber} unidades</Text>
                        )}
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, {fontSize: fontSize.md}]}>Limite para Alerta de Estoque *</Text>
                        <TextInput
                            style={[styles.input, {fontSize: fontSize.lg}]}
                            value={String(formData.stockAlertThreshold)}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, stockAlertThreshold: text.replace(/[^0-9]/g, '') }))}
                            placeholder="Ex: 5"
                            keyboardType="numeric"
                        />
                        {thresholdIsValid && thresholdBelowStock && (
                            <Text style={[styles.helperText, { color: colors.success }]}>Você será alertado quando restarem {thresholdNumber} unidades.</Text>
                        )}
                        {thresholdIsValid && !thresholdBelowStock && stockIsValid && (
                            <Text style={[styles.helperText, { color: colors.danger }]}>O limite de alerta deve ser menor que o estoque inicial.</Text>
                        )}
                    </View>
                    <View style={styles.inputGroup}><Text style={[styles.label, {fontSize: fontSize.md}]}>Instruções Especiais (Opcional)</Text><TextInput style={[styles.input, styles.textArea, {fontSize: fontSize.lg}]} value={formData.instructions} onChangeText={(text) => setFormData(prev => ({ ...prev, instructions: text }))} placeholder="Ex: Tomar com alimentos" multiline/></View>
                </View>
            </KeyboardAwareScrollView>
            
            <PickerModal
                visible={pickerModal.visible}
                title={pickerModal.title}
                options={pickerModal.options}
                onSelect={pickerModal.onSelect}
                onClose={closePicker}
                fontScale={fontScale}
            />

            {showTimePicker && (Platform.OS === 'ios' ? (<Modal transparent={true} visible={showTimePicker} animationType="fade" onRequestClose={() => setShowTimePicker(false)}><Pressable style={styles.modalBackdrop} onPress={() => setShowTimePicker(false)} /><View style={styles.modalContent}><DateTimePicker value={tempTime} mode="time" is24Hour={true} display="spinner" onChange={onTimeChange}/><Button title="Concluído" onPress={handleConfirmTime} /></View></Modal>) : (<DateTimePicker value={tempTime} mode="time" is24Hour={true} display="default" onChange={onTimeChange}/>))}
            
            <View style={styles.footer}><Button title={isEditing ? "Salvar Alterações" : "Próximo"} onPress={handleNext} size="large" variant="success" disabled={!isValid}/></View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    form: { padding: spacing.lg, paddingBottom: 0 },
    footer: { padding: spacing.lg, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
    inputGroup: { marginBottom: spacing.lg },
    label: { fontWeight: '500', color: colors.text, marginBottom: spacing.sm },
    input: { borderWidth: 2, borderColor: colors.border, borderRadius: 12, padding: spacing.md, color: colors.text, backgroundColor: colors.cardBackground, minHeight: 56 },
    helperText: { marginTop: spacing.xs, fontSize: 14 },
    placeholderText: { color: colors.textSecondary },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: colors.border, borderRadius: 12, padding: spacing.md, backgroundColor: colors.cardBackground, minHeight: 56 },
    timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    timeInput: { flex: 1, justifyContent: 'center' },
    removeButton: { marginLeft: spacing.sm, padding: spacing.sm },
    addTimeButton: { padding: spacing.md, alignItems: 'center' },
    addTimeText: { color: colors.primary, fontWeight: '500' },
    presetContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md },
    presetButton: { alignItems: 'center', padding: spacing.sm, backgroundColor: colors.cardBackground, borderRadius: 8, borderWidth: 1, borderColor: colors.border, flex: 1, marginHorizontal: spacing.xs },
    presetText: { color: colors.primary, marginTop: spacing.xs },
    colorSelectorContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between', marginTop: spacing.sm },
    colorOption: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContent: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: spacing.lg, paddingBottom: 40 },
    pickerModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    pickerModalContent: { backgroundColor: colors.background, borderRadius: 16, width: '100%', padding: spacing.lg, maxHeight: '60%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    pickerModalTitle: { fontWeight: 'bold', color: colors.text, marginBottom: spacing.lg, textAlign: 'center' },
    pickerModalOption: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    pickerModalOptionText: { color: colors.primary, textAlign: 'center' },
});
