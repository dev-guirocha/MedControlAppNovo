import React, { useEffect, useState } from 'react';
import { View, NativeModules } from 'react-native';
import { ADS_ENABLED } from '@/constants/flags';

// Renderiza um banner adaptativo. Em ambientes sem o módulo nativo (Expo Go), retorna null.
export function AdBanner() {
  if (!ADS_ENABLED) return null;
  const [mod, setMod] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Em Expo Go não existe o módulo nativo RNGoogleMobileAdsModule — não tente renderizar
        if (!NativeModules || !NativeModules.RNGoogleMobileAdsModule) return;
        const m = await import('react-native-google-mobile-ads');
        if (mounted) setMod(m);
      } catch {
        // Módulo indisponível (ex.: Expo Go). Não renderiza anúncio.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!mod || !mod.BannerAd) return null;
  const { BannerAd, BannerAdSize, TestIds } = mod;
  const unitId = __DEV__ ? TestIds.BANNER : TestIds.BANNER; // troque pelo seu unitId em produção

  return (
    <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 16 }}>
      <BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}

export default AdBanner;
