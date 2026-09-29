import { useCallback, useEffect, useRef, useState } from 'react';

import { errorMessage } from '@/services';
import type { Paginated } from '@/services';

type Fetcher<T> = (page: number) => Promise<Paginated<T>>;

/**
 * Lista paginada con carga perezosa (infinite scroll) y pull-to-refresh.
 * `deps` reinicia la lista (p. ej. al cambiar filtros).
 */
export function usePaginated<T>(fetcher: Fetcher<T>, deps: unknown[] = [], enabled = true) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const requestId = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async (target: number, mode: 'initial' | 'more' | 'refresh') => {
    const id = ++requestId.current;
    if (mode === 'initial') setLoading(true);
    if (mode === 'more') setLoadingMore(true);
    if (mode === 'refresh') setRefreshing(true);
    try {
      const data = await fetcherRef.current(target);
      if (id !== requestId.current) return; // respuesta vieja (cambió el filtro)
      setItems((prev) => (target === 1 ? data.results : [...prev, ...data.results]));
      setHasMore(Boolean(data.next));
      setPage(target);
      setTotal(data.count);
      setError(null);
    } catch (e) {
      if (id === requestId.current) setError(errorMessage(e));
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    setItems([]);
    setHasMore(true);
    void load(1, 'initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, load, ...deps]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore && !error) void load(page + 1, 'more');
  }, [error, hasMore, load, loading, loadingMore, page]);

  const refresh = useCallback(() => load(1, 'refresh'), [load]);
  const retry = useCallback(() => load(page === 1 ? 1 : page + 1, page === 1 ? 'initial' : 'more'), [load, page]);

  return { items, setItems, total, loading, loadingMore, refreshing, error, hasMore, loadMore, refresh, retry };
}
