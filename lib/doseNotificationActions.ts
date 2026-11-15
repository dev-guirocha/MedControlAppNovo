import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NotificationResponse } from 'expo-notifications';

import { getMedicationActionFromNotificationResponse } from '@/lib/notifications';
import { useMedicationStore } from '@/hooks/useMedicationStore';
import { useDoseHistoryStore } from '@/hooks/useDoseHistoryStore';
import { MEDS_KEY } from '@/src/constants/keys';

/**
 * Registro de dose pelos botões "Tomei"/"Pulei" da notificação, sem abrir o app.
 *
 * No Android, um botão com `opensAppToForeground: false` roda a task abaixo quando o app
 * está em segundo plano ou fechado. Com o app vivo em segundo plano, o listener de resposta
 * TAMBÉM recebe o toque; e com o app fechado, a resposta fica pendente e chega de novo ao
 * listener na próxima abertura. Por isso todo caminho passa por `handleDoseActionResponse`,
 * que deduplica em memória (mesmo runtime) e em disco (runtimes diferentes) — senão o
 * estoque seria descontado duas vezes.
 */

export const DOSE_ACTION_TASK = 'medcontrol-dose-action';
const HANDLED_RESPONSES_KEY = '@handled_dose_action_responses';
const MAX_HANDLED_RESPONSES = 100;

const inFlight = new Map<string, Promise<void>>();

function getResponseKey(response: NotificationResponse) {
  return `${response.notification.request.identifier}:${response.notification.date}:${response.actionIdentifier}`;
}

/** A task recebe o payload cru do nativo, em que `data` pode vir como string JSON em `dataString`. */
function normalizeResponse(response: NotificationResponse): NotificationResponse {
  const content = response.notification?.request?.content as
    | (NotificationResponse['notification']['request']['content'] & { dataString?: string })
    | undefined;
  if (!content || content.data || typeof content.dataString !== 'string') {
    return response;
  }
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(content.dataString);
  } catch {
    // payload inválido: segue sem data e a ação é ignorada adiante
  }
  return {
    ...response,
    notification: {
      ...response.notification,
      request: { ...response.notification.request, content: { ...content, data } },
    },
  };
}

async function readHandledKeys(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(HANDLED_RESPONSES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function markHandled(key: string) {
  const keys = await readHandledKeys();
  const next = [...keys.filter((item) => item !== key), key].slice(-MAX_HANDLED_RESPONSES);
  await AsyncStorage.setItem(HANDLED_RESPONSES_KEY, JSON.stringify(next));
}

/**
 * Recarrega medicamentos e histórico do disco sem reagendar notificações.
 * Necessário na task (pode rodar num runtime novo, com stores vazias) e quando o app volta
 * ao primeiro plano depois de uma dose registrada em segundo plano.
 */
export async function hydrateDoseStoresFromStorage() {
  const storedMeds = await AsyncStorage.getItem(MEDS_KEY);
  useMedicationStore.setState({ medications: storedMeds ? JSON.parse(storedMeds) : [] });
  await useDoseHistoryStore.getState().loadHistory();
}

export function handleDoseActionResponse(
  rawResponse: NotificationResponse,
  options: { hydrate?: boolean } = {}
): Promise<void> {
  const response = normalizeResponse(rawResponse);
  const key = getResponseKey(response);

  const running = inFlight.get(key);
  if (running) return running;

  const job = (async () => {
    const action = getMedicationActionFromNotificationResponse(response);
    if (!action) return;

    const handledKeys = await readHandledKeys();
    if (!handledKeys.includes(key)) {
      if (options.hydrate) {
        await hydrateDoseStoresFromStorage();
      }
      await useMedicationStore.getState().logDose(action.medicationId, action.scheduledDate, action.status);
      await markHandled(key);
    }

    // Botão de ação não fecha a notificação sozinho no Android.
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.dismissNotificationAsync(action.notificationIdentifier);
    } catch {
      // já não estava visível
    }
  })();

  inFlight.set(key, job);
  job.finally(() => inFlight.delete(key)).catch(() => undefined);
  return job;
}

// A task precisa ser definida no escopo do módulo, carregado pelo entry (index.js),
// porque com o app fechado o Android sobe só o bundle JS, sem montar telas.
if (Platform.OS === 'android') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const TaskManager = require('expo-task-manager') as typeof import('expo-task-manager');

  TaskManager.defineTask<unknown>(DOSE_ACTION_TASK, async ({ data, error }) => {
    if (error || !data || typeof data !== 'object' || !('actionIdentifier' in data)) {
      return;
    }
    try {
      await handleDoseActionResponse(data as NotificationResponse, { hydrate: true });
    } catch (taskError) {
      console.error('Erro ao registrar dose pela notificação:', taskError);
    }
  });
}

/** Liga a task ao expo-notifications. O registro persiste; chamar de novo é inofensivo. */
export async function registerDoseActionTaskAsync() {
  if (Platform.OS !== 'android') return;
  const Notifications = await import('expo-notifications');
  await Notifications.registerTaskAsync(DOSE_ACTION_TASK);
}
