/**
 * Cliente HTTP de la API de Akisito (Django REST Framework).
 *
 * - Adjunta el JWT automáticamente y lo renueva una vez si expira (401).
 * - Convierte los errores `{detail, code, errors}` en `ApiError`.
 * - Solo reintenta errores de red en peticiones GET (nunca un POST: podría duplicar un canje).
 */

import { API_URL, REQUEST_TIMEOUT_MS } from './config';
import { getTokens, notifySessionExpired, setTokens } from './token-store';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string[]>;
  readonly data: Record<string, unknown>;

  constructor(message: string, status: number, code: string, fields: Record<string, string[]> = {}, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.data = data;
  }

  /** Primer mensaje de error de un campo, útil para formularios. */
  field(name: string): string | undefined {
    return this.fields[name]?.[0];
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Query;
  auth?: boolean;
};

let refreshing: Promise<boolean> | null = null;

function buildUrl(path: string, query?: Query): string {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return params ? `${url}?${params}` : url;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const tokens = getTokens();
  if (!tokens) return false;
  try {
    const response = await fetchWithTimeout(buildUrl('/auth/refresh/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { access: string; refresh?: string };
    await setTokens({ access: data.access, refresh: data.refresh ?? tokens.refresh });
    return true;
  } catch {
    return false;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let payload: Record<string, unknown> = {};
  try {
    payload = await response.json();
  } catch {
    // respuesta sin JSON (p. ej. 502 del proxy)
  }
  const message =
    (typeof payload.detail === 'string' && payload.detail) ||
    (response.status >= 500 ? 'El servidor no está disponible. Intenta de nuevo en unos minutos.' : 'No se pudo completar la solicitud.');
  const code = (typeof payload.code === 'string' && payload.code) || `http_${response.status}`;
  const fields = (payload.errors as Record<string, string[]>) || {};
  return new ApiError(message, response.status, code, fields, payload);
}

async function send<T>(path: string, { method = 'GET', body, query, auth = true }: Options, retry = 0): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  const tokens = auth ? getTokens() : null;
  if (tokens) headers.Authorization = `Bearer ${tokens.access}`;

  let response: Response;
  try {
    response = await fetchWithTimeout(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    if (method === 'GET' && retry < 2) {
      await new Promise((r) => setTimeout(r, 600 * (retry + 1)));
      return send<T>(path, { method, body, query, auth }, retry + 1);
    }
    throw new ApiError('Sin conexión. Revisa tu internet e inténtalo de nuevo.', 0, 'network_error');
  }

  if (response.status === 401 && tokens && retry === 0) {
    refreshing = refreshing ?? refreshAccessToken().finally(() => (refreshing = null));
    if (await refreshing) {
      return send<T>(path, { method, body, query, auth }, retry + 1);
    }
    await setTokens(null);
    notifySessionExpired();
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, query?: Query, auth = true) => send<T>(path, { query, auth }),
  post: <T>(path: string, body?: unknown, auth = true) => send<T>(path, { method: 'POST', body, auth }),
  patch: <T>(path: string, body?: unknown) => send<T>(path, { method: 'PATCH', body }),
  delete: <T = void>(path: string, body?: unknown) => send<T>(path, { method: 'DELETE', body }),
};

/** Mensaje amigable para mostrar en alertas. */
export function errorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
