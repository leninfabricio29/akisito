/**
 * Cliente HTTP centralizado
 * Maneja lógica común: auth, errores, reintentos, headers
 * Reduce duplicación en todos los servicios
 */

import API_CONFIG from '@/services/config/api';
import { ApiResponse, RequestOptions } from '@/services/types/api-types';

class HttpRequestError extends Error {
  readonly status: number;
  readonly retryable: boolean;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = 'HttpRequestError';
    this.status = status;
    this.retryable = retryable;
  }
}

function getRetryDelay(attempt: number): number {
  return API_CONFIG.RETRY_CONFIG.RETRY_DELAY * attempt;
}

function shouldRetryStatus(status: number): boolean {
  return API_CONFIG.RETRY_CONFIG.RETRY_CODES.includes(status);
}

function isLikelyNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}

/**
 * Realiza una solicitud con manejo de errores centralizado
 */
async function request<TResponse, TBody = undefined>(
  path: string,
  options: RequestOptions<TBody>,
): Promise<TResponse> {
  const {
    method = 'GET',
    token,
    body,
    allowEmptyData = false,
    headers: customHeaders = {},
  } = options;

  const headers: Record<string, string> = {
    ...API_CONFIG.DEFAULT_HEADERS,
    ...customHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_CONFIG.BASE_URL}${path}`;

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= API_CONFIG.RETRY_CONFIG.MAX_RETRIES) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      const parsed = (await response.json()) as ApiResponse<TResponse>;

      // Validar respuesta exitosa
      if (!response.ok || !parsed.success) {
        throw new HttpRequestError(
          parsed.message || 'Error en la solicitud',
          response.status,
          shouldRetryStatus(response.status),
        );
      }

      // Validar datos
      if (!allowEmptyData && parsed.data === undefined) {
        throw new Error(parsed.message || 'La respuesta no contiene datos');
      }

      if (allowEmptyData && parsed.data === undefined) {
        return parsed as unknown as TResponse;
      }

      return (parsed.data as TResponse) ?? ({} as TResponse);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const canRetryByStatus =
        error instanceof HttpRequestError ? error.retryable : false;
      const canRetryByNetwork = isLikelyNetworkError(error);
      const canRetry =
        attempt < API_CONFIG.RETRY_CONFIG.MAX_RETRIES && (canRetryByStatus || canRetryByNetwork);

      if (!canRetry) {
        throw lastError;
      }

      attempt++;
      await new Promise((resolve) => setTimeout(resolve, getRetryDelay(attempt)));
    }
  }

  throw lastError || new Error('Error desconocido en solicitud HTTP');
}

/**
 * Realiza una solicitud FormData con manejo de errores centralizado
 * Para archivos multipart/form-data
 */
async function requestFormData<TResponse>(
  path: string,
  method: 'POST' | 'PUT',
  formData: any,
  token?: string,
): Promise<TResponse> {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_CONFIG.BASE_URL}${path}`;

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= API_CONFIG.RETRY_CONFIG.MAX_RETRIES) {
    try {
      const response = await fetch(url, {
        method,
        headers, // No incluir Content-Type, el navegador lo maneja automáticamente
        body: formData,
      });

      const parsed = (await response.json()) as ApiResponse<TResponse>;

      // Validar respuesta exitosa
      if (!response.ok || !parsed.success) {
        throw new HttpRequestError(
          parsed.message || 'Error en la solicitud',
          response.status,
          shouldRetryStatus(response.status),
        );
      }

      if (parsed.data === undefined) {
        return parsed as unknown as TResponse;
      }

      return (parsed.data as TResponse) ?? ({} as TResponse);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const canRetryByStatus =
        error instanceof HttpRequestError ? error.retryable : false;
      const canRetryByNetwork = isLikelyNetworkError(error);
      const canRetry =
        attempt < API_CONFIG.RETRY_CONFIG.MAX_RETRIES && (canRetryByStatus || canRetryByNetwork);

      if (!canRetry) {
        throw lastError;
      }

      attempt++;
      await new Promise((resolve) => setTimeout(resolve, getRetryDelay(attempt)));
    }
  }

  throw lastError || new Error('Error desconocido en solicitud HTTP');
}

/**
 * Método GET
 */
export async function httpGet<TResponse>(
  path: string,
  token?: string,
  options?: Partial<RequestOptions>,
): Promise<TResponse> {
  return request<TResponse>(path, {
    method: 'GET',
    token,
    ...options,
  });
}

/**
 * Método POST - Overloads para mejor type inference
 */
export async function httpPost<TResponse, TBody>(
  path: string,
  body: TBody,
  token?: string,
  options?: Partial<RequestOptions>,
): Promise<TResponse>;
export async function httpPost<TResponse>(
  path: string,
  body?: undefined,
  token?: string,
  options?: Partial<RequestOptions>,
): Promise<TResponse>;
export async function httpPost<TResponse, TBody = undefined>(
  path: string,
  body?: TBody,
  token?: string,
  options?: Partial<RequestOptions>,
): Promise<TResponse> {
  return request<TResponse, TBody>(path, {
    method: 'POST',
    body,
    token,
    ...options,
  });
}

/**
 * Método PUT - Overloads para mejor type inference
 */
export async function httpPut<TResponse, TBody>(
  path: string,
  body: TBody,
  token?: string,
  options?: Partial<RequestOptions>,
): Promise<TResponse>;
export async function httpPut<TResponse>(
  path: string,
  body?: undefined,
  token?: string,
  options?: Partial<RequestOptions>,
): Promise<TResponse>;
export async function httpPut<TResponse, TBody = undefined>(
  path: string,
  body?: TBody,
  token?: string,
  options?: Partial<RequestOptions>,
): Promise<TResponse> {
  return request<TResponse, TBody>(path, {
    method: 'PUT',
    body,
    token,
    ...options,
  });
}

/**
 * Método PATCH - Overloads para mejor type inference
 */
export async function httpPatch<TResponse, TBody>(
  path: string,
  body: TBody,
  token?: string,
  options?: Partial<RequestOptions>,
): Promise<TResponse>;
export async function httpPatch<TResponse>(
  path: string,
  body?: undefined,
  token?: string,
  options?: Partial<RequestOptions>,
): Promise<TResponse>;
export async function httpPatch<TResponse, TBody = undefined>(
  path: string,
  body?: TBody,
  token?: string,
  options?: Partial<RequestOptions>,
): Promise<TResponse> {
  return request<TResponse, TBody>(path, {
    method: 'PATCH',
    body,
    token,
    ...options,
  });
}

/**
 * Método DELETE
 */
export async function httpDelete<TResponse = void>(
  path: string,
  token?: string,
  options?: Partial<RequestOptions>,
): Promise<TResponse> {
  return request<TResponse>(path, {
    method: 'DELETE',
    token,
    ...options,
  });
}

/**
 * Método POST con FormData (multipart/form-data)
 * Para enviar archivos
 */
export async function httpPostFormData<TResponse>(
  path: string,
  formData: any,
  token?: string,
): Promise<TResponse> {
  return requestFormData<TResponse>(path, 'POST', formData, token);
}

/**
 * Método PUT con FormData (multipart/form-data)
 * Para actualizar archivos
 */
export async function httpPutFormData<TResponse>(
  path: string,
  formData: any,
  token?: string,
): Promise<TResponse> {
  return requestFormData<TResponse>(path, 'PUT', formData, token);
}
