import { ViewStyle, StyleProp, PressableProps } from 'react-native';
import { icons } from 'lucide-react-native';

export interface ButtonProps extends PressableProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  iconName?: keyof typeof icons; // ✅ Tipo corrigido para ser compatível com `lucide-react-native`
  style?: StyleProp<ViewStyle>;
}
