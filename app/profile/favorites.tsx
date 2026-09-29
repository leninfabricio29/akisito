import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { BusinessCard } from '@/components/business/business-card';
import { EmptyState, StackHeader } from '@/components/ui';
import { usePaginated } from '@/hooks/use-paginated';
import { businessService } from '@/services';
import type { Favorite } from '@/services';
import { colors, SCREEN_PADDING, spacing } from '@/theme';

export default function FavoritesScreen() {
  const router = useRouter();
  const list = usePaginated<Favorite>((page) => businessService.favorites(page));
  const { setItems } = list;

  const remove = useCallback(
    async (favorite: Favorite) => {
      setItems((items) => items.filter((f) => f.id !== favorite.id));
      try {
        await businessService.removeFavorite(favorite.business.id);
      } catch {
        setItems((items) => [favorite, ...items]);
      }
    },
    [setItems],
  );

  return (
    <View style={styles.root}>
      <StackHeader title="Favoritos" subtitle="Tus negocios guardados" />
      <FlatList
        data={list.items}
        keyExtractor={(f) => String(f.id)}
        contentContainerStyle={{ padding: SCREEN_PADDING, paddingBottom: spacing.xxxl }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => (
          <BusinessCard
            business={{ ...item.business, is_favorite: true }}
            onPress={() => router.push({ pathname: '/businesses/[id]', params: { id: String(item.business.id) } })}
            onToggleFavorite={() => remove(item)}
          />
        )}
        ListEmptyComponent={
          list.loading ? (
            <ActivityIndicator color={colors.primary} style={{ margin: spacing.xxl }} />
          ) : (
            <EmptyState
              icon="heart-outline"
              title="Aún no tienes favoritos"
              message="Toca el corazón en un negocio para guardarlo aquí."
              actionLabel="Explorar negocios"
              onAction={() => router.navigate('/(tabs)/explore')}
            />
          )
        }
        onEndReached={list.loadMore}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} colors={[colors.primary]} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.background } });
