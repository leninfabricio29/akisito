/**
 * Tipos compartidos de la API
 * Evita duplicación y centraliza estructura de respuestas
 */

/**
 * Respuesta genérica del servidor
 */
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  email?: string;
  errors?: unknown;
};

/**
 * Opciones para solicitud HTTP
 */
export type RequestOptions<TBody = undefined> = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  token?: string;
  body?: TBody;
  allowEmptyData?: boolean;
  headers?: Record<string, string>;
};

/**
 * Página de resultados
 */
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * Respuesta paginada
 */
export type PaginatedResponse<T> = {
  items: T[];
  pagination: Pagination;
};

/**
 * Tipos compartidos de autenticación
 */
export type BackendUserRole = 'client' | 'business' | 'super_admin';

export type BackendAuthUser = {
  _id: string;
  email: string;
  role: BackendUserRole;
  first_name: string;
  last_name: string;
  phone?: string;
  ci?: string;
  ruc?: string;
  business_name?: string;
  business_category?: string;
  points_balance?: number;
  referral_code?: string;
  avatar_url?: string;
};

export type AuthPayload = {
  token: string;
  user: BackendAuthUser;
};

/**
 * Tipos de Advertisement
 */
export type Advertisement = {
  _id: string;
  image: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
