import { InteractionManager, NativeModules } from 'react-native';
import { ADS_ENABLED } from '@/constants/flags';
import AsyncStorage from '@react-native-async-storage/async-storage';

let initialized = false;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STORAGE_KEYS = {
  interstitialCount: '@ads:interstitialCount',
  interstitialDay: '@ads:interstitialDay',
  lastInterstitialTs: '@ads:lastInterstitialTs',
};

const LIMITS = {
  perDay: 3,
  minIntervalMs: 2 * 60 * 1000, // 2 minutes between interstitials
};

async function getAdsModule() {
  const mod = await import('react-native-google-mobile-ads');
  return mod;
}

export async function ensureAdsInitialized() {
  try {
    if (initialized) return true;
    if (!ADS_ENABLED || !NativeModules || !(NativeModules as any).RNGoogleMobileAdsModule) {
      return false;
    }
    const { default: googleMobileAds } = await getAdsModule();
    await googleMobileAds().initialize();
    initialized = true;
    return true;
  } catch {
    return false;
  }
}

export async function showInterstitialMaybe(options?: { force?: boolean }) {
  const force = !!options?.force;
  if (!ADS_ENABLED) return false;
  try {
    const ok = await ensureAdsInitialized();
    if (!ok) return false;

    const { InterstitialAd, TestIds, AdEventType } = await getAdsModule();

    const now = Date.now();
    const day = todayKey();
    const storedDay = (await AsyncStorage.getItem(STORAGE_KEYS.interstitialDay)) || '';
    let count = 0;
    if (storedDay === day) {
      const s = await AsyncStorage.getItem(STORAGE_KEYS.interstitialCount);
      count = s ? parseInt(s, 10) || 0 : 0;
    }
    const lastTs = parseInt((await AsyncStorage.getItem(STORAGE_KEYS.lastInterstitialTs)) || '0', 10) || 0;
    const withinInterval = now - lastTs < LIMITS.minIntervalMs;
    const overDaily = count >= LIMITS.perDay;
    if (!force && (overDaily || withinInterval)) return false;

    const unitId = __DEV__ ? TestIds.INTERSTITIAL : TestIds.INTERSTITIAL; // replace in prod
    const interstitial = InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    return await new Promise<boolean>((resolve) => {
      const unsub = interstitial.addAdEventListener(AdEventType.CLOSED, async () => {
        unsub();
        const newDay = todayKey();
        const dayChanged = (await AsyncStorage.getItem(STORAGE_KEYS.interstitialDay)) !== newDay;
        const prev = parseInt((await AsyncStorage.getItem(STORAGE_KEYS.interstitialCount)) || '0', 10) || 0;
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.interstitialDay, newDay],
          [STORAGE_KEYS.interstitialCount, String(dayChanged ? 1 : prev + 1)],
          [STORAGE_KEYS.lastInterstitialTs, String(Date.now())],
        ]);
        resolve(true);
      });

      interstitial.load();
      interstitial.show().catch(() => resolve(false));
    });
  } catch {
    return false;
  }
}

export function showInterstitialMaybeBg(options?: { force?: boolean }) {
  InteractionManager.runAfterInteractions(() => {
    showInterstitialMaybe(options).catch(() => undefined);
  });
}

export async function showRewardedMaybe() {
  try {
    const ok = await ensureAdsInitialized();
    if (!ok) return false;
    const { RewardedAd, TestIds, AdEventType } = await getAdsModule();
    const unitId = __DEV__ ? TestIds.REWARDED : TestIds.REWARDED;
    const rewarded = RewardedAd.createForAdRequest(unitId, { requestNonPersonalizedAdsOnly: true });
    return await new Promise<boolean>((resolve) => {
      const unsub = rewarded.addAdEventListener(AdEventType.EARNED_REWARD, () => {
        unsub();
        resolve(true);
      });
      rewarded.load();
      rewarded.show().catch(() => resolve(false));
    });
  } catch {
    return false;
  }
}
