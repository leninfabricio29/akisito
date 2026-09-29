/**
 * Servicio de Visitas
 * Refactorizado: sin duplicación de URL ni cliente HTTP
 */

import API_CONFIG from '@/services/config/api';
import { httpGet, httpPost } from '@/services/http/client';
import { PaginatedResponse } from '@/services/types/api-types';

export type VisitItem = {
  _id: string;
  client_id: string;
  place_id: {
    _id: string;
    name: string;
    address: string;
    images: string[];
  };
  points_awarded: boolean;
  createdAt: string;
  __v?: number;
};

export type CreateVisitPayload = {
  place_id: string;
};

/**
 * Obtener mis visitas
 */
export async function getMyVisitsRequest(token: string): Promise<VisitItem[]> {
  const result = await httpGet<VisitItem[] | PaginatedResponse<VisitItem>>(
    `${API_CONFIG.ENDPOINTS.VISITS}/my`,
    token,
  );

  // Normalizar respuesta paginada
  return Array.isArray(result) ? result : result.items;
}

/**
 * Crear nueva visita
 */
export async function createVisitRequest(
  token: string,
  placeId: string,
): Promise<VisitItem> {
  return httpPost<VisitItem, CreateVisitPayload>(
    `${API_CONFIG.ENDPOINTS.VISITS}`,
    { place_id: placeId },
    token,
  );
}

/**
 * Obtener todas las visitas (admin)
 */
export async function getAllVisitsRequest(token: string): Promise<VisitItem[]> {
  return httpGet<VisitItem[]>(`${API_CONFIG.ENDPOINTS.VISITS}`, token);
}
