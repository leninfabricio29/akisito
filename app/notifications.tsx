import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText, EmptyState, StackHeader } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { usePaginated } from '@/hooks/use-paginated';
import { notificationService } from '@/services';
import type { AppNotification, NotificationKind } from '@/services';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import { timeAgo } from '@/utils/format';

const KIND_ICON: Record<NotificationKind, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  points: { icon: 'star', color: colors.accent, bg: colors.accentSoft },
  reward: { icon: 'gift', color: colors.primary, bg: colors.primarySoft },
  redemption: { icon: 'receipt', color: colors.success, bg: colors.successSoft },
  review: { icon: 'chatbubble', color: colors.primary, bg: colors.primarySoft },
  winback: { icon: 'heart', color: colors.danger, bg: colors.dangerSoft },
  business: { icon: 'storefront', color: colors.primary, bg: colors.primarySoft },
  new_business: { icon: 'sparkles', color: colors.accent, bg: colors.accentSoft },
  system: { icon: 'information-circle', color: colors.textSecondary, bg: colors.surfaceMuted },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { isBusiness } = useAuth();
  const list = usePaginated<AppNotification>((page) => notificationService.list(page));
  const { setItems } = list;
  const hasUnread = list.items.some((n) => !n.is_read);

  const markAll = async () => {
    setItems((items) => items.map((n) => ({ ...n, is_read: true })));
    await notificationService.markAllRead().catch(() => undefined);
  };

  const open = (item: AppNotification) => {
    if (!item.is_read) {
      setItems((items) => items.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
      void notificationService.markRead(item.id).catch(() => undefined);
    }
    if (isBusiness) {
      if (item.kind === 'review') router.push('/business/reviews');
      else if (item.kind === 'redemption') router.push('/business/redemptions');
      else if (item.kind === 'business') router.navigate('/(business)');
      return;
    }
    if (item.kind === 'redemption') router.push('/profile/redemptions');
    else if (item.data.business_id) {
      router.push({
        pathname: '/businesses/[id]',
        params: { id: String(item.data.business_id), ...(item.kind === 'reward' ? { tab: 'rewards' } : {}) },
      });
    }
  };

  return (
    <View style={styles.root}>
      <StackHeader
        title="Notificaciones"
        right={
          hasUnread ? (
            <Pressable onPress={markAll} hitSlop={8} accessibilityRole="button">
              <AppText variant="caption" color="primary" style={{ fontWeight: '700' }}>
                Marcar leídas
              </AppText>
            </Pressable>
          ) : null
        }
      />
      <FlatList
        data={list.items}
        keyExtractor={(n) => String(n.id)}
        renderItem={({ item }) => {
          const kind = KIND_ICON[item.kind] ?? KIND_ICON.system;
          return (
            <Pressable
              onPress={() => open(item)}
              style={({ pressed }) => [styles.item, !item.is_read && styles.unread, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.icon, { backgroundColor: kind.bg }]}>
                <Ionicons name={kind.icon} size={20} color={kind.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <AppText variant="title" numberOfLines={1} style={{ flex: 1 }}>
                    {item.title}
                  </AppText>
                  <AppText variant="caption" color="textMuted">
                    {timeAgo(item.created_at)}
                  </AppText>
                </View>
                <AppText color="textSecondary" numberOfLines={3}>
                  {item.body}
                </AppText>
              </View>
              {!item.is_read && <View style={styles.dot} />}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          list.loading ? (
            <ActivityIndicator color={colors.primary} style={{ margin: spacing.xxl }} />
          ) : list.error ? (
            <EmptyState icon="cloud-offline-outline" title="No se pudieron cargar" message={list.error} actionLabel="Reintentar" onAction={list.retry} />
          ) : (
            <EmptyState icon="notifications-outline" title="Estás al día" message={isBusiness ? 'Aquí verás reseñas nuevas, canjes y el estado de tu negocio.' : 'Aquí verás tus puntos, premios y novedades de tus negocios.'} />
          )
        }
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} colors={[colors.primary]} />}
        ListFooterComponent={list.loadingMore ? <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} /> : null}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  unread: { backgroundColor: colors.primarySoft },
  icon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
});
