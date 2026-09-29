/**
 * Servicio de Anuncios/Advertisements
 */

import API_CONFIG from '@/services/config/api';
import { httpGet } from '@/services/http/client';

export type Advertisement = {
  _id: string;
  image: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Obtener todos los anuncios activos
 */
export async function listAdvertisementsRequest(token: string): Promise<Advertisement[]> {
  const response = await httpGet<{ data: Advertisement[] | Advertisement[] }>(
    `${API_CONFIG.ENDPOINTS.ADVERTISEMENTS}`,
    token,
  );

  // Handle both formats: direct array or data object
  if (Array.isArray(response)) {
    return response;
  }

  return response.data || [];
}
