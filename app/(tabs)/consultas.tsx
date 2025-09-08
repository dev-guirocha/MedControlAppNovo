import React, { useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, Alert, ActivityIndicator, TouchableOpacity, Animated, Text as DefaultText } from 'react-native';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { useAppointmentStore } from '@/hooks/useAppointmentStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Appointment } from '@/types/medication';
import { Text } from '@/components/StyledText';
import { Plus, Receipt, Stethoscope, MapPin, Calendar, Edit, Trash2 } from 'lucide-react-native';

// Card da Consulta (sem lógica de arrastar)
const AppointmentItem = React.memo(({ appointment, onEdit }: { appointment: Appointment; onEdit: (appointment: Appointment) => void; }) => {
    const { fontScale } = useAuthStore();
    const fontSize = getFontSize(fontScale);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={[styles.doctorName, { fontSize: fontSize.lg }]}>{appointment.doctorName}</Text>
          <TouchableOpacity onPress={() => onEdit(appointment)} style={styles.editButton}>
            <Edit size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.infoRow}><Stethoscope size={16} color={colors.textSecondary} /><Text style={[styles.cardText, { fontSize: fontSize.md }]}>{appointment.specialty}</Text></View>
        <View style={styles.infoRow}><MapPin size={16} color={colors.textSecondary} /><Text style={[styles.cardText, { fontSize: fontSize.md }]}>{appointment.location}</Text></View>
        <View style={styles.infoRow}><Calendar size={16} color={colors.textSecondary} /><Text style={[styles.cardText, { fontSize: fontSize.md }]}>{new Date(appointment.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</Text></View>
        {appointment.recipeImageUrl && (
          <TouchableOpacity style={styles.recipeButton}><Receipt size={18} color={colors.primary} /><Text style={styles.recipeButtonText}>Ver Receita Anexada</Text></TouchableOpacity>
        )}
      </View>
    );
});

// ✅ NOVO: Componente que encapsula o card com a funcionalidade de arrastar
const SwipeableAppointmentItem = ({ item, onEdit, onDelete }: { item: Appointment, onEdit: (item: Appointment) => void, onDelete: (id: string) => void }) => {
    const swipeableRef = useRef<Swipeable>(null);

    const handleDeletePress = () => {
        swipeableRef.current?.close();
        onDelete(item.id);
    };

    const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
        const trans = dragX.interpolate({ inputRange: [-80, 0], outputRange: [0, 80], extrapolate: 'clamp' });
        return (
            <Animated.View style={{ width: 80, transform: [{ translateX: trans }] }}>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress}>
                    <Trash2 size={24} color="white" />
                    <DefaultText style={styles.deleteButtonText}>Excluir</DefaultText>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            friction={2}
            rightThreshold={40}
            containerStyle={{ marginBottom: spacing.lg }}
            renderRightActions={renderRightActions}
        >
            <AppointmentItem appointment={item} onEdit={onEdit} />
        </Swipeable>
    );
};


export default function ConsultasScreen() {
  const router = useRouter();
  const { appointments, deleteAppointment } = useAppointmentStore();

  const handleAddAppointment = useCallback(() => router.push('/(modals)/add-appointment'), [router]);

  const handleEdit = useCallback((appointment: Appointment) => {
    router.push({ pathname: '/(modals)/add-appointment', params: { ...appointment, date: new Date(appointment.date).toISOString() } });
  }, [router]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      'Excluir Consulta', 'Tem certeza que deseja excluir esta consulta?',
      [{ text: 'Cancelar' }, { text: 'Excluir', style: 'destructive', onPress: () => deleteAppointment(id) }],
      { cancelable: true }
    );
  }, [deleteAppointment]);

  const sortedAppointments = useMemo(() => [...appointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [appointments]);

  return (
    <SafeAreaView style={styles.container}>
      {sortedAppointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nenhuma consulta agendada</Text>
          <Text style={styles.emptySubtitle}>Toque no '+' para adicionar sua primeira consulta.</Text>
        </View>
      ) : (
        <FlatList
          data={sortedAppointments}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            // ✅ Usando o novo componente aqui
            <SwipeableAppointmentItem
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={handleAddAppointment} accessibilityLabel="Adicionar nova consulta">
        <Plus color="white" size={32} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { fontSize: 22, fontWeight: '600', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  emptySubtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
  card: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md },
  doctorName: { fontWeight: 'bold', color: colors.text, flex: 1, marginRight: spacing.sm },
  editButton: { padding: spacing.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  cardText: { color: colors.textSecondary, fontSize: 16, flexShrink: 1 },
  recipeButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primaryFaded, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 8, marginTop: spacing.md, alignSelf: 'flex-start' },
  recipeButtonText: { color: colors.primary, fontWeight: '600' },
  fab: { position: 'absolute', right: 16, bottom: 16, width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  deleteButton: { backgroundColor: colors.danger, flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
  deleteButtonText: { color: 'white', marginTop: spacing.xs, fontWeight: '600', fontSize: 12 },
});