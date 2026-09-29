/**
 * Servicio de Notificaciones
 * Refactorizado: sin duplicación de URL ni cliente HTTP
 */

import API_CONFIG from '@/services/config/api';
import { httpDelete, httpGet, httpPut } from '@/services/http/client';
import { PaginatedResponse } from '@/services/types/api-types';

export type NotificationItem = {
  _id: string;
  user_id: string;
  title: string;
  description?: string; // O viene como 'description' del backend
  message?: string;     // O viene como 'message'
  type: 'promotion' | 'visit' | 'reward' | 'system' | 'review';
  related_id?: string;
  is_read: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateNotificationPayload = {
  user_id: string;
  title: string;
  description?: string;
  message?: string;
  type: 'promotion' | 'visit' | 'reward' | 'system' | 'review';
  related_id?: string;
};

/**
 * Obtener mis notificaciones
 */
export async function getMyNotificationsRequest(token: string): Promise<NotificationItem[]> {
  const result = await httpGet<
    NotificationItem[] | PaginatedResponse<NotificationItem>
  >(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/my`, token);

  // Normalizar respuesta paginada
  return Array.isArray(result) ? result : result.items;
}

/**
 * Marcar notificación como leída
 */
export async function markNotificationAsReadRequest(
  token: string,
  notificationId: string,
): Promise<NotificationItem> {
  return httpPut<NotificationItem, { is_read: boolean }>(
    `${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/${notificationId}`,
    { is_read: true },
    token,
  );
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function markAllNotificationsAsReadRequest(token: string): Promise<void> {
  await httpPut<void>(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/mark-all-read`, undefined, token);
}

/**
 * Eliminar notificación
 */
export async function deleteNotificationRequest(token: string, notificationId: string): Promise<void> {
  await httpDelete<void>(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/${notificationId}`, token);
}

/**
 * Obtener notificaciones no leídas
 */
export async function getUnreadNotificationsCountRequest(token: string): Promise<number> {
  const notifications = await getMyNotificationsRequest(token);
  return notifications.filter((n) => !n.is_read).length;
}
