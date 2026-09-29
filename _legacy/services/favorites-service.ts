import API_CONFIG from '@/services/config/api';
type ApiResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
};

export type FavoriteItem = {
    _id: string;
    client_id: string;
    place_id: {
        _id: string;
        name: string;
        description: string;
        address: string;
        images: string[];
        category_id?: {
            _id: string;
            name: string;
            icon?: string;
        };
        location?: {
            type: 'Point';
            coordinates: [number, number];
        };
        createdAt?: string;
    };
    createdAt: string;
};

async function requestJson<TResponse, TBody = undefined>(
    path: string,
    options: {
        method: 'GET' | 'POST' | 'DELETE';
        token?: string;
        body?: TBody;
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

    return parsed.data as TResponse;
}

export async function getMyFavoritesRequest(token: string): Promise<FavoriteItem[]> {
    return requestJson<FavoriteItem[]>('/favorites/', {
        method: 'GET',
        token,
    });
}

export async function removeFavoriteRequest(token: string, placeId: string): Promise<void> {
    await requestJson<void>(`/favorites/${placeId}`, {
        method: 'DELETE',
        token,
    });
}

export async function addFavoriteRequest(token: string, placeId: string): Promise<FavoriteItem> {
    return requestJson<FavoriteItem, { place_id: string }>('/favorites', {
        method: 'POST',
        token,
        body: { place_id: placeId },
    });
}
