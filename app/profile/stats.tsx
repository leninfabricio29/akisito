import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Card, EmptyState, ProgressBar, SectionHeader, StackHeader } from '@/components/ui';
import { useWalletTotals } from '@/hooks/use-wallet-totals';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import { timeAgo } from '@/utils/format';

export default function StatsScreen() {
  const router = useRouter();
  const { wallets, totals, loading } = useWalletTotals();
  const maxVisits = Math.max(1, ...wallets.map((w) => w.checkins_count));

  const tiles = [
    { label: 'Puntos disponibles', value: totals.points, icon: 'star' as const, color: colors.accent },
    { label: 'Puntos ganados', value: totals.lifetimePoints, icon: 'trending-up' as const, color: colors.primary },
    { label: 'Visitas', value: totals.visits, icon: 'qr-code' as const, color: colors.primary },
    { label: 'Reseñas', value: totals.reviews, icon: 'chatbubble' as const, color: colors.success },
    { label: 'Canjes', value: totals.redemptions, icon: 'gift' as const, color: colors.accent },
    { label: 'Negocios', value: totals.businesses, icon: 'storefront' as const, color: colors.primary },
  ];

  return (
    <View style={styles.root}>
      <StackHeader title="Estadísticas" subtitle="Tu actividad en Akisito" />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ margin: spacing.xxl }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: SCREEN_PADDING, paddingBottom: spacing.xxxl }}>
          <View style={styles.grid}>
            {tiles.map((t) => (
              <Card key={t.label} style={styles.tile}>
                <Ionicons name={t.icon} size={20} color={t.color} />
                <AppText variant="h2" style={{ marginTop: spacing.xs }}>
                  {t.value}
                </AppText>
                <AppText variant="caption" color="textSecondary">
                  {t.label}
                </AppText>
              </Card>
            ))}
          </View>

          <View style={{ marginTop: spacing.xl }}>
            <SectionHeader title="Tus negocios" subtitle="Ordenados por tu última visita" />
            {wallets.length === 0 ? (
              <EmptyState compact icon="storefront-outline" title="Aún no visitas negocios" />
            ) : (
              <Card padded={false}>
                {wallets.map((w, i) => (
                  <Pressable
                    key={w.business.id}
                    onPress={() => router.push({ pathname: '/businesses/[id]', params: { id: String(w.business.id) } })}
                    style={[styles.row, i > 0 && styles.rowBorder]}
                  >
                    <Avatar uri={w.business.logo} name={w.business.name} size={40} rounded="md" />
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={styles.rowTop}>
                        <AppText variant="title" numberOfLines={1} style={{ flex: 1 }}>
                          {w.business.name}
                        </AppText>
                        <AppText variant="bodyStrong" color="primary">
                          {w.points_balance} pts
                        </AppText>
                      </View>
                      <ProgressBar value={w.checkins_count / maxVisits} color={colors.primary} height={5} />
                      <AppText variant="caption" color="textMuted">
                        {w.checkins_count} visitas · {w.reviews_count} reseñas
                        {w.last_checkin_at ? ` · ${timeAgo(w.last_checkin_at)}` : ''}
                      </AppText>
                    </View>
                  </Pressable>
                ))}
              </Card>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { width: '48.5%', padding: spacing.md, borderRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
