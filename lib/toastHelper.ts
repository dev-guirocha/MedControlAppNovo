// MedControlAppNovo/lib/toastHelper.ts

import Toast from 'react-native-root-toast';
import { colors } from '@/constants/theme';

export function showErrorToast(message: string = 'Não foi possível salvar os dados. Tente novamente.') {
  Toast.show(message, {
    duration: Toast.durations.LONG,
    position: Toast.positions.BOTTOM,
    backgroundColor: colors.danger,
    textColor: colors.background,
    shadow: true,
    animation: true,
    hideOnPress: true,
    delay: 0,
  });
}