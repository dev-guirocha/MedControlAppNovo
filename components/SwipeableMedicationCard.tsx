import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Alert } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { MedicationCard, MedicationCardProps } from './MedicationCard';
import { colors, spacing } from '@/constants/theme';
import { Trash2 } from 'lucide-react-native';
import { useMedicationStore } from '@/hooks/useMedicationStore';
import Toast from 'react-native-root-toast';
import { useAuthStore } from '@/hooks/useAuthStore';

interface SwipeableMedicationCardProps extends MedicationCardProps {
  onDelete: (id: string) => void;
}

export function SwipeableMedicationCard({ medication, onPress, isNextDose, onDelete }: SwipeableMedicationCardProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });

    const styles = StyleSheet.create({
      deleteButton: {
        flex: 1,
        backgroundColor: colors.danger,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
      },
    });

    return (
      <Animated.View style={{ width: 80, transform: [{ translateX: trans }] }}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            swipeableRef.current?.close();
            onDelete(medication.id);
          }}
        >
          <Trash2 size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const styles = StyleSheet.create({
    swipeableContainer: {
      marginBottom: spacing.md,
    },
  });

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      renderRightActions={renderRightActions}
      containerStyle={styles.swipeableContainer}
    >
      <MedicationCard
        medication={medication}
        onPress={onPress}
        isNextDose={isNextDose}
      />
    </Swipeable>
  );
}