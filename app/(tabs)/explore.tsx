import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { BusinessCard } from '@/components/business/business-card';
import { AppText, Button, Chip, EmptyState, FixedHeader, Skeleton, TextField } from '@/components/ui';
import { useFavoriteToggle } from '@/hooks/use-favorite-toggle';
import { getApproximateLocation } from '@/hooks/use-current-location';
import { usePaginated } from '@/hooks/use-paginated';
import { businessService } from '@/services';
import type { BusinessSummary, Category } from '@/services';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import { categoryIcon } from '@/utils/category-icon';

const NEARBY_RADIUS_M = 15_000;

type Coords = { latitude: number; longitude: number };

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; focus?: string; nearby?: string }>();
  const searchRef = useRef<TextInput>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<number | null>(params.category ? Number(params.category) : null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [useNearby, setUseNearby] = useState(true);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    businessService.categories().then(setCategories).catch(() => undefined);
    getApproximateLocation()
      .then((c) => {
        setCoords(c);
        if (!c) setUseNearby(false);
      })
      .finally(() => setLocating(false));
  }, []);

  // Parámetros que llegan desde Inicio (categoría, buscar, cerca de mí).
  useEffect(() => {
    if (params.category) setCategory(Number(params.category));
  }, [params.category]);
  useEffect(() => {
    if (params.focus) setTimeout(() => searchRef.current?.focus(), 250);
  }, [params.focus]);
  useEffect(() => {
    if (params.nearby && coords) setUseNearby(true);
  }, [params.nearby, coords]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const nearby = useNearby && coords;
  const list = usePaginated<BusinessSummary>(
    (page) =>
      businessService.list({
        page,
        search: search || undefined,
        category: category ?? undefined,
        ...(nearby ? { lat: coords.latitude, lng: coords.longitude, radius: NEARBY_RADIUS_M } : {}),
      }),
    [search, category, nearby, coords?.latitude, coords?.longitude],
    !locating,
  );

  const { setItems } = list;
  const updateFavorite = useCallback(
    (id: number, value: boolean) => setItems((prev) => prev.map((b) => (b.id === id ? { ...b, is_favorite: value } : b))),
    [setItems],
  );
  const toggleFavorite = useFavoriteToggle(updateFavorite);

  const header = (
    <FixedHeader>
      <AppText variant="h1">Explorar</AppText>
      <AppText color="textSecondary" style={{ marginBottom: spacing.md }}>
        {nearby ? 'Negocios aliados cerca de ti' : 'Todos los negocios aliados'}
      </AppText>
      <TextField
        ref={searchRef}
        icon="search"
        placeholder="Buscar por nombre, categoría o dirección"
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        autoCorrect={false}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            icon={categoryIcon(c.icon)}
            selected={category === c.id}
            onPress={() => setCategory(category === c.id ? null : c.id)}
          />
        ))}
      </ScrollView>
      {!list.loading && (
        <AppText variant="caption" color="textMuted" style={{ marginTop: spacing.sm }}>
          {list.total} {list.total === 1 ? 'negocio' : 'negocios'}
        </AppText>
      )}
    </FixedHeader>
  );

  const loadingState = (
    <View style={styles.list}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} height={210} rounded={radius.lg} style={{ marginBottom: spacing.md }} />
      ))}
    </View>
  );

  const empty = list.error ? (
    <EmptyState icon="cloud-offline-outline" title="No pudimos cargar los negocios" message={list.error} actionLabel="Reintentar" onAction={list.retry} />
  ) : nearby ? (
    <EmptyState
      icon="map-outline"
      title="No hay negocios cerca"
      message="Aún no tenemos aliados en un radio de 15 km."
      actionLabel="Ver todos los negocios"
      onAction={() => setUseNearby(false)}
    />
  ) : (
    <EmptyState icon="search-outline" title="Sin resultados" message="Prueba con otra búsqueda o categoría." />
  );

  return (
    <View style={styles.root}>
      {header}
      <FlatList
        data={list.items}
        keyExtractor={(b) => String(b.id)}
        ListEmptyComponent={list.loading || locating ? loadingState : empty}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxxl * 2 }}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <BusinessCard
              business={item}
              onPress={() => router.push({ pathname: '/businesses/[id]', params: { id: String(item.id) } })}
              onToggleFavorite={() => toggleFavorite(item.id, item.is_favorite)}
            />
          </View>
        )}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} colors={[colors.primary]} />}
        ListFooterComponent={
          list.loadingMore ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : list.error && list.items.length ? (
            <Button title="Reintentar" variant="ghost" onPress={list.retry} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  chips: { gap: spacing.sm, paddingRight: spacing.lg },
  list: { paddingHorizontal: SCREEN_PADDING },
  item: { paddingHorizontal: SCREEN_PADDING, marginBottom: spacing.md },
});
