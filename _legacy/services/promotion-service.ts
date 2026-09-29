import API_CONFIG from '@/services/config/api';
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

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

async function requestJson<TResponse, TBody = undefined>(
  path: string,
  options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    token?: string;
    body?: TBody;
    allowEmptyData?: boolean;
  },
): Promise<TResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
    method: options.method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const parsed = (await response.json()) as ApiResponse<TResponse>;

  if (!response.ok || !parsed.success || (!options.allowEmptyData && parsed.data === undefined)) {
    throw new Error(parsed.message || 'Error en la solicitud');
  }

  return (parsed.data as TResponse) ?? ({} as TResponse);
}

async function requestFormData<TResponse>(
  path: string,
  method: 'POST' | 'PUT',
  formData: any,
  token?: string,
): Promise<TResponse> {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
    method,
    headers, // No incluir Content-Type, el navegador lo maneja automáticamente
    body: formData,
  });

  const parsed = (await response.json()) as ApiResponse<TResponse>;

  if (!response.ok || !parsed.success) {
    throw new Error(parsed.message || 'Error en la solicitud');
  }

  return parsed.data as TResponse;
}

export async function getMyPromotionsRequest(token: string): Promise<PromotionItem[]> {
  return requestJson<PromotionItem[]>('/promotions/my', {
    method: 'GET',
    token,
  });
}

export async function createPromotionRequest(
  token: string,
  payload: CreatePromotionPayload,
): Promise<PromotionItem> {
  return requestJson<PromotionItem, CreatePromotionPayload>('/promotions', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function createPromotionWithFormDataRequest(
  token: string,
  formData: FormData,
): Promise<PromotionItem> {
  return requestFormData<PromotionItem>('/promotions', 'POST', formData, token);
}

export async function updatePromotionRequest(
  token: string,
  promotionId: string,
  payload: UpdatePromotionPayload,
): Promise<PromotionItem> {
  return requestJson<PromotionItem, UpdatePromotionPayload>(`/promotions/${promotionId}`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

export async function updatePromotionWithFormDataRequest(
  token: string,
  promotionId: string,
  formData: FormData,
): Promise<PromotionItem> {
  return requestFormData<PromotionItem>(`/promotions/${promotionId}`, 'PUT', formData, token);
}

export async function deactivatePromotionRequest(token: string, promotionId: string): Promise<{ message?: string }> {
  return requestJson<{ message?: string }>(`/promotions/${promotionId}`, {
    method: 'DELETE',
    token,
    allowEmptyData: true,
  });
}

// User endpoints

export async function getAllPromotionsRequest(token: string): Promise<PromotionItem[]> {
  return requestJson<PromotionItem[]>('/promotions', {
    method: 'GET',
    token,
  });
}
