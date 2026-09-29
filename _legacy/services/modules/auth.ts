/**
 * Servicio de Autenticación
 * Refactorizado: sin duplicación de URL ni cliente HTTP
 */

import API_CONFIG from '@/services/config/api';
import { httpPost } from '@/services/http/client';
import { AuthPayload, BackendAuthUser } from '@/services/types/api-types';

export type RegisterClientPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  ci: string;
  referral_code_used?: string;
};

export type RegisterBusinessPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  ruc: string;
  business_name: string;
  business_category: string;
};

export type ForgotPasswordPayload = {
  ci?: string;
  ruc?: string;
};

// Re-exportar para compatibilidad
export { API_CONFIG };
export type { AuthPayload, BackendAuthUser };

/**
 * Iniciar sesión
 */
export async function loginRequest(email: string, password: string): Promise<AuthPayload> {
  const result = await httpPost<AuthPayload, { email: string; password: string }>(
    `${API_CONFIG.ENDPOINTS.AUTH}/login`,
    { email, password },
    undefined,
  );

  if (!result) {
    throw new Error('Respuesta invalida del servidor');
  }

  return result;
}

/**
 * Registrar cliente
 */
export async function registerClientRequest(payload: RegisterClientPayload): Promise<AuthPayload> {
  const result = await httpPost<AuthPayload, RegisterClientPayload>(
    `${API_CONFIG.ENDPOINTS.AUTH}/register/client`,
    payload,
    undefined,
  );

  if (!result) {
    throw new Error('Respuesta invalida del servidor');
  }

  return result;
}

/**
 * Registrar negocio
 */
export async function registerBusinessRequest(
  payload: RegisterBusinessPayload,
): Promise<AuthPayload> {
  const result = await httpPost<AuthPayload, RegisterBusinessPayload>(
    `${API_CONFIG.ENDPOINTS.AUTH}/register/business`,
    payload,
    undefined,
  );

  if (!result) {
    throw new Error('Respuesta invalida del servidor');
  }

  return result;
}

/**
 * Solicitar recuperación de contraseña
 */
export async function forgotPasswordRequest(
  payload: ForgotPasswordPayload,
): Promise<{ email?: string; message?: string }> {
  const result = await httpPost<any, ForgotPasswordPayload>(
    `${API_CONFIG.ENDPOINTS.AUTH}/forgot-password`,
    payload,
    undefined,
    { allowEmptyData: true },
  );

  return {
    email: result?.email,
    message: result?.message,
  };
}


/**
 * Validar código de reestablecimiento
 */
export async function validateResetCodeRequest(email: string, code: string): Promise<boolean> {
  const result = await httpPost<boolean, { email: string; code: string }>(
    `${API_CONFIG.ENDPOINTS.AUTH}/validate-reset-token`,
    { email, code },
    undefined,
  );

  return Boolean(result);
}

/**
 * Reestablecer contraseña
 */
export async function resetPasswordRequest(
  email: string,
  token: string,
  newPassword: string,
): Promise<void> {
  await httpPost<void, { email: string; token: string; new_password: string }>(
    `${API_CONFIG.ENDPOINTS.AUTH}/reset-password`,
    { email, token, new_password: newPassword },
    undefined,
  );
}
