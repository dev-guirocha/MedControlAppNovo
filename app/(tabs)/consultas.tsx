import React, { useMemo, useCallback, useRef, useState } from 'react';
import { View, StyleSheet, SectionList, Alert, TouchableOpacity, Animated, Text as DefaultText, Modal, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { useAppointmentStore } from '@/hooks/useAppointmentStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Appointment } from '@/types/medication';
import { Text } from '@/components/StyledText';
import { Plus, Receipt, Stethoscope, MapPin, Calendar, Edit, Trash2 } from 'lucide-react-native';

// Card da Consulta (sem lógica de arrastar)
const AppointmentItem = React.memo(({ item, onEdit, onViewRecipe }: { item: Appointment; onEdit: (item: Appointment) => void; onViewRecipe: (recipeUri: string) => void; }) => {
    const { fontScale } = useAuthStore();
    const fontSize = getFontSize(fontScale);
    const appointmentDate = useMemo(() => new Date(item.date), [item.date]);
    const isPast = appointmentDate < new Date();
    const formattedDate = useMemo(() => {
      const fallback = appointmentDate.toLocaleString('pt-BR');
      if (Number.isNaN(appointmentDate.getTime())) {
        return 'Data indisponível';
      }
      try {
        return appointmentDate.toLocaleString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch (error) {
        console.warn('Erro ao formatar data da consulta', error);
        return fallback;
      }
    }, [appointmentDate]);

    return (
      <View style={[styles.card, isPast && styles.pastCard]}>
        <View style={styles.cardHeader}>
            <Stethoscope size={24} color={isPast ? colors.textSecondary : colors.primary} />
            <View style={styles.headerTextContainer}>
                <Text style={[styles.doctorName, { fontSize: fontSize.lg }, isPast && styles.pastText]}>{item.doctorName}</Text>
                <Text style={[styles.specialty, { fontSize: fontSize.md }, isPast && styles.pastText]}>{item.specialty}</Text>
            </View>
            <TouchableOpacity onPress={() => onEdit(item)} style={styles.editButton}>
                <Edit size={20} color={colors.primary} />
            </TouchableOpacity>
        </View>

        <View style={styles.divider} />
        
        <View style={styles.cardBody}>
            <View style={styles.infoRow}><MapPin size={16} color={colors.textSecondary} /><Text style={[styles.cardText, { fontSize: fontSize.md }]}>{item.location}</Text></View>
            <View style={styles.infoRow}><Calendar size={16} color={colors.textSecondary} /><Text style={[styles.cardText, { fontSize: fontSize.md }]}>{formattedDate}</Text></View>
            {item.notes ? <Text style={[styles.notes, {fontSize: fontSize.sm}]}>Notas: {item.notes}</Text> : null}
        </View>
        
        {item.recipeImageUrl && (
            <View style={styles.cardFooter}>
              <TouchableOpacity
                style={styles.recipeButton}
                onPress={() => onViewRecipe(item.recipeImageUrl!)}
              >
                <Receipt size={18} color={colors.primary} />
                <Text style={styles.recipeButtonText}>Ver Receita</Text>
              </TouchableOpacity>
            </View>
        )}
      </View>
    );
});

// ✅ NOVO: Componente que encapsula o card com a funcionalidade de arrastar
const SwipeableAppointmentItem = ({ item, onEdit, onDelete, onViewRecipe }: { item: Appointment, onEdit: (item: Appointment) => void, onDelete: (id: string) => void, onViewRecipe: (recipeUri: string) => void }) => {
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
            <AppointmentItem item={item} onEdit={onEdit} onViewRecipe={onViewRecipe} />
        </Swipeable>
    );
};


export default function ConsultasScreen() {
  const router = useRouter();
  const { appointments, deleteAppointment } = useAppointmentStore();
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);
  const [selectedRecipeUri, setSelectedRecipeUri] = useState<string | null>(null);

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

  const handleViewRecipe = useCallback((recipeUri: string) => {
    setSelectedRecipeUri(recipeUri);
  }, []);

  const sections = useMemo(() => {
    const now = new Date();
    const upcoming = appointments.filter(a => new Date(a.date) >= now);
    const past = appointments.filter(a => new Date(a.date) < now);

    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const data = [];
    if (upcoming.length > 0) data.push({ title: 'Próximas Consultas', data: upcoming });
    if (past.length > 0) data.push({ title: 'Consultas Passadas', data: past });
    return data;
  }, [appointments]);
  
  if (appointments.length === 0) {
    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.emptyState}>
              <Stethoscope size={64} color={colors.disabled}/>
              <Text style={[styles.emptyTitle, {fontSize: fontSize.xl}]}>Nenhuma consulta agendada</Text>
              <Text style={[styles.emptySubtitle, {fontSize: fontSize.md}]}>Toque no botão '+' para adicionar sua primeira consulta.</Text>
            </View>
             <TouchableOpacity style={styles.fab} onPress={handleAddAppointment} accessibilityLabel="Adicionar nova consulta">
                <Plus color="white" size={32} />
            </TouchableOpacity>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
            // ✅ Usando o novo componente aqui
            <SwipeableAppointmentItem
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewRecipe={handleViewRecipe}
            />
        )}
        renderSectionHeader={({ section: { title }}) => (
            <Text style={[styles.sectionHeader, {fontSize: fontSize.lg}]}>{title}</Text>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
      />
      <TouchableOpacity style={styles.fab} onPress={handleAddAppointment} accessibilityLabel="Adicionar nova consulta">
        <Plus color="white" size={32} />
      </TouchableOpacity>

      <Modal
        visible={!!selectedRecipeUri}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRecipeUri(null)}
      >
        <View style={styles.recipeModalContainer}>
          <Pressable style={styles.recipeModalBackdrop} onPress={() => setSelectedRecipeUri(null)} />
          <View style={styles.recipeModalContent}>
            {selectedRecipeUri ? (
              <Image source={{ uri: selectedRecipeUri }} style={styles.recipePreviewImage} resizeMode="contain" />
            ) : null}
            <TouchableOpacity style={styles.recipeModalCloseButton} onPress={() => setSelectedRecipeUri(null)}>
              <Text style={styles.recipeModalCloseButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, paddingBottom: 100 },
  emptyTitle: { fontWeight: '600', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  emptySubtitle: { color: colors.textSecondary, textAlign: 'center' },
  sectionHeader: { fontWeight: 'bold', color: colors.primary, backgroundColor: colors.background, paddingTop: spacing.md, paddingBottom: spacing.sm },
  card: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  pastCard: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  pastText: { color: colors.textSecondary },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTextContainer: { flex: 1, marginHorizontal: spacing.md },
  doctorName: { fontWeight: 'bold', color: colors.text },
  specialty: { color: colors.textSecondary },
  editButton: { padding: spacing.xs },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  cardBody: { marginVertical: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  cardText: { color: colors.text, flexShrink: 1 },
  notes: { color: colors.textSecondary, fontStyle: 'italic', marginTop: spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  recipeButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primaryFaded, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 8, alignSelf: 'flex-start' },
  recipeButtonText: { color: colors.primary, fontWeight: '600' },
  fab: { position: 'absolute', right: 16, bottom: 16, width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  deleteButton: { backgroundColor: colors.danger, flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
  deleteButtonText: { color: 'white', marginTop: spacing.xs, fontWeight: '600', fontSize: 12 },
  recipeModalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: spacing.lg },
  recipeModalBackdrop: { ...StyleSheet.absoluteFillObject },
  recipeModalContent: { backgroundColor: colors.background, borderRadius: 16, padding: spacing.lg, alignItems: 'center' },
  recipePreviewImage: { width: '100%', height: 320, marginBottom: spacing.lg },
  recipeModalCloseButton: { backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, borderRadius: 999 },
  recipeModalCloseButtonText: { color: colors.background, fontWeight: '600' },
});
