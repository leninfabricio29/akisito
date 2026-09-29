import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusBanner } from '@/components/portal/status-banner';
import { AppText, Button, Chip, EmptyState, PointsBadge } from '@/components/ui';
import { useBusiness } from '@/context/business-context';
import { usePaginated } from '@/hooks/use-paginated';
import { portalService } from '@/services';
import type { OwnReward } from '@/services';
import { colors, radius, SCREEN_PADDING, shadows, spacing } from '@/theme';
import { formatDate } from '@/utils/format';

type Filter = 'active' | 'inactive' | 'all';

export default function BusinessRewardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isApproved } = useBusiness();
  const [filter, setFilter] = useState<Filter>('active');
  const [toggling, setToggling] = useState<number | null>(null);

  const list = usePaginated<OwnReward>(
    (page) => portalService.rewards(page, filter === 'all' ? undefined : filter === 'active'),
    [filter],
  );
  const { refresh, setItems } = list;

  // Al volver del formulario se refresca la lista (la primera vez ya carga usePaginated).
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) void refresh();
      focusedOnce.current = true;
    }, [refresh]),
  );

  const toggle = async (reward: OwnReward) => {
    setToggling(reward.id);
    try {
      const updated = await portalService.updateReward(reward.id, { is_active: !reward.is_active });
      setItems((items) =>
        filter === 'all' ? items.map((r) => (r.id === updated.id ? updated : r)) : items.filter((r) => r.id !== updated.id),
      );
    } catch {
      // el switch vuelve a su estado
    } finally {
      setToggling(null);
    }
  };

  return (
    <View style={styles.root}>
      <FlatList
        data={list.items}
        keyExtractor={(r) => String(r.id)}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="h1">Recompensas</AppText>
                <AppText color="textSecondary">Premios que tus clientes canjean con puntos</AppText>
              </View>
            </View>
            <StatusBanner />
            <Button
              title="Nueva recompensa"
              icon="add"
              fullWidth
              disabled={!isApproved}
              onPress={() => router.push('/business/reward-form')}
              style={{ marginVertical: spacing.md }}
            />
            <View style={styles.filters}>
              <Chip label="Activas" selected={filter === 'active'} onPress={() => setFilter('active')} />
              <Chip label="Pausadas" selected={filter === 'inactive'} onPress={() => setFilter('inactive')} />
              <Chip label="Todas" selected={filter === 'all'} onPress={() => setFilter('all')} />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/business/reward-form', params: { id: String(item.id) } })}
            style={({ pressed }) => [styles.card, shadows.sm, pressed && { opacity: 0.92 }]}
          >
            <View style={styles.image}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <Ionicons name="gift" size={26} color={colors.primary} />
              )}
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="title" numberOfLines={2}>
                {item.title}
              </AppText>
              <PointsBadge points={item.points_required} />
              <AppText variant="caption" color="textSecondary">
                {item.redeemed_count} {item.redeemed_count === 1 ? 'canje' : 'canjes'}
                {item.stock !== null ? ` · quedan ${item.stock_left}` : ''}
                {item.ends_at ? ` · hasta ${formatDate(item.ends_at)}` : ''}
              </AppText>
            </View>
            <View style={styles.switch}>
              {toggling === item.id ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Switch
                  value={item.is_active}
                  onValueChange={() => toggle(item)}
                  disabled={!isApproved}
                  trackColor={{ true: colors.primaryLight, false: colors.border }}
                  thumbColor={item.is_active ? colors.primary : colors.surface}
                  accessibilityLabel={item.is_active ? 'Pausar recompensa' : 'Activar recompensa'}
                />
              )}
              <AppText variant="caption" color={item.is_active ? 'success' : 'textMuted'}>
                {item.is_active ? 'Activa' : 'Pausada'}
              </AppText>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          list.loading ? (
            <ActivityIndicator color={colors.primary} style={{ margin: spacing.xxl }} />
          ) : list.error ? (
            <EmptyState icon="cloud-offline-outline" title="No se pudieron cargar" message={list.error} actionLabel="Reintentar" onAction={list.retry} />
          ) : (
            <EmptyState
              icon="gift-outline"
              title={filter === 'inactive' ? 'No tienes recompensas pausadas' : 'Aún no tienes recompensas'}
              message="Crea premios alcanzables (p. ej. un café gratis a los 50 pts) para que tus clientes vuelvan."
            />
          )
        }
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={{ paddingBottom: spacing.xxxl * 2 }}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} colors={[colors.primary]} />}
        ListFooterComponent={list.loadingMore ? <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: SCREEN_PADDING, gap: spacing.md, marginBottom: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  filters: { flexDirection: 'row', gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: SCREEN_PADDING,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  switch: { alignItems: 'center', gap: 2 },
});
