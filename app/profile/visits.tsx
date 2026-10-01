import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { ReviewSheet } from '@/components/reviews/review-sheet';
import { AppText, Avatar, Button, EmptyState, PointsBadge, StackHeader } from '@/components/ui';
import { usePaginated } from '@/hooks/use-paginated';
import { loyaltyService } from '@/services';
import type { CheckIn } from '@/services';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import { formatDateTime } from '@/utils/format';

export default function VisitsScreen() {
  const router = useRouter();
  const list = usePaginated<CheckIn>((page) => loyaltyService.checkins(page));
  const [target, setTarget] = useState<CheckIn | null>(null);

  return (
    <View style={styles.root}>
      <StackHeader title="Historial de visitas" subtitle="Tus visitas en negocios aliados" />
      <FlatList
        data={list.items}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: SCREEN_PADDING, paddingBottom: spacing.xxxl }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable
              style={styles.row}
              onPress={() => router.push({ pathname: '/businesses/[id]', params: { id: String(item.business.id) } })}
            >
              <Avatar uri={item.business.logo} name={item.business.name} size={46} rounded="md" />
              <View style={{ flex: 1 }}>
                <AppText variant="title" numberOfLines={1}>
                  {item.business.name}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  {formatDateTime(item.created_at)}
                </AppText>
              </View>
              <PointsBadge points={item.points_awarded} prefix="+" />
            </Pressable>
            {item.can_review ? (
              <Button
                title={item.review_points ? `Dejar reseña (+${item.review_points} pts)` : 'Dejar reseña'}
                icon="star-outline"
                size="sm"
                variant="secondary"
                onPress={() => setTarget(item)}
                style={{ marginTop: spacing.md }}
              />
            ) : item.has_review ? (
              <View style={styles.reviewed}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <AppText variant="caption" color="success">
                  Reseña enviada
                </AppText>
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          list.loading ? (
            <ActivityIndicator color={colors.primary} style={{ margin: spacing.xxl }} />
          ) : list.error ? (
            <EmptyState icon="cloud-offline-outline" title="No se pudo cargar" message={list.error} actionLabel="Reintentar" onAction={list.retry} />
          ) : (
            <EmptyState
              icon="qr-code-outline"
              title="Aún no tienes visitas"
              message="Escanea el QR al llegar a un negocio aliado."
              actionLabel="Escanear"
              onAction={() => router.push('/scanner')}
            />
          )
        }
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} colors={[colors.primary]} />}
        ListFooterComponent={list.loadingMore ? <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} /> : null}
      />

      <ReviewSheet
        target={
          target
            ? { checkinId: target.id, businessName: target.business.name, points: target.review_points }
            : null
        }
        onClose={() => setTarget(null)}
        onDone={() => {
          const reviewedId = target?.id;
          setTarget(null);
          list.setItems((items) =>
            items.map((c) => (c.id === reviewedId ? { ...c, has_review: true, can_review: false } : c)),
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reviewed: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
});
