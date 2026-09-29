/**
 * Servicio de Favoritos
 * Refactorizado: sin duplicación de URL ni cliente HTTP
 */

import API_CONFIG from '@/services/config/api';
import { httpDelete, httpGet, httpPost } from '@/services/http/client';
import { PlaceItem } from '@/services/modules/places';

export type FavoriteItem = {
  _id: string;
  place_id: PlaceItem | string;
};

export type CreateFavoritePayload = {
  place_id: string;
};

/**
 * Obtener mis favoritos
 */
export async function getMyFavoritesRequest(token: string): Promise<FavoriteItem[]> {
  return httpGet<FavoriteItem[]>(`${API_CONFIG.ENDPOINTS.FAVORITES}`, token);
}

/**
 * Agregar a favoritos
 */
export async function addFavoriteRequest(
  token: string,
  placeId: string,
): Promise<FavoriteItem> {
  return httpPost<FavoriteItem, CreateFavoritePayload>(
    `${API_CONFIG.ENDPOINTS.FAVORITES}`,
    { place_id: placeId },
    token,
  );
}

/**
 * Remover de favoritos
 */
export async function removeFavoriteRequest(token: string, favoriteId: string): Promise<void> {
  await httpDelete<void>(`${API_CONFIG.ENDPOINTS.FAVORITES}/${favoriteId}`, token);
}

/**
 * Verificar si un lugar es favorito
 */
export async function isFavoriteRequest(token: string, placeId: string): Promise<boolean> {
  try {
    const favorites = await getMyFavoritesRequest(token);
    return favorites.some((fav) => {
      const id = typeof fav.place_id === 'string' ? fav.place_id : fav.place_id._id;
      return id === placeId;
    });
  } catch {
    return false;
  }
}
