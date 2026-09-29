/**
 * Servicio de Lugares
 * Refactorizado: sin duplicación de URL ni cliente HTTP
 */

import API_CONFIG from '@/services/config/api';
import { httpDelete, httpGet, httpPost, httpPostFormData, httpPut, httpPutFormData } from '@/services/http/client';
import { PaginatedResponse } from '@/services/types/api-types';

export type PlaceCategory = {
  _id: string;
  name: string;
  icon?: string;
};

export type PlaceItem = {
  _id: string;
  name: string;
  description: string;
  category_id: string | PlaceCategory;
  business_id:
    | string
    | {
        _id: string;
        business_name?: string;
        first_name?: string;
        last_name?: string;
      };
  address: string;
  images: string[];
  phone?: string;
  website?: string;
  schedule?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
};

export type ReviewItem = {
  _id: string;
  place_id: string;
  client_id:
    | string
    | {
        _id?: string;
        first_name?: string;
        last_name?: string;
      };
  rating: number;
  comment?: string;
  createdAt?: string;
};

export type FavoriteItem = {
  _id: string;
  place_id: PlaceItem | string;
};

export type CreatePlacePayload = {
  name: string;
  description: string;
  category_id: string;
  address: string;
  images: string[];
  phone?: string;
  website?: string;
  schedule?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
};

export type UpdatePlacePayload = Partial<CreatePlacePayload> & {
  status?: 'active' | 'inactive';
};

export type CreateReviewPayload = {
  place_id: string;
  rating: number;
  comment?: string;
};

/**
 * Obtener categorías de lugares
 */
export async function getCategoriesRequest(token: string): Promise<PlaceCategory[]> {
  return httpGet<PlaceCategory[]>(`${API_CONFIG.ENDPOINTS.PLACES}/categories`, token);
}

/**
 * Obtener todos los lugares
 */
export async function getAllPlacesRequest(
  token: string,
): Promise<PlaceItem[] | PaginatedResponse<PlaceItem>> {
  return httpGet<PlaceItem[] | PaginatedResponse<PlaceItem>>(
    `${API_CONFIG.ENDPOINTS.PLACES}`,
    token,
  );
}

/**
 * Obtener lugar por ID
 */
export async function getPlaceDetailRequest(token: string, placeId: string): Promise<PlaceItem> {
  return httpGet<PlaceItem>(`${API_CONFIG.ENDPOINTS.PLACES}/${placeId}`, token);
}

/**
 * Obtener mis lugares (como negocio)
 */
export async function getMyPlacesRequest(token: string): Promise<PlaceItem[]> {
  return httpGet<PlaceItem[]>(`${API_CONFIG.ENDPOINTS.PLACES}/my`, token);
}

/**
 * Crear lugar con FormData (para enviar imágenes)
 */
export async function createPlaceWithFormDataRequest(
  token: string,
  formData: FormData,
): Promise<PlaceItem> {
  return httpPostFormData<PlaceItem>(
    `${API_CONFIG.ENDPOINTS.PLACES}`,
    formData,
    token,
  );
}

/**
 * Actualizar lugar con FormData (para enviar imágenes)
 */
export async function updatePlaceWithFormDataRequest(
  token: string,
  placeId: string,
  formData: FormData,
): Promise<PlaceItem> {
  return httpPutFormData<PlaceItem>(
    `${API_CONFIG.ENDPOINTS.PLACES}/${placeId}`,
    formData,
    token,
  );
}

/**
 * Crear lugar
 */
export async function createPlaceRequest(
  token: string,
  payload: CreatePlacePayload,
): Promise<PlaceItem> {
  return httpPost<PlaceItem, CreatePlacePayload>(
    `${API_CONFIG.ENDPOINTS.PLACES}`,
    payload,
    token,
  );
}

/**
 * Actualizar lugar
 */
export async function updatePlaceRequest(
  token: string,
  placeId: string,
  payload: UpdatePlacePayload,
): Promise<PlaceItem> {
  return httpPut<PlaceItem, UpdatePlacePayload>(
    `${API_CONFIG.ENDPOINTS.PLACES}/${placeId}`,
    payload,
    token,
  );
}

/**
 * Eliminar lugar
 */
export async function deletePlaceRequest(token: string, placeId: string): Promise<void> {
  await httpDelete<void>(`${API_CONFIG.ENDPOINTS.PLACES}/${placeId}`, token);
}

/**
 * Crear reseña
 */
export async function createReviewRequest(
  token: string,
  payload: CreateReviewPayload,
): Promise<ReviewItem> {
  return httpPost<ReviewItem, CreateReviewPayload>(
    `${API_CONFIG.ENDPOINTS.PLACES}/reviews`,
    payload,
    token,
  );
}

/**
 * Obtener reseñas de un lugar
 */
export async function getPlaceReviewsRequest(token: string, placeId: string): Promise<ReviewItem[]> {
  return httpGet<ReviewItem[]>(`${API_CONFIG.ENDPOINTS.PLACES}/${placeId}/reviews`, token);
}
