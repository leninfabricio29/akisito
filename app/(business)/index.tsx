import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarChart } from '@/components/charts/bar-chart';
import { KpiCard } from '@/components/charts/kpi-card';
import { StatusBanner } from '@/components/portal/status-banner';
import { AppText, Avatar, Card, EmptyState, IconButton, SectionHeader, Skeleton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useBusiness } from '@/context/business-context';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { errorMessage, portalService } from '@/services';
import type { BusinessStats, CustomerSegment, StatsPeriod } from '@/services';
import { colors, gradients, radius, SCREEN_PADDING, spacing } from '@/theme';
import { greeting } from '@/utils/format';
import { hoursSeries, peakHour, visitsSeries } from '@/utils/stats';

const PERIODS: { key: StatsPeriod; label: string }[] = [
  { key: 'week', label: '7 días' },
  { key: 'month', label: '30 días' },
  { key: 'year', label: '12 meses' },
];

const SEGMENTS: { key: CustomerSegment; label: string; hint: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'new', label: 'Nuevos', hint: 'Primera visita en 30 días', icon: 'sparkles', color: colors.primary },
  { key: 'frequent', label: 'Frecuentes', hint: '3+ visitas y activos', icon: 'flame', color: colors.accent },
  { key: 'at_risk', label: 'En riesgo', hint: 'Sin venir hace 30-60 días', icon: 'warning', color: colors.warning },
  { key: 'inactive', label: 'Inactivos', hint: 'Más de 60 días sin venir', icon: 'moon', color: colors.textSecondary },
];

const ACTIONS: { label: string; icon: keyof typeof Ionicons.glyphMap; href: Href; needsApproval?: boolean }[] = [
  { label: 'Validar canje', icon: 'ticket-outline', href: '/business/validate', needsApproval: true },
  { label: 'Nueva recompensa', icon: 'add-circle-outline', href: '/business/reward-form' },
  { label: 'Mi QR', icon: 'qr-code-outline', href: '/business/qr', needsApproval: true },
  { label: 'Reseñas', icon: 'chatbubbles-outline', href: '/business/reviews' },
];

export default function BusinessDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { business, isApproved, reload } = useBusiness();
  const unread = useUnreadCount();
  const [period, setPeriod] = useState<StatsPeriod>('month');
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (p: StatsPeriod) => {
    try {
      setStats(await portalService.stats(p));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(period);
    }, [load, period]),
  );

  const changePeriod = (p: StatsPeriod) => {
    setStats(null);
    setPeriod(p);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(period), reload()]);
    setRefreshing(false);
  };

  const name = business?.name ?? user?.business?.name ?? '';
  const peak = stats ? peakHour(stats) : null;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: spacing.xxxl * 2 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.onPrimary} colors={[colors.primary]} />}
    >
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <Avatar uri={business?.logo} name={name} size={48} rounded="md" borderColor={colors.onPrimaryFaint} />
          <View style={{ flex: 1 }}>
            <AppText variant="caption" style={{ color: colors.onPrimaryMuted }}>
              {greeting()}, {user?.first_name}
            </AppText>
            <AppText variant="h2" color="textInverse" numberOfLines={1}>
              {name}
            </AppText>
          </View>
          <IconButton
            icon="notifications-outline"
            accessibilityLabel="Notificaciones"
            badge={unread}
            onPress={() => router.push('/notifications')}
            color={colors.onPrimary}
            background={colors.glass}
            size={44}
          />
        </View>

        <View style={styles.periods}>
          {PERIODS.map((p) => {
            const active = period === p.key;
            return (
              <Pressable key={p.key} onPress={() => changePeriod(p.key)} style={[styles.period, active && styles.periodActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
                <AppText variant="caption" style={{ color: active ? colors.primary : colors.onPrimaryMuted, fontWeight: '700' }}>
                  {p.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <StatusBanner />

        {error && !stats ? (
          <Card>
            <EmptyState compact icon="cloud-offline-outline" title="No pudimos cargar tus estadísticas" message={error} actionLabel="Reintentar" onAction={() => load(period)} />
          </Card>
        ) : !stats ? (
          <View style={styles.kpis}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={104} rounded={radius.lg} style={{ flexBasis: '48%', flexGrow: 1 }} />
            ))}
          </View>
        ) : (
          <>
            <View style={styles.kpis}>
              <KpiCard label="Visitas" value={stats.visits.value} icon="qr-code" change={stats.visits.change_pct} />
              <KpiCard label="Clientes únicos" value={stats.unique_clients.value} icon="people" change={stats.unique_clients.change_pct} />
              <KpiCard label="Clientes nuevos" value={stats.new_clients} icon="sparkles" tint={colors.success} hint={`${stats.returning_clients} regresaron`} />
              <KpiCard label="Tasa de regreso" value={`${stats.repeat_rate_pct}%`} icon="repeat" tint={colors.accent} hint={`${stats.visits_per_client} visitas por cliente`} />
              <KpiCard label="Canjes validados" value={stats.redemptions.value} icon="gift" tint={colors.accent} change={stats.redemptions.change_pct} />
              <KpiCard
                label="Calificación"
                value={stats.reviews.count ? stats.reviews.rating_avg.toFixed(1) : '—'}
                icon="star"
                tint={colors.star}
                hint={`${stats.reviews.count} reseñas en el periodo`}
              />
            </View>

          

            

            

          

            {stats.top_clients.length > 0 && (
              <Card>
                <SectionHeader title="Clientes más fieles" subtitle="Más visitas en el periodo" />
                {stats.top_clients.map((c, i) => (
                  <View key={c.id} style={[styles.topRow, i > 0 && styles.topBorder]}>
                    <AppText variant="bodyStrong" color="textMuted" style={{ width: 20 }}>
                      {i + 1}
                    </AppText>
                    <Avatar name={c.name} size={34} />
                    <AppText variant="title" style={{ flex: 1 }} numberOfLines={1}>
                      {c.name}
                    </AppText>
                    <AppText variant="bodyStrong" color="primary">
                      {c.visits} {c.visits === 1 ? 'visita' : 'visitas'}
                    </AppText>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}

       
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxxl + spacing.md, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  periods: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xl, padding: spacing.xs, borderRadius: radius.md, backgroundColor: colors.glass },
  period: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
  periodActive: { backgroundColor: colors.surface },
  content: { paddingHorizontal: SCREEN_PADDING, marginTop: -spacing.xxxl, gap: spacing.lg },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  segments: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  segment: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: spacing.md,
    gap: 2,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  points: { flexDirection: 'row' },
  pointItem: { flex: 1, alignItems: 'center', gap: 2 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  topBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  actionIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
});
