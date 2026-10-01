import Constants from 'expo-constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { contentService } from '@/services';

export type AppUpdate = {
  /** true: la versión instalada es menor que la mínima y no se puede seguir usando la app. */
  required: boolean;
  latestVersion: string;
  storeUrl: string;
  message: string;
};

/** -1 si `a` es anterior a `b` ("1.2" < "1.10.0"), 0 si son iguales, 1 si es posterior. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff) return diff < 0 ? -1 : 1;
  }
  return 0;
}

/**
 * Compara la versión instalada (la `version` de app.json con la que se compiló) con la publicada
 * en el admin, al abrir la app y cada vez que vuelve a primer plano.
 */
export function useAppUpdate() {
  const [update, setUpdate] = useState<AppUpdate | null>(null);
  // "Más tarde" solo silencia esa versión durante la sesión; la siguiente vez que se abra, vuelve a avisar.
  const dismissed = useRef<string | null>(null);

  const check = useCallback(async () => {
    const installed = Constants.expoConfig?.version;
    if (!installed || (Platform.OS !== 'android' && Platform.OS !== 'ios')) return;

    let info;
    try {
      info = await contentService.appVersion();
    } catch {
      return; // sin conexión: no se bloquea la app
    }
    const store = info[Platform.OS];
    if (!store.store_url) return;

    const required = !!store.min_version && compareVersions(installed, store.min_version) < 0;
    const outdated = compareVersions(installed, store.latest_version) < 0;

    if (required || (outdated && dismissed.current !== store.latest_version)) {
      setUpdate({ required, latestVersion: store.latest_version, storeUrl: store.store_url, message: info.message });
    } else {
      setUpdate(null);
    }
  }, []);

  useEffect(() => {
    void check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => sub.remove();
  }, [check]);

  const dismiss = useCallback(() => {
    setUpdate((current) => {
      if (current && !current.required) {
        dismissed.current = current.latestVersion;
        return null;
      }
      return current;
    });
  }, []);

  return { update, dismiss };
}
