import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Chip, EmptyState, StackHeader, TextField } from '@/components/ui';
import { usePaginated } from '@/hooks/use-paginated';
import { portalService } from '@/services';
import type { BusinessRedemption, RedemptionStatus } from '@/services';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import { formatDateTime } from '@/utils/format';

const FILTERS: { key: RedemptionStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'validated', label: 'Entregados' },
  { key: 'expired', label: 'Expirados' },
  { key: 'cancelled', label: 'Cancelados' },
];

const STATUS: Record<RedemptionStatus, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { label: 'Pendiente', color: colors.warning, bg: colors.warningSoft, icon: 'time' },
  validated: { label: 'Entregado', color: colors.success, bg: colors.successSoft, icon: 'checkmark-circle' },
  expired: { label: 'Expirado', color: colors.textMuted, bg: colors.surfaceMuted, icon: 'close-circle' },
  cancelled: { label: 'Cancelado', color: colors.textMuted, bg: colors.surfaceMuted, icon: 'remove-circle' },
};

export default function BusinessRedemptionsScreen() {
  const [filter, setFilter] = useState<RedemptionStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const list = usePaginated<BusinessRedemption>(
    (page) => portalService.redemptions(page, filter === 'all' ? undefined : filter, search || undefined),
    [filter, search],
  );

  return (
    <View style={styles.root}>
      <StackHeader title="Historial de canjes" subtitle={list.loading ? undefined : `${list.total} canjes`} />
      <FlatList
        data={list.items}
        keyExtractor={(r) => String(r.id)}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <TextField icon="search" placeholder="Buscar por código o cliente" value={query} onChangeText={setQuery} autoCapitalize="characters" autoCorrect={false} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {FILTERS.map((f) => (
                <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => {
          const status = STATUS[item.status];
          return (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <AppText variant="title" numberOfLines={1}>
                  {item.reward.title}
                </AppText>
                <AppText variant="caption" color="textSecondary">
                  {item.client.name} · {item.points_spent} pts
                </AppText>
                <AppText variant="caption" color="textMuted">
                  {item.code} · {formatDateTime(item.validated_at ?? item.created_at)}
                </AppText>
              </View>
              <View style={[styles.status, { backgroundColor: status.bg }]}>
                <Ionicons name={status.icon} size={13} color={status.color} />
                <AppText variant="caption" style={{ color: status.color }}>
                  {status.label}
                </AppText>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          list.loading ? (
            <ActivityIndicator color={colors.primary} style={{ margin: spacing.xxl }} />
          ) : list.error ? (
            <EmptyState icon="cloud-offline-outline" title="No se pudo cargar" message={list.error} actionLabel="Reintentar" onAction={list.retry} />
          ) : (
            <EmptyState icon="receipt-outline" title="Sin canjes" message="Cuando tus clientes canjeen recompensas aparecerán aquí." />
          )
        }
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} colors={[colors.primary]} />}
        ListFooterComponent={list.loadingMore ? <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { padding: SCREEN_PADDING, paddingBottom: spacing.sm },
  chips: { gap: spacing.sm },
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
  status: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
});
