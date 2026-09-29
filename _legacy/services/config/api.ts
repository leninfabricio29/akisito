/**
 * Configuración centralizada de la API
 * Point único de verdad para URL base, timeouts, headers por defecto, etc.
 */

type RetryConfig = {
  readonly MAX_RETRIES: number;
  readonly RETRY_DELAY: number;
  readonly RETRY_CODES: readonly number[];
};

type ApiConfigType = {
  readonly BASE_URL: string;
  readonly VERSION: string;
  readonly TIMEOUT: number;
  readonly DEFAULT_HEADERS: Readonly<Record<string, string>>;
  readonly RETRY_CONFIG: RetryConfig;
  readonly ENDPOINTS: Readonly<Record<string, string>>;
};

const API_CONFIG: ApiConfigType = {
  // Base URL - Cambiar aquí actualiza toda la app
  //BASE_URL: 'https://winner.softkilla.es/api/v1',
  BASE_URL: 'http://172.30.0.188:3000/api/v1',
  // Versión de API (para facilitar migraciones futuras)
  VERSION: 'v1',

  // Timeouts por defecto (ms)
  TIMEOUT: 30000,

  // Headers por defecto
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },

  // Configuración de reintentos
  RETRY_CONFIG: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // ms
    RETRY_CODES: [408, 429, 500, 502, 503, 504], // Códigos HTTP a reintentar
  },

  // Endpoints por dominio (documentación)
  ENDPOINTS: {
    AUTH: '/auth',
    USERS: '/users',
    PLACES: '/places',
    PROMOTIONS: '/promotions',
    REDEMPTIONS: '/redemptions',
    VISITS: '/visits',
    FAVORITES: '/favorites',
    NOTIFICATIONS: '/notifications',
    ADVERTISEMENTS: '/advertisements',
    BUSINESS: '/business',
    POINT_SOURCES: '/point-sources',
  },
};

export default API_CONFIG;
