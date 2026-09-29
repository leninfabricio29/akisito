import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import API_CONFIG from '@/services/config/api';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export type NotificationType = 'promotion' | 'social' | 'points';

export type NotificationItem = {
  _id: string;
  title: string;
  description?: string;
  user_id: string;
  status: 'pending' | 'read';
  type: NotificationType;
  createdAt: string;
  updatedAt: string;
};

export type NotificationListResponse = {
  items: NotificationItem[];
  unread: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

async function requestJson<TResponse>(
  path: string,
  options: {
    method: 'GET' | 'PATCH';
    token: string;
  },
): Promise<TResponse> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.token}`,
    },
  });

  const parsed = (await response.json()) as ApiResponse<TResponse>;

  if (!response.ok || !parsed.success || parsed.data === undefined) {
    throw new Error(parsed.message || 'Error en la solicitud');
  }

  return parsed.data;
}

export async function getMyNotificationsRequest(token: string): Promise<NotificationListResponse> {
  return requestJson<NotificationListResponse>('/notifications/my', {
    method: 'GET',
    token,
  });
}

export async function markNotificationAsReadRequest(token: string, notificationId: string): Promise<NotificationItem> {
  return requestJson<NotificationItem>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
    token,
  });
}

export async function schedulePushNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "You've got mail! 📬",
      body: 'Here is the notification body',
      data: { data: 'goes here', test: { test1: 'more data' } },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

export async function registerForPushNotificationsAsync() {
  let token: string | undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

      if (!projectId) {
        throw new Error('Project ID not found');
      }

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

      console.log('Expo Push Token:', token);
    } catch (e) {
      console.log('Error getting push token:', e);
      token = `${e}`;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
