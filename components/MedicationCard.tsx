import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { Pill, Clock, AlertTriangle, Check, X } from 'lucide-react-native';
import { ScheduledDose } from '@/types/medication';
import { Medication } from '@/types/medication';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Button } from './Button';

function isScheduledDose(med: Medication | ScheduledDose): med is ScheduledDose {
  return (med as ScheduledDose).scheduledTime !== undefined;
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

  const iconColor = isNextDose ? colors.primary : (medication.color || colors.primary);

  const dynamicStyles = StyleSheet.create({
      medicationName: {
          fontSize: isNextDose ? fontSize.xl : fontSize.lg,
          fontWeight: isNextDose ? 'bold' : '600',
          color: isNextDose ? colors.primary : colors.text,
      },
      timeText: {
          fontSize: isNextDose ? fontSize.lg : fontSize.md,
          color: isNextDose ? colors.primary : colors.textSecondary,
          fontWeight: isNextDose ? 'bold' : '500',
      },
      dosage: {
          fontSize: fontSize.md,
          color: colors.textSecondary,
          marginBottom: spacing.sm,
      }
  });

  return (
    <TouchableOpacity 
      style={[styles.card, isNextDose && styles.nextDoseCard]} 
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
            <Clock size={16} color={colors.textSecondary} />
            <Text style={dynamicStyles.timeText}>
              {medication.isToday ? 'Hoje' : 'Amanhã'} às {medication.scheduledTime}
            </Text>
          </View>
        )}
      </View>
      {lowStock && !isNextDose && (
        <View style={styles.stockAlert}>
          <AlertTriangle size={20} color={colors.warning} />
        </View>
      )}
      {/* AQUI ESTÁ A MUDANÇA PRINCIPAL */}
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
  card: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: spacing.md, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  detailsContainer: { flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stockAlert: { marginLeft: 'auto', paddingLeft: spacing.md },
  nextDoseCard: {
    backgroundColor: colors.primaryFaded,
    borderColor: colors.primary,
    borderWidth: 2,
    paddingVertical: spacing.lg,
  },
  takeDoseButtonContainer: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
});