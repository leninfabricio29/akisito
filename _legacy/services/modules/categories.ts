/**
 * Servicio de Categorías
 * Obtiene las categorías disponibles desde la API
 */

import API_CONFIG from '@/services/config/api';
import { httpGet } from '@/services/http/client';

export type Category = {
  _id: string;
  name: string;
  icon?: string;
  status?: string;
};

export async function getCategoriesRequest(): Promise<Category[]> {
  try {
    const path = `/${API_CONFIG}/categories`;
    
    const response = await httpGet<{ success: boolean; data: Category[] }>(path);

    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }

    console.warn('[CategoriesService] Invalid response format');
    return [];
  } catch (error: any) {
    console.error('[CategoriesService] Error fetching categories:', error);
    return [];
  }
}
