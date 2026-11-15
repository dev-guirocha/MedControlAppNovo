import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors, getContentColorOn, getFontSize, spacing } from '@/constants/theme';
import { Pill, Tablets, Droplet, Droplets, Syringe, Clock, AlertTriangle } from 'lucide-react-native';
import { ScheduledDose, Medication } from '@/types/medication';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Button } from './Button';

// Ícone de acordo com a forma (antes era sempre comprimido, inclusive para injeção).
const FORM_ICONS: Partial<Record<Medication['form'], typeof Pill>> = {
  comprimido: Tablets,
  'cápsula': Pill,
  'líquido': Droplet,
  gotas: Droplets,
  'injeção': Syringe,
};

function isScheduledDose(med: Medication | ScheduledDose): med is ScheduledDose {
  return (med as ScheduledDose).scheduledDateTime !== undefined;
}

export type MedicationCardProps = {
  medication: Medication | ScheduledDose;
  onPress: () => void;
  isNextDose?: boolean;
  onTakeDose?: (medication: ScheduledDose) => void;
  /** Alternativa ao gesto de deslizar para quem usa leitor de tela. */
  onDeleteAction?: () => void;
  /** Dono do remédio; passado só quando há 2+ pessoas. */
  person?: { name: string; color: string };
};

export const MedicationCard = React.memo(({ medication, onPress, isNextDose = false, onTakeDose, onDeleteAction, person }: MedicationCardProps) => {
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);
  const lowStock = (medication.stock <= medication.stockAlertThreshold);
  const isMissedDose = isScheduledDose(medication) && medication.isMissed;

  // Atraso é sinalizado pela borda e pela linha de horário; o ícone mantém a cor do remédio.
  const iconColor = isNextDose ? colors.primary : (medication.color || colors.primary);
  const FormIcon = FORM_ICONS[medication.form] ?? Pill;
  const scheduleLabel = isScheduledDose(medication)
    ? `${isMissedDose ? 'Atrasada' : medication.isToday ? 'Hoje' : 'Amanhã'} às ${medication.scheduledTime}`
    : null;
  const accessibilityLabel = [
    person?.name,
    medication.name,
    medication.dosage,
    scheduleLabel,
    lowStock ? `estoque baixo, ${medication.stock} restantes` : null,
  ].filter(Boolean).join(', ');

  const dynamicStyles = StyleSheet.create({
      medicationName: {
          fontSize: isNextDose ? fontSize.xl : fontSize.lg,
          fontWeight: isNextDose ? 'bold' : '600',
          color: isNextDose ? colors.primary : colors.text,
      },
      timeText: {
          fontSize: isNextDose ? fontSize.lg : fontSize.md,
          color: isMissedDose ? colors.danger : isNextDose ? colors.primary : colors.textSecondary,
          fontWeight: isNextDose || isMissedDose ? 'bold' : '500',
      },
      dosage: {
          fontSize: fontSize.md,
          color: colors.textSecondary,
          marginBottom: spacing.sm,
      }
  });

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        isNextDose && styles.nextDoseCard,
        isMissedDose && styles.missedDoseCard
      ]} 
      onPress={onPress} 
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Abre os detalhes do medicamento"
      accessibilityActions={onDeleteAction ? [{ name: 'delete', label: 'Excluir' }] : undefined}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'delete') onDeleteAction?.();
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
        <FormIcon size={24} color={getContentColorOn(iconColor)} />
      </View>
      <View style={styles.detailsContainer}>
        {person && (
          <View style={[styles.personBadge, { backgroundColor: person.color }]}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: getContentColorOn(person.color) }}>
              {person.name}
            </Text>
          </View>
        )}
        <Text style={dynamicStyles.medicationName}>{medication.name}</Text>
        <Text style={dynamicStyles.dosage}>{medication.dosage}</Text>
        {isScheduledDose(medication) && (
          <View style={styles.timeRow}>
            <Clock size={16} color={isMissedDose ? colors.danger : colors.textSecondary} />
            <Text style={dynamicStyles.timeText}>{scheduleLabel}</Text>
          </View>
        )}
        {lowStock && (
          <View style={styles.stockRow}>
            <AlertTriangle size={16} color={colors.warning} />
            <Text style={[styles.stockText, { fontSize: fontSize.sm }]}>Estoque baixo · {medication.stock} restantes</Text>
          </View>
        )}
      </View>
      {onTakeDose && isScheduledDose(medication) && (
        <View style={styles.takeDoseButtonContainer}>
          <Button 
            title="Tomei" 
            onPress={() => onTakeDose(medication)} 
            variant="success" 
            iconName="Check"
          />
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: { 
    backgroundColor: colors.cardBackground, 
    borderRadius: 16, 
    padding: spacing.md, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: colors.border, 
    marginBottom: spacing.sm 
  },
  iconContainer: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: spacing.md 
  },
  detailsContainer: { 
    flex: 1 
  },
  personBadge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  timeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.sm 
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  stockText: {
    color: colors.warning,
    fontWeight: '500',
  },
  nextDoseCard: {
    backgroundColor: colors.primaryFaded,
    borderColor: colors.primary,
    borderWidth: 2,
    paddingVertical: spacing.lg,
  },
  missedDoseCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.danger,
    borderWidth: 2,
  },
  takeDoseButtonContainer: {
    marginLeft: 'auto',
    paddingLeft: spacing.sm,
  },
});
