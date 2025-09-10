import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { Pill, Clock, AlertTriangle } from 'lucide-react-native';
import { ScheduledDose, Medication } from '@/types/medication';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Button } from './Button';

function isScheduledDose(med: Medication | ScheduledDose): med is ScheduledDose {
  return (med as ScheduledDose).scheduledDateTime !== undefined;
}

export type MedicationCardProps = {
  medication: Medication | ScheduledDose;
  onPress: () => void;
  isNextDose?: boolean;
  onTakeDose?: (medication: ScheduledDose) => void;
};

export const MedicationCard = React.memo(({ medication, onPress, isNextDose = false, onTakeDose }: MedicationCardProps) => {
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);
  const lowStock = (medication.stock <= medication.stockAlertThreshold);
  const isMissedDose = isScheduledDose(medication) && medication.isMissed;

  // ✅ ALTERADO: Usa 'danger' para o ícone de dose atrasada
  const iconColor = isMissedDose ? colors.danger : isNextDose ? colors.primary : (medication.color || colors.primary);

  const dynamicStyles = StyleSheet.create({
      medicationName: {
          fontSize: isNextDose ? fontSize.xl : fontSize.lg,
          fontWeight: isNextDose ? 'bold' : '600',
          // ✅ ALTERADO: Usa 'danger' para o nome do medicamento atrasado
          color: isMissedDose ? colors.danger : isNextDose ? colors.primary : colors.text,
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
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
        <Pill size={24} color={'white'} />
      </View>
      <View style={styles.detailsContainer}>
        <Text style={dynamicStyles.medicationName}>{medication.name}</Text>
        <Text style={dynamicStyles.dosage}>{medication.dosage}</Text>
        {isScheduledDose(medication) && (
          <View style={styles.timeRow}>
            <Clock size={16} color={isMissedDose ? colors.danger : colors.textSecondary} />
            <Text style={dynamicStyles.timeText}>
              {isMissedDose ? 'ATRASADO:' : (medication.isToday ? 'Hoje' : 'Amanhã')} às {medication.scheduledTime}
            </Text>
          </View>
        )}
      </View>
      {lowStock && !isNextDose && !isMissedDose && (
        <View style={styles.stockAlert}>
          <AlertTriangle size={20} color={colors.warning} />
        </View>
      )}
      {onTakeDose && isScheduledDose(medication) && (
        <View style={styles.takeDoseButtonContainer}>
          <Button 
            title="Tomei" 
            onPress={() => onTakeDose(medication)} 
            variant="success" 
            iconName="check"
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
  timeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.sm 
  },
  stockAlert: { 
    marginLeft: 'auto', 
    paddingLeft: spacing.md 
  },
  nextDoseCard: {
    backgroundColor: colors.primaryFaded,
    borderColor: colors.primary,
    borderWidth: 2,
    paddingVertical: spacing.lg,
  },
  missedDoseCard: {
    // ✅ ALTERADO: Mantém o fundo padrão do card
    backgroundColor: colors.cardBackground,
    borderColor: colors.danger,
    borderWidth: 2,
  },
  takeDoseButtonContainer: {
    marginLeft: 'auto',
    paddingLeft: spacing.sm,
  },
});