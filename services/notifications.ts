import { api } from './api/client';
import { AppNotification, Banner, Paginated } from './api/types';

export const notificationService = {
  list: (page = 1) => api.get<Paginated<AppNotification>>('/notifications/', { page }),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count/'),
  markRead: (id: number) => api.post<void>(`/notifications/${id}/read/`),
  markAllRead: () => api.post<{ updated: number }>('/notifications/read-all/'),

  registerDevice: (token: string, platform: string, name: string) => api.post<void>('/devices/', { token, platform, name }),
  unregisterDevice: (token: string) => api.delete('/devices/', { token }),
};

export type PlatformVersion = { latest_version: string; min_version: string | null; store_url: string | null };
export type AppVersionInfo = { android: PlatformVersion; ios: PlatformVersion; message: string };

export const contentService = {
  banners: () => api.get<Banner[]>('/banners/', undefined, false),
  appVersion: () => api.get<AppVersionInfo>('/app/version/', undefined, false),
};
