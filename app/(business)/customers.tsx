import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Avatar, Chip, EmptyState, TextField } from '@/components/ui';
import { usePaginated } from '@/hooks/use-paginated';
import { portalService } from '@/services';
import type { Customer, CustomerSegment } from '@/services';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import { formatDate, timeAgo } from '@/utils/format';

const SEGMENTS: { key: CustomerSegment | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'new', label: 'Nuevos' },
  { key: 'frequent', label: 'Frecuentes' },
  { key: 'at_risk', label: 'En riesgo' },
  { key: 'inactive', label: 'Inactivos' },
];

const ORDERINGS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: '-last_checkin_at', label: 'Recientes', icon: 'time-outline' },
  { key: '-checkins_count', label: 'Más visitas', icon: 'repeat' },
  { key: '-points_balance', label: 'Más puntos', icon: 'star-outline' },
];

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ segment?: CustomerSegment }>();
  const [segment, setSegment] = useState<CustomerSegment | 'all'>(params.segment ?? 'all');
  const [ordering, setOrdering] = useState(ORDERINGS[0].key);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (params.segment) setSegment(params.segment);
  }, [params.segment]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const list = usePaginated<Customer>(
    (page) => portalService.customers(page, segment === 'all' ? undefined : segment, search || undefined, ordering),
    [segment, search, ordering],
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={list.items}
        keyExtractor={(c) => String(c.id)}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
            <AppText variant="h1">Clientes</AppText>
            <AppText color="textSecondary" style={{ marginBottom: spacing.md }}>
              {list.loading ? 'Cargando…' : `${list.total} ${list.total === 1 ? 'cliente' : 'clientes'}`}
            </AppText>
            <TextField icon="search" placeholder="Buscar por nombre" value={query} onChangeText={setQuery} autoCorrect={false} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {SEGMENTS.map((s) => (
                <Chip key={s.key} label={s.label} selected={segment === s.key} onPress={() => setSegment(s.key)} />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { marginTop: spacing.sm }]}>
              {ORDERINGS.map((o) => (
                <Chip key={o.key} label={o.label} icon={o.icon} selected={ordering === o.key} onPress={() => setOrdering(o.key)} />
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Avatar uri={item.client.avatar} name={item.client.name} size={46} />
            <View style={{ flex: 1 }}>
              <AppText variant="title" numberOfLines={1}>
                {item.client.name}
              </AppText>
              <AppText variant="caption" color="textSecondary">
                {item.checkins_count} {item.checkins_count === 1 ? 'visita' : 'visitas'} · {item.reviews_count} reseñas ·{' '}
                {item.redemptions_count} canjes
              </AppText>
              <AppText variant="caption" color="textMuted">
                {item.last_checkin_at ? `Última visita ${timeAgo(item.last_checkin_at)}` : 'Sin visitas'}
                {item.first_checkin_at ? ` · cliente desde ${formatDate(item.first_checkin_at)}` : ''}
              </AppText>
            </View>
            <View style={styles.points}>
              <AppText variant="h3" color="primary">
                {item.points_balance}
              </AppText>
              <AppText variant="caption" color="textMuted">
                pts
              </AppText>
            </View>
          </View>
        )}
        ListEmptyComponent={
          list.loading ? (
            <ActivityIndicator color={colors.primary} style={{ margin: spacing.xxl }} />
          ) : list.error ? (
            <EmptyState icon="cloud-offline-outline" title="No se pudieron cargar" message={list.error} actionLabel="Reintentar" onAction={list.retry} />
          ) : (
            <EmptyState
              icon="people-outline"
              title={segment === 'all' && !search ? 'Aún no tienes clientes' : 'Sin clientes en este filtro'}
              message={segment === 'all' && !search ? 'Coloca tu QR en caja: cada cliente que lo escanee aparecerá aquí.' : undefined}
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
  header: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.md },
  chips: { gap: spacing.sm, paddingRight: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: SCREEN_PADDING,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  points: { alignItems: 'center', minWidth: 48 },
});
