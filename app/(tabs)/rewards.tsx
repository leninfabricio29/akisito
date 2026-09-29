import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RedemptionCodeModal } from '@/components/rewards/redemption-code-modal';
import { RewardCard } from '@/components/rewards/reward-card';
import { WalletCard } from '@/components/rewards/wallet-card';
import { AppText, Button, Card, Chip, EmptyState, IconButton, SectionHeader, Skeleton } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { usePaginated } from '@/hooks/use-paginated';
import { useRedeem } from '@/hooks/use-redeem';
import { loyaltyService, rewardService } from '@/services';
import type { Reward, Wallet } from '@/services';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';

type Filter = 'all' | 'available';

export default function RewardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<Filter>('all');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(true);

  const rewards = usePaginated<Reward>((page) => rewardService.list({ page, ordering: 'points_required' }));

  const loadWallets = useCallback(async () => {
    try {
      setWallets((await loyaltyService.wallets(1, 30)).results);
    } catch {
      // se mantiene lo último cargado
    } finally {
      setWalletsLoading(false);
    }
  }, []);

  // Al volver de escanear o canjear, los saldos cambian.
  useFocusEffect(
    useCallback(() => {
      void loadWallets();
    }, [loadWallets]),
  );

  const { redeem, redeemingId, redemption, closeRedemption, alert } = useRedeem(() => {
    void loadWallets();
    void rewards.refresh();
  });

  const totalPoints = useMemo(() => wallets.reduce((sum, w) => sum + w.points_balance, 0), [wallets]);
  const visible = filter === 'available' ? rewards.items.filter((r) => r.can_redeem) : rewards.items;
  const walletWidth = Math.min(width * 0.72, 280);

  const header = (
    <View>
      <View style={[styles.titleRow, { paddingTop: insets.top + spacing.md }]}>
        <View style={{ flex: 1 }}>
          <AppText variant="h1">Premios</AppText>
          <AppText color="textSecondary">Canjea tus puntos en cada negocio</AppText>
        </View>
        <IconButton
          icon="receipt-outline"
          accessibilityLabel="Mis canjes"
          background={colors.primarySoft}
          color={colors.primary}
          onPress={() => router.push('/profile/redemptions')}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Mis puntos" subtitle={wallets.length ? `${totalPoints} pts en ${wallets.length} negocios` : undefined} />
      </View>
      {walletsLoading ? (
        <View style={[styles.wallets, { paddingHorizontal: SCREEN_PADDING }]}>
          <Skeleton width={walletWidth} height={168} rounded={radius.xl} />
          <Skeleton width={walletWidth} height={168} rounded={radius.xl} />
        </View>
      ) : wallets.length ? (
        <FlatList
          data={wallets}
          horizontal
          keyExtractor={(w) => String(w.business.id)}
          showsHorizontalScrollIndicator={false}
          snapToInterval={walletWidth + spacing.md}
          decelerationRate="fast"
          contentContainerStyle={[styles.wallets, { paddingHorizontal: SCREEN_PADDING }]}
          renderItem={({ item }) => (
            <WalletCard
              wallet={item}
              width={walletWidth}
              onPress={() => router.push({ pathname: '/businesses/[id]', params: { id: String(item.business.id), tab: 'rewards' } })}
            />
          )}
        />
      ) : (
        <View style={styles.section}>
          <Card style={styles.emptyWallet}>
            <AppText variant="title">Aún no tienes puntos</AppText>
            <AppText color="textSecondary" style={{ marginVertical: spacing.xs }}>
              Escanea el QR de un negocio aliado al llegar y empieza a sumar.
            </AppText>
            <Button title="Escanear ahora" icon="scan" size="sm" onPress={() => router.push('/scanner')} style={{ alignSelf: 'flex-start' }} />
          </Card>
        </View>
      )}

      <View style={[styles.section, { marginTop: spacing.xl }]}>
        <SectionHeader title="Recompensas" />
        <View style={styles.filters}>
          <Chip label="Todas" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="Puedo canjear" icon="checkmark-circle" selected={filter === 'available'} onPress={() => setFilter('available')} />
        </View>
      </View>
    </View>
  );

  const empty = rewards.loading ? (
    <View style={styles.section}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} height={170} rounded={radius.lg} style={{ marginBottom: spacing.md }} />
      ))}
    </View>
  ) : rewards.error ? (
    <EmptyState icon="cloud-offline-outline" title="No pudimos cargar los premios" message={rewards.error} actionLabel="Reintentar" onAction={rewards.retry} />
  ) : filter === 'available' ? (
    <EmptyState icon="hourglass-outline" title="Aún no alcanzas ningún premio" message="Sigue visitando tus negocios favoritos para sumar puntos." />
  ) : (
    <EmptyState icon="gift-outline" title="No hay recompensas por ahora" message="Los negocios aliados publicarán premios pronto." />
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={visible}
        keyExtractor={(r) => String(r.id)}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <RewardCard
              reward={item}
              redeeming={redeemingId === item.id}
              onRedeem={() => redeem(item)}
              onOpenBusiness={() => router.push({ pathname: '/businesses/[id]', params: { id: String(item.business.id) } })}
            />
          </View>
        )}
        onEndReached={rewards.loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={{ paddingBottom: spacing.xxxl * 2 }}
        refreshControl={
          <RefreshControl
            refreshing={rewards.refreshing}
            onRefresh={() => {
              void loadWallets();
              void rewards.refresh();
            }}
            colors={[colors.primary]}
          />
        }
        ListFooterComponent={rewards.loadingMore ? <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} /> : null}
      />

      <RedemptionCodeModal
        redemption={redemption}
        onClose={closeRedemption}
        onSeeAll={() => {
          closeRedemption();
          router.push('/profile/redemptions');
        }}
      />
      <Alert visible={alert.visibleConfig} config={alert.config} onDismiss={alert.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SCREEN_PADDING, marginBottom: spacing.lg },
  section: { paddingHorizontal: SCREEN_PADDING },
  wallets: { gap: spacing.md, flexDirection: 'row' },
  emptyWallet: { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  item: { paddingHorizontal: SCREEN_PADDING, marginBottom: spacing.md },
});
