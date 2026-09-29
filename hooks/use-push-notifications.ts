/**
 * Notificaciones push (Firebase Cloud Messaging).
 *
 * Registra el token en /devices/ cuando hay sesión, muestra las notificaciones que llegan
 * con la app abierta y navega a la pantalla correspondiente al tocarlas.
 */

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

import { notificationService } from '@/services';

let currentToken: string | null = null;

/** Token FCM del dispositivo (para desregistrarlo al cerrar sesión). */
export function getPushToken(): string | null {
  return currentToken;
}

async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  const status = await messaging().requestPermission();
  return status === messaging.AuthorizationStatus.AUTHORIZED || status === messaging.AuthorizationStatus.PROVISIONAL;
}

function openFromNotification(message: FirebaseMessagingTypes.RemoteMessage | null) {
  const data = message?.data ?? {};
  if (data.business_id) {
    router.push({ pathname: '/businesses/[id]', params: { id: String(data.business_id) } });
  } else if (data.redemption_id) {
    router.push('/profile/redemptions');
  } else if (message) {
    router.push('/notifications');
  }
}

export type ForegroundPush = { visible: boolean; title: string; body: string };

export function usePushNotifications(enabled: boolean) {
  const [foreground, setForeground] = useState<ForegroundPush>({ visible: false, title: '', body: '' });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const unsubscribers: (() => void)[] = [];

    (async () => {
      try {
        if (!(await requestPermission()) || cancelled) return;
        const token = await messaging().getToken();
        if (cancelled || !token) return;
        currentToken = token;
        await notificationService
          .registerDevice(token, Platform.OS, Device.modelName ?? `${Platform.OS} device`)
          .catch(() => undefined);

        unsubscribers.push(
          messaging().onTokenRefresh((next) => {
            currentToken = next;
            void notificationService.registerDevice(next, Platform.OS, Device.modelName ?? '').catch(() => undefined);
          }),
          messaging().onMessage((message) =>
            setForeground({
              visible: true,
              title: message.notification?.title ?? 'Akisito',
              body: message.notification?.body ?? '',
            }),
          ),
          messaging().onNotificationOpenedApp(openFromNotification),
        );
        openFromNotification(await messaging().getInitialNotification());
      } catch (error) {
        console.warn('[push] No se pudo inicializar FCM', error);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [enabled]);

  const dismiss = useCallback(() => setForeground((p) => ({ ...p, visible: false })), []);
  return { foreground, dismiss };
}
