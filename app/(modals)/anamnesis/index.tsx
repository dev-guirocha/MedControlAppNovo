import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useAnamnesisStore } from '@/hooks/useAnamnesisStore';
import { Anamnesis } from '@/types/medication';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Text } from '@/components/StyledText';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Plus } from 'lucide-react-native';

const CheckboxItem = ({ label, value, onValueChange }: { label: string, value: boolean, onValueChange: (value: boolean) => void }) => (
  <View style={styles.checkboxContainer}>
    <Text style={styles.checkboxLabel}>{label}</Text>
    <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={value ? colors.background : colors.border} />
  </View>
);

export default function AnamnesisScreen() {
  const router = useRouter();
  const { fontScale } = useAuthStore();
  const { anamnesis, saveAnamnesis, exportAnamnesis } = useAnamnesisStore();
  const fontSize = getFontSize(fontScale);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [formData, setFormData] = useState<Omit<Anamnesis, 'id' | 'lastUpdated'>>({
    chronicConditions: anamnesis?.chronicConditions || [''],
    allergies: anamnesis?.allergies || [''],
    surgeries: anamnesis?.surgeries || [''],
    familyHistory: anamnesis?.familyHistory || {
      hypertension: false,
      diabetes: false,
      heartDisease: false,
      cancer: false,
      other: '',
    },
    otherNotes: anamnesis?.otherNotes || '',
  });

  const handleSave = async () => {
    setLoading(true);
    await saveAnamnesis(formData);
    setLoading(false);
    router.back();
  };

  const handleArrayChange = (key: keyof typeof formData, index: number, value: string) => {
    const newArray = [...(formData[key] as string[])];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [key]: newArray }));
  };

  const handleAddToArray = (key: keyof typeof formData) => {
    setFormData(prev => ({ ...prev, [key]: [...(prev[key] as string[]), ''] }));
  };
  
  const handleExport = async () => {
    setIsExporting(true);
    // ✅ A função do store agora retorna um booleano
    const success = await exportAnamnesis(formData);
    setIsExporting(false);

    // ✅ A lógica do Alert agora vive no componente
    if (!success) {
      Alert.alert(
        'Atenção', 
        'É necessário preencher pelo menos um campo do questionário para poder exportar o arquivo.',
        [{ text: 'OK' }]
      );
    }
  };

  const dynamicStyles = StyleSheet.create({
    title: { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
    sectionTitle: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
    label: { fontWeight: '500', color: colors.text, marginBottom: spacing.sm },
    input: { fontSize: fontSize.lg },
    placeholderText: { fontSize: fontSize.md, color: colors.textSecondary },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={dynamicStyles.title}>Questionário de Anamnese</Text>
          <Text style={styles.subtitle}>Preencha seus dados médicos para mantê-los salvos e acessíveis.</Text>

          <Text style={dynamicStyles.sectionTitle}>Condições de Saúde</Text>
          <View style={styles.inputGroup}>
            <Text style={dynamicStyles.label}>Condições Crônicas (Separe por linha)</Text>
            {formData.chronicConditions.map((condition, index) => (
              <TextInput
                key={index}
                style={[styles.input, dynamicStyles.input, {marginBottom: spacing.sm}]}
                value={condition}
                onChangeText={(text) => handleArrayChange('chronicConditions', index, text)}
                placeholder="Ex: Hipertensão, Diabetes"
              />
            ))}
            <TouchableOpacity onPress={() => handleAddToArray('chronicConditions')} style={styles.addButton}>
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addButtonText}>Adicionar condição</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={dynamicStyles.label}>Alergias (Separe por linha)</Text>
            {formData.allergies.map((allergy, index) => (
              <TextInput
                key={index}
                style={[styles.input, dynamicStyles.input, {marginBottom: spacing.sm}]}
                value={allergy}
                onChangeText={(text) => handleArrayChange('allergies', index, text)}
                placeholder="Ex: Dipirona, Pólen"
              />
            ))}
            <TouchableOpacity onPress={() => handleAddToArray('allergies')} style={styles.addButton}>
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addButtonText}>Adicionar alergia</Text>
            </TouchableOpacity>
          </View>

          <Text style={dynamicStyles.sectionTitle}>Histórico Pessoal</Text>
          <View style={styles.inputGroup}>
            <Text style={dynamicStyles.label}>Cirurgias Prévias (Separe por linha)</Text>
            {formData.surgeries.map((surgery, index) => (
              <TextInput
                key={index}
                style={[styles.input, dynamicStyles.input, {marginBottom: spacing.sm}]}
                value={surgery}
                onChangeText={(text) => handleArrayChange('surgeries', index, text)}
                placeholder="Ex: Apendicectomia (2020)"
              />
            ))}
            <TouchableOpacity onPress={() => handleAddToArray('surgeries')} style={styles.addButton}>
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addButtonText}>Adicionar cirurgia</Text>
            </TouchableOpacity>
          </View>

          <Text style={dynamicStyles.sectionTitle}>Histórico Familiar</Text>
          <View style={styles.inputGroup}>
            <CheckboxItem 
              label="Hipertensão" 
              value={formData.familyHistory.hypertension || false} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, familyHistory: { ...prev.familyHistory, hypertension: v } }))} 
            />
            <CheckboxItem 
              label="Diabetes" 
              value={formData.familyHistory.diabetes || false} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, familyHistory: { ...prev.familyHistory, diabetes: v } }))} 
            />
            <CheckboxItem 
              label="Doenças Cardíacas" 
              value={formData.familyHistory.heartDisease || false} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, familyHistory: { ...prev.familyHistory, heartDisease: v } }))} 
            />
            <CheckboxItem 
              label="Câncer" 
              value={formData.familyHistory.cancer || false} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, familyHistory: { ...prev.familyHistory, cancer: v } }))} 
            />
            <TextInput
              style={[styles.input, { marginTop: spacing.md }, dynamicStyles.input]}
              value={formData.familyHistory.other}
              onChangeText={(text) => setFormData(prev => ({ ...prev, familyHistory: { ...prev.familyHistory, other: text } }))}
              placeholder="Outras condições familiares"
            />
          </View>

          <Text style={dynamicStyles.sectionTitle}>Notas Adicionais</Text>
          <View style={styles.inputGroup}>
            <Text style={dynamicStyles.label}>Outras notas</Text>
            <TextInput
              style={[styles.input, styles.textArea, dynamicStyles.input]}
              value={formData.otherNotes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, otherNotes: text }))}
              placeholder="Ex: Tive COVID-19 em 2023."
              multiline
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
      
      <View style={[styles.footer, styles.footerWithExport]}>
        <Button title="Salvar" onPress={handleSave} size="large" variant="success" loading={loading} style={styles.saveButton} />
        <Button title="Exportar" onPress={handleExport} size="large" variant="secondary" loading={isExporting} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  footer: { flexDirection: 'row', padding: spacing.lg, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md },
  footerWithExport: { justifyContent: 'space-between' },
  saveButton: { flex: 1 },
  subtitle: { color: colors.textSecondary, marginBottom: spacing.lg, fontSize: 16, lineHeight: 24 },
  inputGroup: { marginBottom: spacing.lg },
  label: { fontWeight: '500', color: colors.text, marginBottom: spacing.sm },
  input: { borderWidth: 2, borderColor: colors.border, borderRadius: 12, padding: spacing.md, color: colors.text, backgroundColor: colors.cardBackground, minHeight: 56 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, gap: spacing.xs, padding: spacing.md, borderRadius: 12, backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border },
  addButtonText: { color: colors.primary, fontWeight: '500' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, },
  checkboxLabel: { color: colors.text, fontSize: 16 },
});