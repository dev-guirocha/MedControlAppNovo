import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication } from '@/types/medication';

const MEDICATION_REMINDER_CATEGORY_ID = 'medication-reminder';
const STOCK_ALERT_CATEGORY_ID = 'stock-alert'; // Categoria para o alerta de estoque

export async function setupNotificationCategories() {
  // Categoria para lembrete de dose (com ações "Tomei" e "Pulei")
  await Notifications.setNotificationCategoryAsync(MEDICATION_REMINDER_CATEGORY_ID, [
    { identifier: 'dose-taken', buttonTitle: 'Tomei ✅', options: { opensAppToForeground: false } },
    { identifier: 'dose-skipped', buttonTitle: 'Pulei ❌', options: { opensAppToForeground: false, isDestructive: true } },
  ]);

  // Categoria simples para o alerta de estoque (sem ações)
  await Notifications.setNotificationCategoryAsync(STOCK_ALERT_CATEGORY_ID, []);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('As notificações são essenciais para os lembretes. Por favor, ative-as nas configurações do seu celular!');
    return;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

export async function scheduleMedicationNotifications(medication: Medication) {
  await cancelMedicationNotifications(medication.id);

  // Não agendar notificações para medicamentos "quando necessário"
  if (medication.frequency === 'quando necessário') {
    return;
  }

  for (const time of medication.times) {
    const [hour, minute] = time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        // Título mais direto
        title: `Hora de tomar: ${medication.name}`,
        // Corpo com mais detalhes
        body: `Toque para ver detalhes ou registrar a dose.`,
        // Subtítulo para contexto (ótimo no iOS)
        subtitle: `Lembrete de Medicamento 💊`,
        sound: 'default',
        data: { medicationId: medication.id },
        categoryIdentifier: 'medication-reminder',
        // Cor para o ícone no Android
        color: medication.color || colors.primary,
      },
      trigger: { 
        hour, 
        minute, 
        repeats: true 
      },
    });
  }
}

export async function cancelMedicationNotifications(medicationId: string) {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduledNotifications) {
    if (notification.content.data?.medicationId === medicationId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
  await cancelStockNotification(medicationId);
}

export async function cancelStockNotification(medicationId: string) {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduledNotifications) {
      if (notification.identifier === `stock-${medicationId}`) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
}

// ✅ Função unificada e corrigida, agora usando o `stockAlertThreshold`
export async function scheduleStockNotification(medication: Medication) {
  const identifier = `stock-${medication.id}`;
  await Notifications.cancelScheduledNotificationAsync(identifier);

  if (medication.stock <= medication.stockAlertThreshold) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: '⚠️ Alerta de Estoque Baixo',
          body: `Seu medicamento ${medication.name} está acabando. Restam apenas ${medication.stock} unidades.`,
          sound: 'default',
          categoryIdentifier: STOCK_ALERT_CATEGORY_ID,
          data: { medicationId: medication.id, type: 'stock_alert' },
        },
        trigger: {
          seconds: 1, // Envia imediatamente quando o estoque for atualizado
        },
      });
      console.log(`📢 Alerta de estoque AGENDADO para: ${medication.name}`);
    } catch (error) {
      console.error('❌ Erro ao agendar alerta de estoque:', error);
    }
  } else {
    console.log(`✅ Estoque suficiente (${medication.stock}) para: ${medication.name}`);
  }
}