/**
 * Servicio de Canjes (Redemptions)
 */

import { httpGet, httpPost } from '@/services/http/client';
import { PaginatedResponse } from '@/services/types/api-types';

export type RedemptionStatus = 'pending' | 'validated' | 'expired' | 'confirmed' | 'rejected';

export type ClientInfo = {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export type PromotionInfo = {
  _id: string;
  title: string;
  points_required: number;
};

export type RedemptionItem = {
  _id: string;
  client_id: ClientInfo;
  promotion_id: PromotionInfo;
  business_id: string;
  points_spent: number;
  redemption_code: string;
  status: RedemptionStatus;
  expires_at: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Obtiene los canjes del negocio actual
 */
export async function getBusinessRedemptionsRequest(token: string): Promise<RedemptionItem[]> {
  const url = `/redemptions/business`;

  const response = await httpGet<PaginatedResponse<RedemptionItem>>(url, token);

  return response.items || [];
}

/**
 * Valida un código de reembolso
 */
export async function validateRedemptionCodeRequest(
  token: string,
  redemption_code: string
): Promise<{ valid: boolean; redemption?: RedemptionItem; error?: string }> {
  const url = `/redemptions/validate`;

  try {
    // httpPost extrae solo el campo 'data', no necesita verificar success
    // Si falla, lanza excepción en el catch
    const redemption = await httpPost<RedemptionItem, { redemption_code: string }>(
      url,
      { redemption_code },
      token,
    );

    return {
      valid: true,
      redemption,
    };
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'No se pudo validar el código';
    return { valid: false, error: errorMessage };
  }
}
