/**
 * Servicio de Usuario
 * Refactorizado: sin duplicación de URL ni cliente HTTP
 */

import API_CONFIG from '@/services/config/api';
import { httpGet, httpPut } from '@/services/http/client';

export type UserProfile = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  referral_code?: string;
  points_balance?: number;
};

export type UpdateProfilePayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
};

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
};

export type StatsClient = {
  user_start: string;
  total_points: number;
  total_visits: number;
  total_redemptions: number;
  total_referrals: number;
  total_reviews: number;
};

/**
 * Obtener perfil de usuario
 */
export async function getUserProfileRequest(token: string): Promise<UserProfile> {
  return httpGet<UserProfile>(`${API_CONFIG.ENDPOINTS.USERS}/profile`, token);
}

/**
 * Actualizar perfil de usuario
 */
export async function updateProfileRequest(
  token: string,
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  return httpPut<UserProfile, UpdateProfilePayload>(
    `${API_CONFIG.ENDPOINTS.USERS}/profile`,
    payload,
    token,
  );
}

/**
 * Cambiar contraseña
 */
export async function changePasswordRequest(
  token: string,
  payload: ChangePasswordPayload,
): Promise<void> {
  await httpPut<void, ChangePasswordPayload>(
    `${API_CONFIG.ENDPOINTS.USERS}/change-password`,
    payload,
    token,
  );
}

/**
 * Obtener estadísticas del usuario
 */
export async function getUserStatsRequest(token: string): Promise<StatsClient> {
  return httpGet<StatsClient>(`${API_CONFIG.ENDPOINTS.USERS}/stats`, token);
}
