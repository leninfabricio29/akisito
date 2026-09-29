/**
 * Servicio de Fuentes de Puntos
 * Obtiene las formas disponibles de ganar puntos en la plataforma
 */

import API_CONFIG from '@/services/config/api';
import { httpGet } from '@/services/http/client';

export type PointSource = {
  _id: string;
  name: string;
  code: string;
  points: number;
  description: string;
  is_active: boolean;
  updatedAt: string;
};

/**
 * Obtener todas las fuentes de puntos disponibles
 */
export async function getPointSourcesRequest(token: string): Promise<PointSource[]> {
  return httpGet<PointSource[]>(`${API_CONFIG.ENDPOINTS.POINT_SOURCES}`, token);
}
