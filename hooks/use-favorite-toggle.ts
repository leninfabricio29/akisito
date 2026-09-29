import { useCallback } from 'react';

import { businessService } from '@/services';

/** Alterna favorito con actualización optimista; revierte si la API falla. */
export function useFavoriteToggle(onChange: (businessId: number, isFavorite: boolean) => void) {
  return useCallback(
    async (businessId: number, isFavorite: boolean) => {
      onChange(businessId, !isFavorite);
      try {
        if (isFavorite) await businessService.removeFavorite(businessId);
        else await businessService.addFavorite(businessId);
      } catch {
        onChange(businessId, isFavorite);
      }
    },
    [onChange],
  );
}
