import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Chip, EmptyState, StackHeader } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { useAlert } from '@/hooks/use-alert';
import { usePaginated } from '@/hooks/use-paginated';
import { errorMessage, rewardService } from '@/services';
import type { Redemption, RedemptionStatus } from '@/services';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import { formatDateTime } from '@/utils/format';

const FILTERS: { key: RedemptionStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'validated', label: 'Usados' },
  { key: 'expired', label: 'Expirados' },
];

const STATUS_STYLE: Record<RedemptionStatus, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { color: colors.warning, bg: colors.warningSoft, icon: 'time' },
  validated: { color: colors.success, bg: colors.successSoft, icon: 'checkmark-circle' },
  expired: { color: colors.textMuted, bg: colors.surfaceMuted, icon: 'close-circle' },
  cancelled: { color: colors.textMuted, bg: colors.surfaceMuted, icon: 'remove-circle' },
};

export default function RedemptionsScreen() {
  const [filter, setFilter] = useState<RedemptionStatus | 'all'>('all');
  const [cancelling, setCancelling] = useState<number | null>(null);
  const alert = useAlert();
  const list = usePaginated<Redemption>((page) => rewardService.redemptions(page, filter === 'all' ? undefined : filter), [filter]);

  const cancel = (redemption: Redemption) =>
    alert.show({
      type: 'confirm',
      title: 'Cancelar canje',
      message: `Te devolveremos ${redemption.points_spent} pts a tu monedero de ${redemption.business.name}.`,
      buttons: [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Cancelar canje',
          style: 'destructive',
          onPress: async () => {
            setCancelling(redemption.id);
            try {
              const updated = await rewardService.cancel(redemption.id);
              list.setItems((items) => items.map((r) => (r.id === updated.id ? updated : r)));
            } catch (error) {
              alert.error('No se pudo cancelar', errorMessage(error));
            } finally {
              setCancelling(null);
            }
          },
        },
      ],
    });

  return (
    <View style={styles.root}>
      <StackHeader title="Mis canjes" subtitle="Muestra el código en caja para usar tu premio" />
      <FlatList
        data={list.items}
        keyExtractor={(r) => String(r.id)}
        ListHeaderComponent={
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {FILTERS.map((f) => (
              <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
            ))}
          </ScrollView>
        }
        renderItem={({ item }) => {
          const status = STATUS_STYLE[item.status];
          const pending = item.status === 'pending';
          return (
            <Card style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <AppText variant="caption" color="primary">
                    {item.business.name}
                  </AppText>
                  <AppText variant="title">{item.reward.title}</AppText>
                  <AppText variant="caption" color="textMuted">
                    {item.points_spent} pts · {formatDateTime(item.created_at)}
                  </AppText>
                </View>
                <View style={[styles.status, { backgroundColor: status.bg }]}>
                  <Ionicons name={status.icon} size={14} color={status.color} />
                  <AppText variant="caption" style={{ color: status.color }}>
                    {item.status_label.split(' (')[0]}
                  </AppText>
                </View>
              </View>
              {pending && (
                <>
                  <View style={styles.code}>
                    <AppText style={styles.codeText} selectable>
                      {item.code}
                    </AppText>
                    <AppText variant="caption" color="textSecondary">
                      Válido hasta {formatDateTime(item.expires_at)}
                    </AppText>
                  </View>
                  <Button title="Cancelar y devolver puntos" variant="danger" size="sm" loading={cancelling === item.id} onPress={() => cancel(item)} />
                </>
              )}
              {item.status === 'validated' && item.validated_at && (
                <AppText variant="caption" color="textSecondary" style={{ marginTop: spacing.sm }}>
                  Usado el {formatDateTime(item.validated_at)}
                </AppText>
              )}
            </Card>
          );
        }}
        ListEmptyComponent={
          list.loading ? (
            <ActivityIndicator color={colors.primary} style={{ margin: spacing.xxl }} />
          ) : list.error ? (
            <EmptyState icon="cloud-offline-outline" title="No se pudieron cargar" message={list.error} actionLabel="Reintentar" onAction={list.retry} />
          ) : (
            <EmptyState icon="gift-outline" title="Sin canjes todavía" message="Cuando canjees un premio, tu código aparecerá aquí." />
          )
        }
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} colors={[colors.primary]} />}
        ListFooterComponent={list.loadingMore ? <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} /> : null}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      />
      <Alert visible={alert.visibleConfig} config={alert.config} onDismiss={alert.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  filters: { gap: spacing.sm, padding: SCREEN_PADDING },
  card: { marginHorizontal: SCREEN_PADDING, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  code: {
    alignItems: 'center',
    marginVertical: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  codeText: { fontSize: 28, fontWeight: '800', letterSpacing: 5, color: colors.primaryDark },
});
