/**
 * Hook para inicializar Firebase Cloud Messaging (FCM)
 * Maneja:
 * - Solicitud de permisos
 * - Obtención del token FCM
 * - Registro del token en backend
 * - Listeners para notificaciones foreground y background
 */

import API_CONFIG from '@/services/config/api';
import messaging from '@react-native-firebase/messaging';
import { useEffect, useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';


export function useFirebaseNotifications(token: string | null) {
  /**
   * Solicita permisos de notificaciones al usuario
   * En Android 13+, necesita hacer el request en runtime
   * 
   * 
   */

const [alert, setAlert] = useState({ visible: false, title: '', body: '' });
  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      
      
      // En Android 13+, solicitar permiso en runtime
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notificaciones',
            message: 'Necesitamos tu permiso para enviarte notificaciones importantes sobre ofertas y puntos.',
            buttonNeutral: 'Preguntar después',
            buttonNegative: 'Cancelar',
            buttonPositive: 'Permitir',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('[FCM] POST_NOTIFICATIONS permission granted');
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
          console.log('[FCM] POST_NOTIFICATIONS permission denied');
          Alert.alert(
            'Notificaciones Deshabilitadas',
            'Sin notificaciones no recibirás actualizaciones de ofertas y puntos. Puedes habilitarlas en Configuración.'
          );
          return false;
        } else {
          console.log('[FCM] POST_NOTIFICATIONS permission request cancelled');
          return false;
        }
      }

      // En iOS y Android < 13, solicitar a través de Firebase
      const authStatus = await messaging().requestPermission();
      
      
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('[FCM] Firebase permission granted');
        return true;
      } else {
        console.log('[FCM] Firebase permission denied');
        Alert.alert(
          'Notificaciones Deshabilitadas',
          'Sin notificaciones no recibirás actualizaciones de ofertas y puntos.'
        );
        return false;
      }
    } catch (error) {
      console.error('[FCM] Permission request error:', error);
      
      Alert.alert(
        'Error',
        'No se pudo solicitar el permiso de notificaciones. Por favor intenta más tarde.'
      );
      
      return false;
    }
  };

  /**
   * Obtiene el token FCM del dispositivo
   */
  const getFCMToken = async (): Promise<string | null> => {
    try {
      console.log('[FCM] Getting FCM token...');
      
      const fcmToken = await messaging().getToken();
      
      if (fcmToken) {
        console.log('[FCM] Token obtained:', fcmToken);
        return fcmToken;
      }
      
      console.warn('[FCM] No token available');
      return null;
    } catch (error) {
      console.error('[FCM] Error getting token:', error);
      return null;
    }
  };

  /**
   * Registra el token FCM en el backend
   */
  const registerTokenInBackend = async (fcmToken: string) => {
    if (!token || !fcmToken) {
      console.warn('[FCM] Missing token or authToken for registration');
      return;
    }

    try {
      console.log('[FCM] Registering token in backend...');
      
      const url = `${API_CONFIG.BASE_URL}/fcm-devices/register`;
      console.log('[FCM] Register URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fcm_token: fcmToken,
          device_name: `${Platform.OS} Device`
        })
      });

      console.log('[FCM] Backend response status:', response.status);

      if (response.ok) {
        console.log('[FCM] Token registered in backend successfully');
      } else {
        const errorBody = await response.text();
        console.error('[FCM] Failed to register token:', response.statusText, errorBody);
      }
    } catch (error) {
      console.error('[FCM] Error registering token:', error);
    }
  };

  /**
   * Inicializa listeners para notificaciones
   */
  const setupNotificationListeners = () => {
    console.log('[FCM] Setting up notification listeners...');
    
    // Escuchar notificaciones cuando la app está en foreground
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {

        setAlert({
          visible: true,
          title: remoteMessage.notification?.title || 'Notificación',
          body: remoteMessage.notification?.body || '',
        });

     
    });

    // Escuchar cuando se presiona la notificación (app en background o cerrada)
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[FCM] Notification opened:', remoteMessage);
      // Aquí puedes navegar a la pantalla correspondiente
    });

    // Verificar si hay una notificación que abrió la app
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('[FCM] App opened by notification:', remoteMessage);
        }
      });

    return unsubscribeForeground;
  };

  /**
   * Inicializar todo el sistema de FCM
   */
  useEffect(() => {
    const initializeFCM = async () => {
      console.log('[FCM] Initializing Firebase Cloud Messaging...');
      
      // 1. Solicitar permisos
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        console.warn('[FCM] Notification permission not granted, skipping initialization');
        return;
      }

      // 2. Obtener token
      const fcmToken = await getFCMToken();
      if (!fcmToken) {
        console.warn('[FCM] Could not obtain FCM token');
        return;
      }

      // 3. Registrar en backend si hay sesión
      if (token) {
        await registerTokenInBackend(fcmToken);
      } else {
        console.warn('[FCM] No auth token available, will register after login');
      }

      // 4. Setup listeners
      const unsubscribeForeground = setupNotificationListeners();

      // Cleanup
      return () => {
        console.log('[FCM] Cleaning up listeners');
        unsubscribeForeground();
      };
    };

    initializeFCM();
  }, [token]);

  // Retornar el estado del alert para que el componente lo use
  return { alert, setAlert };
}
