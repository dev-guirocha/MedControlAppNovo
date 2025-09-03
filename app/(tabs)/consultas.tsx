import React, { useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { useAppointmentStore } from '@/hooks/useAppointmentStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Appointment } from '@/types/medication';
import { Stethoscope, Plus, Calendar as CalendarIcon, MapPin, Trash2, Edit } from 'lucide-react-native';
import { Text } from '@/components/StyledText';

// Componente para exibir cada item da consulta
const AppointmentItem = ({ appointment, onPress, onDelete, onEdit, fontSize }: { appointment: Appointment, onPress: () => void, onDelete: (id: string) => void, onEdit: (appointment: Appointment) => void, fontSize: any }) => (
  <View style={styles.itemContainer}>
    <View style={styles.itemHeader}>
      <View style={styles.iconBackground}>
        <Stethoscope size={24} color={colors.primary} />
      </View>
      <View style={styles.itemTitleContainer}>
        <Text style={{ ...styles.itemDoctor, fontSize: fontSize.lg }}>{appointment.doctorName}</Text>
        <Text style={{ ...styles.itemSpecialty, fontSize: fontSize.md }}>{appointment.specialty}</Text>
      </View>
    </View>
    <View style={styles.itemDetails}>
      <View style={styles.detailRow}>
        <CalendarIcon size={16} color={colors.textSecondary} />
        <Text style={{ ...styles.detailText, fontSize: fontSize.sm }}>{new Date(appointment.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>
      <View style={styles.detailRow}>
        <MapPin size={16} color={colors.textSecondary} />
        <Text style={{ ...styles.detailText, fontSize: fontSize.sm }}>{appointment.location}</Text>
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

  const handleAdd = () => {
    router.push('/(modals)/add-appointment');
  };
  
  const handleEdit = (appointment: Appointment) => {
    router.push({ pathname: '/(modals)/add-appointment/form', params: { ...appointment, date: appointment.date.toISOString() } });
  };
  
  const handleDelete = (id: string) => {
    deleteAppointment(id);
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
      {sortedAppointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Stethoscope size={64} color={colors.disabled} />
          <Text style={{ ...styles.emptyTitle, fontSize: fontSize.xl }}>Nenhuma consulta agendada</Text>
          <Text style={{ ...styles.emptySubtitle, fontSize: fontSize.md }}>Toque no '+' para adicionar sua primeira consulta.</Text>
        </View>
      ) : (
        <FlatList
          data={sortedAppointments}
          keyExtractor={(item: Appointment) => item.id}
          renderItem={({ item }) => (
            <AppointmentItem
                appointment={item}
                onPress={() => {}} // Sem ação por enquanto
                onDelete={handleDelete}
                onEdit={handleEdit}
                fontSize={fontSize}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Plus size={32} color={colors.background} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.lg, paddingBottom: 100 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { fontWeight: '600', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm, textAlign: 'center' },
  emptySubtitle: { color: colors.textSecondary, textAlign: 'center' },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  itemContainer: { backgroundColor: colors.cardBackground, padding: spacing.md, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  iconBackground: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  itemTitleContainer: { flex: 1 },
  itemDoctor: { fontWeight: 'bold', color: colors.text },
  itemSpecialty: { color: colors.textSecondary },
  itemDetails: { paddingLeft: 64, marginBottom: spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  detailText: { color: colors.textSecondary },
  itemActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  actionButton: { padding: spacing.sm, borderRadius: 8, backgroundColor: colors.primaryFaded },
});