import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyTriggerInput, NotificationResponse } from 'expo-notifications';

import { colors } from '@/constants/theme';
import { Medication } from '@/types/medication';

const MEDICATION_REMINDER_CATEGORY_ID = 'medication-reminder';
const STOCK_ALERT_CATEGORY_ID = 'stock-alert'; // Categoria para o alerta de estoque
const REMINDER_LEAD_MINUTES = 5;
const MEDICATION_NOTIFICATION_IDS_KEY = 'medication_notification_ids';
const IOS_NOTIFICATIONS_TEMPORARILY_DISABLED = Platform.OS === 'ios';
const DOSE_TAKEN_ACTION_ID = 'dose-taken';
const DOSE_SKIPPED_ACTION_ID = 'dose-skipped';
let notificationsInitializationPromise: Promise<void> | null = null;

async function getNotificationsModule() {
  if (IOS_NOTIFICATIONS_TEMPORARILY_DISABLED) {
    return null;
  }

  return import('expo-notifications');
}

async function setupNotificationCategories() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  // Categoria para lembrete de dose (com ações "Tomei" e "Pulei")
  await Notifications.setNotificationCategoryAsync(MEDICATION_REMINDER_CATEGORY_ID, [
    { identifier: DOSE_TAKEN_ACTION_ID, buttonTitle: 'Tomei ✅', options: { opensAppToForeground: true } },
    { identifier: DOSE_SKIPPED_ACTION_ID, buttonTitle: 'Pulei ❌', options: { opensAppToForeground: true, isDestructive: true } },
  ]);

  // Categoria simples para o alerta de estoque (sem ações)
  await Notifications.setNotificationCategoryAsync(STOCK_ALERT_CATEGORY_ID, [
    {
      identifier: 'stock-acknowledge',
      buttonTitle: 'Ok',
      options: { opensAppToForeground: true },
    },
  ]);
}

async function ensureNotificationsInitialized() {
  if (notificationsInitializationPromise) {
    await notificationsInitializationPromise;
    return;
  }

  notificationsInitializationPromise = (async () => {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    await setupNotificationCategories();
  })();

  try {
    await notificationsInitializationPromise;
  } catch (error) {
    notificationsInitializationPromise = null;
    throw error;
  }
}

export async function initializeNotificationsAsync() {
  await ensureNotificationsInitialized();
}

export function getMedicationActionFromNotificationResponse(response: NotificationResponse) {
  const actionIdentifier = response.actionIdentifier;
  const request = response.notification.request;
  const data = request.content.data as {
    medicationId?: string;
    scheduledTime?: string;
  };

  const status = getDoseStatusFromActionIdentifier(actionIdentifier);
  if (!status || !data.medicationId || !data.scheduledTime) {
    return null;
  }

  const scheduledDate = buildScheduledDateFromTime(data.scheduledTime);
  if (!scheduledDate) {
    return null;
  }

  return {
    medicationId: data.medicationId,
    scheduledDate,
    status,
    notificationIdentifier: request.identifier,
  };
}

async function ensureNotificationPermissionAsync(shouldRequest: boolean) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  await ensureNotificationsInitialized();

  const existingPermissions = await Notifications.getPermissionsAsync() as { granted?: boolean; status?: string };
  let permissionGranted = existingPermissions.granted ?? existingPermissions.status === 'granted';
  if (shouldRequest && !permissionGranted) {
    const requestedPermissions = await Notifications.requestPermissionsAsync() as { granted?: boolean; status?: string };
    permissionGranted = requestedPermissions.granted ?? requestedPermissions.status === 'granted';
  }

  return permissionGranted;
}

export async function registerForPushNotificationsAsync() {
  const permissionGranted = await ensureNotificationPermissionAsync(true);
  if (!permissionGranted) {
    alert('As notificações são essenciais para os lembretes. Por favor, ative-as nas configurações do seu celular!');
  }
  return permissionGranted;
}

export async function cleanupOrphanedMedicationNotifications(medications: Medication[]) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  const activeMedicationIds = new Set(medications.map((medication) => medication.id));

  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduledNotifications) {
    const medicationId = typeof notification.content.data?.medicationId === 'string'
      ? notification.content.data.medicationId
      : undefined;

    const isStockNotification = notification.identifier.startsWith('stock-');
    const stockMedicationId = isStockNotification ? notification.identifier.replace(/^stock-/, '') : undefined;
    const targetMedicationId = medicationId ?? stockMedicationId;

    if (targetMedicationId && !activeMedicationIds.has(targetMedicationId)) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      await dismissNotificationIfPresented(notification.identifier);
    }
  }

  const presentedNotifications = await Notifications.getPresentedNotificationsAsync();
  for (const notification of presentedNotifications) {
    const medicationId = typeof notification.request.content.data?.medicationId === 'string'
      ? notification.request.content.data.medicationId
      : undefined;

    if (medicationId && !activeMedicationIds.has(medicationId)) {
      await Notifications.dismissNotificationAsync(notification.request.identifier);
    }
  }

  await pruneStoredMedicationNotificationIds(activeMedicationIds);
}

export async function scheduleMedicationNotifications(
  medication: Medication,
  options: { requestPermissions?: boolean } = {}
) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  const permissionGranted = await ensureNotificationPermissionAsync(Boolean(options.requestPermissions));
  if (!permissionGranted) {
    return;
  }

  await cancelMedicationNotifications(medication.id);

  // Não agendar notificações para medicamentos "quando necessário"
  if (medication.frequency === 'quando necessário') {
    await clearStoredMedicationNotificationIds(medication.id);
    return;
  }

  const scheduledIds: string[] = [];

  for (const time of medication.times) {
    const trigger = getReminderTriggerForTime(time);
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Em ${REMINDER_LEAD_MINUTES} min: ${medication.name}`,
        body: `Dose agendada para ${time}. Toque para ver detalhes ou registrar a dose.`,
        subtitle: `Lembrete de Medicamento 💊`,
        sound: 'default',
        data: {
          medicationId: medication.id,
          scheduledTime: time,
          reminderLeadMinutes: REMINDER_LEAD_MINUTES,
        },
        categoryIdentifier: MEDICATION_REMINDER_CATEGORY_ID,
        color: medication.color || colors.primary,
      },
      trigger,
    });

    scheduledIds.push(identifier);

    if (shouldScheduleCatchUpReminder(time)) {
      const catchUpIdentifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Agora: ${medication.name}`,
          body: `A dose das ${time} esta proxima. Toque para ver detalhes ou registrar a dose.`,
          subtitle: `Lembrete de Medicamento 💊`,
          sound: 'default',
          data: {
            medicationId: medication.id,
            scheduledTime: time,
            reminderLeadMinutes: REMINDER_LEAD_MINUTES,
            catchUpReminder: true,
          },
          categoryIdentifier: MEDICATION_REMINDER_CATEGORY_ID,
          color: medication.color || colors.primary,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });

      scheduledIds.push(catchUpIdentifier);
    }
  }

  await storeMedicationNotificationIds(medication.id, scheduledIds);
}

export async function cancelMedicationNotifications(medicationId: string) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  const storedIdentifiers = await getStoredMedicationNotificationIds(medicationId);
  for (const identifier of storedIdentifiers) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    await dismissNotificationIfPresented(identifier);
  }

  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduledNotifications) {
    if (notification.content.data?.medicationId === medicationId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      await dismissNotificationIfPresented(notification.identifier);
    }
  }

  await dismissPresentedMedicationNotifications(medicationId);
  await clearStoredMedicationNotificationIds(medicationId);
  await cancelStockNotification(medicationId);
}

export async function cancelStockNotification(medicationId: string) {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return;
    }

    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduledNotifications) {
      if (notification.identifier === `stock-${medicationId}`) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
}

// ✅ Função unificada e corrigida, agora usando o `stockAlertThreshold`
export async function scheduleStockNotification(
  medication: Medication,
  options: { requestPermissions?: boolean } = {}
) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  const permissionGranted = await ensureNotificationPermissionAsync(Boolean(options.requestPermissions));
  if (!permissionGranted) {
    return;
  }

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
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
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

function getReminderTriggerForTime(time: string): DailyTriggerInput {
  const [hour, minute] = time.split(':').map(Number);
  const totalMinutes = hour * 60 + minute - REMINDER_LEAD_MINUTES;
  const normalizedMinutes = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);

  return {
    type: 'daily' as DailyTriggerInput['type'],
    hour: Math.floor(normalizedMinutes / 60),
    minute: normalizedMinutes % 60,
  };
}

function getDoseStatusFromActionIdentifier(actionIdentifier: string) {
  if (actionIdentifier === DOSE_TAKEN_ACTION_ID) {
    return 'taken' as const;
  }

  if (actionIdentifier === DOSE_SKIPPED_ACTION_ID) {
    return 'skipped' as const;
  }

  return null;
}

function buildScheduledDateFromTime(time: string, referenceDate = new Date()) {
  const [hour, minute] = time.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  const scheduledDate = new Date(referenceDate);
  scheduledDate.setHours(hour, minute, 0, 0);
  return scheduledDate;
}

function shouldScheduleCatchUpReminder(time: string, referenceDate = new Date()) {
  const { doseDate, reminderDate } = getDoseAndReminderDates(time, referenceDate);

  return referenceDate > reminderDate && referenceDate < doseDate;
}

function getDoseAndReminderDates(time: string, referenceDate = new Date()) {
  const [hour, minute] = time.split(':').map(Number);
  const doseDate = new Date(referenceDate);
  doseDate.setHours(hour, minute, 0, 0);

  const reminderDate = new Date(doseDate.getTime() - REMINDER_LEAD_MINUTES * 60 * 1000);

  return {
    doseDate,
    reminderDate,
  };
}

async function getStoredMedicationNotificationIds(medicationId: string) {
  try {
    const parsed = await getStoredMedicationNotificationIdMap();
    return parsed[medicationId] ?? [];
  } catch (error) {
    console.error('Error reading stored medication notification IDs:', error);
    return [];
  }
}

async function storeMedicationNotificationIds(medicationId: string, identifiers: string[]) {
  try {
    const parsed = await getStoredMedicationNotificationIdMap();
    parsed[medicationId] = identifiers;
    await AsyncStorage.setItem(MEDICATION_NOTIFICATION_IDS_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.error('Error storing medication notification IDs:', error);
  }
}

async function clearStoredMedicationNotificationIds(medicationId: string) {
  try {
    const parsed = await getStoredMedicationNotificationIdMap();
    delete parsed[medicationId];
    await AsyncStorage.setItem(MEDICATION_NOTIFICATION_IDS_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.error('Error clearing medication notification IDs:', error);
  }
}

async function dismissPresentedMedicationNotifications(medicationId: string) {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return;
    }

    const presentedNotifications = await Notifications.getPresentedNotificationsAsync();
    for (const notification of presentedNotifications) {
      if (notification.request.content.data?.medicationId === medicationId) {
        await Notifications.dismissNotificationAsync(notification.request.identifier);
      }
    }
  } catch (error) {
    console.error('Error dismissing presented medication notifications:', error);
  }
}

async function dismissNotificationIfPresented(identifier: string) {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return;
    }

    await Notifications.dismissNotificationAsync(identifier);
  } catch {
    // Ignore: notification may not be currently presented.
  }
}

async function getStoredMedicationNotificationIdMap() {
  const rawValue = await AsyncStorage.getItem(MEDICATION_NOTIFICATION_IDS_KEY);
  if (!rawValue) {
    return {} as Record<string, string[]>;
  }

  return JSON.parse(rawValue) as Record<string, string[]>;
}

async function pruneStoredMedicationNotificationIds(activeMedicationIds: Set<string>) {
  try {
    const Notifications = await getNotificationsModule();
    const parsed = await getStoredMedicationNotificationIdMap();
    const nextValue: Record<string, string[]> = {};

    for (const [medicationId, identifiers] of Object.entries(parsed)) {
      if (!activeMedicationIds.has(medicationId)) {
        for (const identifier of identifiers) {
          if (Notifications) {
            await Notifications.cancelScheduledNotificationAsync(identifier);
          }
          await dismissNotificationIfPresented(identifier);
        }
        continue;
      }

      nextValue[medicationId] = identifiers;
    }

    await AsyncStorage.setItem(MEDICATION_NOTIFICATION_IDS_KEY, JSON.stringify(nextValue));
  } catch (error) {
    console.error('Error pruning stored medication notification IDs:', error);
  }
}
