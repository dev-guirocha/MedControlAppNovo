import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NotificationResponse, NotificationTriggerInput } from 'expo-notifications';

import { colors } from '@/constants/theme';
import { Medication } from '@/types/medication';
import { buildNotificationText } from '@/lib/people';
import {
  expandMedicationTimes,
  getMedicationWeekdays,
  getReminderSlot,
  isScheduledOnDate,
  parseTime,
  resolveDoseDateFromNotification,
} from '@/lib/schedule';

const MEDICATION_REMINDER_CATEGORY_ID = 'medication-reminder';
const STOCK_ALERT_CATEGORY_ID = 'stock-alert'; // Categoria para o alerta de estoque
const REMINDER_LEAD_MINUTES = 5;
const MEDICATION_NOTIFICATION_IDS_KEY = 'medication_notification_ids';
const IOS_NOTIFICATIONS_TEMPORARILY_DISABLED = Platform.OS === 'ios';
const DOSE_TAKEN_ACTION_ID = 'dose-taken';
const DOSE_SKIPPED_ACTION_ID = 'dose-skipped';
// Canal criado em ensureNotificationsInitialized; sem ele o Android usa o canal genérico do Expo.
const ANDROID_CHANNEL_ID = 'default';
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
  // Os botões registram a dose em segundo plano (lib/doseNotificationActions.ts), sem abrir o app.
  // Tocar no corpo da notificação continua abrindo o app normalmente.
    { identifier: DOSE_TAKEN_ACTION_ID, buttonTitle: 'Tomei ✅', options: { opensAppToForeground: false } },
    { identifier: DOSE_SKIPPED_ACTION_ID, buttonTitle: 'Pulei ❌', options: { opensAppToForeground: false, isDestructive: true } },
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
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
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
    reminderLeadMinutes?: number;
    catchUpReminder?: boolean;
  };

  const status = getDoseStatusFromActionIdentifier(actionIdentifier);
  if (!status || !data.medicationId || !data.scheduledTime) {
    return null;
  }

  // O dia da dose vem do momento em que o lembrete disparou, não de quando o usuário tocou nele.
  const firedAt = new Date(response.notification.date || Date.now());
  const leadMinutes = data.catchUpReminder ? 0 : (data.reminderLeadMinutes ?? REMINDER_LEAD_MINUTES);
  const scheduledDate = resolveDoseDateFromNotification(data.scheduledTime, firedAt, leadMinutes);
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
  options: { requestPermissions?: boolean; allowCatchUp?: boolean; personName: string | null }
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

  // Tratamento encerrado não tem lembretes.
  if (medication.endedAt) {
    await clearStoredMedicationNotificationIds(medication.id);
    return;
  }

  // Não agendar notificações para medicamentos "quando necessário"
  if (medication.frequency === 'quando necessário') {
    await clearStoredMedicationNotificationIds(medication.id);
    return;
  }

  const scheduledIds: string[] = [];

  const weekdays: (number | null)[] = medication.frequency === 'semanal' ? getMedicationWeekdays(medication) : [null];
  const now = new Date();

  for (const time of expandMedicationTimes(medication)) {
    for (const weekday of weekdays) {
      const slot = getReminderSlot(time, REMINDER_LEAD_MINUTES, weekday);
      if (!slot) continue;

      const trigger: NotificationTriggerInput = slot.weekday === null
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            channelId: ANDROID_CHANNEL_ID,
            hour: slot.hour,
            minute: slot.minute,
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            channelId: ANDROID_CHANNEL_ID,
            weekday: slot.weekday + 1, // Expo: 1 = domingo; JS: 0 = domingo
            hour: slot.hour,
            minute: slot.minute,
          };

      const leadText = buildNotificationText({
        kind: 'lead',
        personName: options.personName,
        medicationName: medication.name,
        time,
        leadMinutes: REMINDER_LEAD_MINUTES,
      });
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: leadText.title,
          body: leadText.body,
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
    }

    // Lembrete imediato só quando o usuário acabou de cadastrar/editar dentro da janela
    // de antecedência — nunca ao simplesmente abrir o app (gerava notificação duplicada).
    if (options.allowCatchUp && isScheduledOnDate(medication, now) && shouldScheduleCatchUpReminder(time, now)) {
      const nowText = buildNotificationText({
        kind: 'now',
        personName: options.personName,
        medicationName: medication.name,
        time,
      });
      const catchUpIdentifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: nowText.title,
          body: nowText.body,
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
          channelId: ANDROID_CHANNEL_ID,
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
  options: { requestPermissions?: boolean; personName: string | null }
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
      const stockText = buildNotificationText({
        kind: 'stock',
        personName: options.personName,
        medicationName: medication.name,
        stock: medication.stock,
      });
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: stockText.title,
          body: stockText.body,
          sound: 'default',
          categoryIdentifier: STOCK_ALERT_CATEGORY_ID,
          data: { medicationId: medication.id, type: 'stock_alert' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          channelId: ANDROID_CHANNEL_ID,
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

function getDoseStatusFromActionIdentifier(actionIdentifier: string) {
  if (actionIdentifier === DOSE_TAKEN_ACTION_ID) {
    return 'taken' as const;
  }

  if (actionIdentifier === DOSE_SKIPPED_ACTION_ID) {
    return 'skipped' as const;
  }

  return null;
}

function shouldScheduleCatchUpReminder(time: string, referenceDate = new Date()) {
  const { doseDate, reminderDate } = getDoseAndReminderDates(time, referenceDate);

  return referenceDate > reminderDate && referenceDate < doseDate;
}

function getDoseAndReminderDates(time: string, referenceDate = new Date()) {
  const parsed = parseTime(time) ?? { h: 0, m: 0 };
  const doseDate = new Date(referenceDate);
  doseDate.setHours(parsed.h, parsed.m, 0, 0);

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
