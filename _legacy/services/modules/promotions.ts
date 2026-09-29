/**
 * Servicio de Promociones y Canjes
 * Refactorizado: sin duplicación de URL ni cliente HTTP
 */

import API_CONFIG from '@/services/config/api';
import { httpDelete, httpGet, httpPost, httpPostFormData, httpPut, httpPutFormData } from '@/services/http/client';
import { PaginatedResponse } from '@/services/types/api-types';

export type PromotionStatus = 'active' | 'inactive' | 'expired';

export type PromotionItem = {
  _id: string;
  title: string;
  description?: string;
  image: string;
  place_id:
    | string
    | {
        _id: string;
        name?: string;
        address?: string;
        images?: string[];
      };
  business_id?: string;
  points_required: number;
  start_date: string;
  end_date: string;
  max_claims_per_user: number;
  total_max_claims?: number;
  total_claimed?: number;
  status: PromotionStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type CreatePromotionPayload = {
  title: string;
  description?: string;
  image: string;
  place_id: string;
  points_required: number;
  start_date: string;
  end_date: string;
  max_claims_per_user: number;
  total_max_claims?: number;
};

export type UpdatePromotionPayload = Partial<
  Omit<CreatePromotionPayload, 'place_id'> & {
    status: PromotionStatus;
  }
>;

export type RedeemPromotionData = {
  redemption_code: string;
  expires_at: string;
  promotion: {
    title: string;
    points_required: number;
  };
};

export type RedeemMyPromotionData = {
  _id: string;
  client_id: string;
  points_spent: number;
  redeemed_at?: string;
  expires_at: string;
  status: 'expired' | 'validated' | 'pending';
  redemption_code: string;
  promotion_id: {
    _id: string;
    title: string;
    image?: string;
    points_required?: number;
  };
  business_id: {
    _id: string;
    business_name: string;
  };
  createdAt: string;
  updatedAt: string;
};

/**
 * Obtener todas las promociones disponibles
 */
export async function getAllPromotionsRequest(
  token: string,
): Promise<PromotionItem[] | PaginatedResponse<PromotionItem>> {
  return httpGet<PromotionItem[] | PaginatedResponse<PromotionItem>>(
    `${API_CONFIG.ENDPOINTS.PROMOTIONS}`,
    token,
  );
}

/**
 * Obtener mis promociones (como negocio)
 */
export async function getMyPromotionsRequest(token: string): Promise<PromotionItem[]> {
  return httpGet<PromotionItem[]>(`${API_CONFIG.ENDPOINTS.PROMOTIONS}/my`, token);
}

/**
 * Crear promoción con FormData (para enviar imagen)
 */
export async function createPromotionWithFormDataRequest(
  token: string,
  formData: FormData,
): Promise<PromotionItem> {
  return httpPostFormData<PromotionItem>(
    `${API_CONFIG.ENDPOINTS.PROMOTIONS}`,
    formData,
    token,
  );
}

/**
 * Actualizar promoción con FormData (para enviar imagen)
 */
export async function updatePromotionWithFormDataRequest(
  token: string,
  promotionId: string,
  formData: FormData,
): Promise<PromotionItem> {
  return httpPutFormData<PromotionItem>(
    `${API_CONFIG.ENDPOINTS.PROMOTIONS}/${promotionId}`,
    formData,
    token,
  );
}

/**
 * Crear promoción
 */
export async function createPromotionRequest(
  token: string,
  payload: CreatePromotionPayload,
): Promise<PromotionItem> {
  return httpPost<PromotionItem, CreatePromotionPayload>(
    `${API_CONFIG.ENDPOINTS.PROMOTIONS}`,
    payload,
    token,
  );
}

/**
 * Actualizar promoción
 */
export async function updatePromotionRequest(
  token: string,
  promotionId: string,
  payload: UpdatePromotionPayload,
): Promise<PromotionItem> {
  return httpPut<PromotionItem, UpdatePromotionPayload>(
    `${API_CONFIG.ENDPOINTS.PROMOTIONS}/${promotionId}`,
    payload,
    token,
  );
}

/**
 * Eliminar promoción
 */
export async function deletePromotionRequest(token: string, promotionId: string): Promise<void> {
  await httpDelete<void>(`${API_CONFIG.ENDPOINTS.PROMOTIONS}/${promotionId}`, token);
}

/**
 * Canjear promoción
 */
export async function redeemPromotionRequest(
  token: string,
  promotionId: string,
): Promise<RedeemPromotionData> {
  return httpPost<RedeemPromotionData, { promotion_id: string }>(
    `${API_CONFIG.ENDPOINTS.REDEMPTIONS}`,
    { promotion_id: promotionId },
    token,
  );
}

/**
 * Obtener mis canjes
 */
export async function getMyExchangesRequest(token: string): Promise<RedeemMyPromotionData[]> {
  const result = await httpGet<RedeemMyPromotionData[] | PaginatedResponse<RedeemMyPromotionData>>(
    `${API_CONFIG.ENDPOINTS.REDEMPTIONS}/my`,
    token,
  );

  // Normalizar respuesta paginada
  return Array.isArray(result) ? result : result.items;
}
