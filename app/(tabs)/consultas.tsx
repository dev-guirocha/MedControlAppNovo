import React, { useState, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { useAppointmentStore } from '@/hooks/useAppointmentStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Appointment } from '@/types/medication';
import { Stethoscope, Plus, Calendar as CalendarIcon, MapPin, Trash2, Edit, Camera } from 'lucide-react-native';
import { Text } from '@/components/StyledText';
import { Button } from '@/components/Button';
import * as ImagePicker from 'expo-image-picker';

const AppointmentItem = ({ appointment, onDelete, onEdit, fontSize }: { appointment: Appointment, onDelete: (id: string) => void, onEdit: (appointment: Appointment) => void, fontSize: any }) => (
  <View style={styles.itemContainer}>
    <View style={styles.itemHeader}>
      <View style={styles.iconBackground}>
        <Stethoscope size={24} color={colors.primary} />
      </View>
      <View style={styles.itemTitleContainer}>
        <Text style={[styles.itemDoctor, { fontSize: fontSize.lg }]}>{appointment.doctorName}</Text>
        <Text style={[styles.itemSpecialty, { fontSize: fontSize.md }]}>{appointment.specialty}</Text>
      </View>
    </View>
    <View style={styles.itemDetails}>
      <View style={styles.detailRow}>
        <CalendarIcon size={16} color={colors.textSecondary} />
        <Text style={[styles.detailText, { fontSize: fontSize.sm }]}>{new Date(appointment.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>
      <View style={styles.detailRow}>
        <MapPin size={16} color={colors.textSecondary} />
        <Text style={[styles.detailText, { fontSize: fontSize.sm }]}>{appointment.location}</Text>
      </View>
    </View>
    <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => onEdit(appointment)} style={styles.actionButton}>
            <Edit size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(appointment.id)} style={styles.actionButton}>
            <Trash2 size={20} color={colors.danger} />
        </TouchableOpacity>
    </View>
  </View>
);

export default function ConsultasScreen() {
  const router = useRouter();
  const { appointments, isLoadingAppointments, deleteAppointment } = useAppointmentStore();
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [loadingCamera, setLoadingCamera] = useState(false);

  const handleAddAppointment = () => {
    router.push('/(modals)/add-appointment');
  };
  
  const handleEdit = (appointment: Appointment) => {
    router.push({ pathname: '/(modals)/add-appointment', params: { ...appointment, date: appointment.date.toISOString() } });
  };
  
  const handleDelete = (id: string) => {
    deleteAppointment(id);
  };
  
  const handleTakePicture = async () => {
    setLoadingCamera(true);
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permissão Negada', 'Você precisa permitir o acesso à câmera para tirar fotos.');
      setLoadingCamera(false);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setRecipeImage(result.assets[0].uri);
    }
    setLoadingCamera(false);
  };
  
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments]);

  if (isLoadingAppointments) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Camera size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { fontSize: fontSize.lg }]}>Anexar Receita</Text>
          </View>
          <Text style={[styles.cardSubtitle, { fontSize: fontSize.sm }]}>
            Tire uma foto da sua receita para guardar no histórico de consultas.
          </Text>
          <Button
            title="Tirar Foto da Receita"
            onPress={handleTakePicture}
            variant="secondary"
            icon={<Camera size={18} color={colors.primary} />}
            loading={loadingCamera}
          />
          {recipeImage && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: recipeImage }} style={styles.image} />
              <Button
                title="Remover Foto"
                onPress={() => setRecipeImage(null)}
                variant="danger"
                style={{ marginTop: spacing.md }}
              />
            </View>
          )}
        </View>
        {sortedAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Stethoscope size={64} color={colors.disabled} />
            <Text style={[styles.emptyTitle, { fontSize: fontSize.xl }]}>Nenhuma consulta agendada</Text>
            <Text style={[styles.emptySubtitle, { fontSize: fontSize.md }]}>Toque no '+' para adicionar sua primeira consulta.</Text>
          </View>
        ) : (
          <View>
            <Text style={[styles.sectionTitle, { fontSize: fontSize.md }]}>Próximas Consultas</Text>
            <FlatList
              data={sortedAppointments}
              keyExtractor={(item: Appointment) => item.id}
              renderItem={({ item }) => (
                <AppointmentItem
                    appointment={item}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    fontSize={fontSize}
                />
              )}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
      <View style={styles.addAppointmentButtonContainer}>
          <Button
              title="Adicionar Nova Consulta"
              onPress={handleAddAppointment}
              icon={<Plus size={18} color={colors.background} />}
          />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, padding: spacing.lg, paddingBottom: 100 },
  addAppointmentButtonContainer: { position: 'absolute', bottom: spacing.md, left: spacing.lg, right: spacing.lg },
  card: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  cardTitle: { fontWeight: '600', color: colors.text },
  cardSubtitle: { color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 22 },
  imageContainer: { marginTop: spacing.md, alignItems: 'center' },
  image: { width: '100%', height: 200, borderRadius: 16, resizeMode: 'cover' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { fontWeight: '600', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm, textAlign: 'center' },
  emptySubtitle: { color: colors.textSecondary, textAlign: 'center' },
  sectionTitle: { fontWeight: '600', color: colors.text, marginBottom: spacing.md, textTransform: 'uppercase' },
  itemContainer: { padding: spacing.md, borderRadius: 16, borderWidth: 1, backgroundColor: colors.background, borderColor: colors.border, marginBottom: spacing.md },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  iconBackground: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md, backgroundColor: colors.cardBackground },
  itemTitleContainer: { flex: 1 },
  itemDoctor: { fontWeight: 'bold', color: colors.text },
  itemSpecialty: { color: colors.textSecondary },
  itemDetails: { paddingLeft: 64, marginBottom: spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  detailText: { color: colors.textSecondary },
  itemActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  actionButton: { padding: spacing.sm, borderRadius: 8, backgroundColor: colors.cardBackground },
});