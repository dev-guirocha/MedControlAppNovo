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
  for (const time of medication.times) {
    const [hour, minute] = time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Lembrete de Medicamento',
        body: `Está na hora de tomar seu ${medication.name} (${medication.dosage}).`,
        sound: 'default',
        data: { medicationId: medication.id },
        categoryIdentifier: MEDICATION_REMINDER_CATEGORY_ID,
      },
      trigger: { hour, minute, repeats: true },
    });
  }
}

export async function scheduleStockNotification(medication: Medication) {
  const identifier = `stock-${medication.id}`;
  
  // ✅ Cancelar notificação anterior para este medicamento
  await Notifications.cancelScheduledNotificationAsync(identifier);

  // ✅ Só agendar se o estoque estiver baixo (<= 5 unidades)
  if (medication.stock <= 5) {
    try {
      // ✅ PARA TESTES - Notificação em 10 segundos
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: '⚠️ Alerta de Estoque Baixo',
          body: `Seu medicamento ${medication.name} está acabando. Restam apenas ${medication.stock} unidades.`,
          sound: 'default',
          categoryIdentifier: STOCK_ALERT_CATEGORY_ID,
          data: { medicationId: medication.id, type: 'stock_alert' },
        },
        // ✅ TESTE RÁPIDO - 10 segundos
        trigger: { 
          hour: 8, // Horários fixos para o alerta
          minute: 0,
          seconds: 0,
          repeats: false,
        },
      });
      
      console.log(`📢 Alerta de estoque AGENDADO para: ${medication.name} em 10 segundos`);
      
    } catch (error) {
      console.error('❌ Erro ao agendar alerta de estoque:', error);
    }
  } else {
    console.log(`✅ Estoque suficiente (${medication.stock}) para: ${medication.name}`);
    // ✅ Cancelar alerta se estoque voltou ao normal
    await cancelStockNotification(medication.id);
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

// NOVO: Adicione uma função para cancelar apenas a notificação de estoque
export async function cancelStockNotification(medicationId: string) {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduledNotifications) {
      if (notification.identifier === `stock-${medicationId}`) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
}
