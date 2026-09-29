import API_CONFIG from '@/services/config/api';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

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
  business_id: string | { _id: string; business_name?: string; first_name?: string; last_name?: string };
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

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: Pagination;
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

  if (!response.ok || !parsed.success) {
    throw new Error(parsed.message || 'Error en la solicitud');
  }

  if (parsed.data === undefined) {
    if (options.allowEmptyData) {
      return {} as TResponse;
    }
    throw new Error(parsed.message || 'Error en la solicitud');
  }

  return parsed.data;
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

export async function getMyPlacesRequest(token: string): Promise<PlaceItem[]> {
  return requestJson<PlaceItem[]>('/places/my', { method: 'GET', token });
}

export async function getPlaceCategoriesRequest(token?: string): Promise<PlaceCategory[]> {
  return requestJson<PlaceCategory[]>('/categories', { method: 'GET', token });
}

export async function listPlacesRequest(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: 'active' | 'inactive';
}): Promise<PaginatedResponse<PlaceItem>> {
  const query = new URLSearchParams();
  if (params?.page) {
    query.set('page', String(params.page));
  }
  if (params?.limit) {
    query.set('limit', String(params.limit));
  }
  if (params?.search) {
    query.set('search', params.search);
  }
  if (params?.category) {
    query.set('category', params.category);
  }
  if (params?.status) {
    query.set('status', params.status);
  }

  const suffix = query.toString();
  return requestJson<PaginatedResponse<PlaceItem>>(`/places${suffix ? `?${suffix}` : ''}`, {
    method: 'GET',
  });
}

export async function getPlaceByIdRequest(placeId: string): Promise<PlaceItem> {
  return requestJson<PlaceItem>(`/places/${placeId}`, { method: 'GET' });
}

export async function createPlaceRequest(token: string, payload: CreatePlacePayload): Promise<PlaceItem> {
  return requestJson<PlaceItem, CreatePlacePayload>('/places', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function createPlaceWithFormDataRequest(token: string, formData: FormData): Promise<PlaceItem> {
  return requestFormData<PlaceItem>('/places', 'POST', formData, token);
}

export async function updatePlaceRequest(
  token: string,
  placeId: string,
  payload: UpdatePlacePayload,
): Promise<PlaceItem> {
  return requestJson<PlaceItem, UpdatePlacePayload>(`/places/${placeId}`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

export async function updatePlaceWithFormDataRequest(
  token: string,
  placeId: string,
  formData: FormData,
): Promise<PlaceItem> {
  return requestFormData<PlaceItem>(`/places/${placeId}`, 'PUT', formData, token);
}

export async function listPlaceReviewsRequest(placeId: string, page = 1, limit = 10): Promise<PaginatedResponse<ReviewItem>> {
  return requestJson<PaginatedResponse<ReviewItem>>(`/reviews/place/${placeId}?page=${page}&limit=${limit}`, {
    method: 'GET',
  });
}

export async function createReviewRequest(token: string, payload: CreateReviewPayload): Promise<ReviewItem> {
  return requestJson<ReviewItem, CreateReviewPayload>('/reviews', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function listFavoritesRequest(token: string): Promise<FavoriteItem[]> {
  return requestJson<FavoriteItem[]>('/favorites', { method: 'GET', token });
}

export async function addFavoriteRequest(token: string, placeId: string): Promise<FavoriteItem> {
  return requestJson<FavoriteItem, { place_id: string }>('/favorites', {
    method: 'POST',
    token,
    body: { place_id: placeId },
  });
}

export async function removeFavoriteRequest(token: string, placeId: string): Promise<{ message?: string }> {
  return requestJson<{ message?: string }>(`/favorites/${placeId}`, {
    method: 'DELETE',
    token,
    allowEmptyData: true,
  });
}

export async function createVisitRequest(token: string, placeId: string): Promise<{ _id: string; place_id: string }> {
  return requestJson<{ _id: string; place_id: string }, { place_id: string }>('/visits', {
    method: 'POST',
    token,
    body: { place_id: placeId },
  });
}
