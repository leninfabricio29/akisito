import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { BusinessMiniCard } from '@/components/business/business-mini-card';
import { BannerCarousel } from '@/components/home/banner-carousel';
import { HomeHeader } from '@/components/home/home-header';
import { SearchCard } from '@/components/home/search-card';
import { ServicesRow } from '@/components/home/services-row';
import { TAB_BAR_HEIGHT } from '@/components/navigation/tab-bar';
import { EmptyState, SectionHeader, Skeleton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { businessService, contentService, loyaltyService } from '@/services';
import type { Banner, BusinessSummary } from '@/services';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';

const PARTNER_GAP = spacing.sm;
const BANNER_HEIGHT = 160; // ajusta al alto real de tu carrusel

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const unread = useUnreadCount();
  const { width } = useWindowDimensions();

  const [partners, setPartners] = useState<BusinessSummary[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const contentWidth = width - SCREEN_PADDING * 2;

  // Responsive: 2 cards en pantallas chicas, 3 en el resto
  const partnersVisible = width < 360 ? 2 : 3;
  const partnerWidth =
    (contentWidth - PARTNER_GAP * (partnersVisible - 1)) / partnersVisible;

  const load = useCallback(async () => {
    setError(false);
    const [list, ads, wallets] = await Promise.allSettled([
      businessService.list({ ordering: '-rating_avg', page_size: 12 }),
      contentService.banners(),
      loyaltyService.wallets(1, 100),
    ]);

    if (list.status === 'fulfilled') setPartners(list.value.results);
    if (ads.status === 'fulfilled') setBanners(ads.value);
    // Total global: suma de los saldos en todos los negocios.
    if (wallets.status === 'fulfilled') setPoints(wallets.value.results.reduce((sum, w) => sum + w.points_balance, 0));

    // Si TODO falló, marcamos error para mostrar retry
    setError([list, ads, wallets].every((r) => r.status === 'rejected'));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onRetry = () => {
    setLoading(true);
    load().finally(() => setLoading(false));
  };

  const openBusiness = (id: number) =>
    router.push({ pathname: '/businesses/[id]', params: { id: String(id) } });

  const onBanner = (banner: Banner) => {
    if (banner.business) openBusiness(banner.business);
    else if (banner.link_url) void Linking.openURL(banner.link_url);
  };

  const header = (
    <HomeHeader
      name={user ? `${user.first_name} ${user.last_name}` : ''}
      avatar={user?.avatar ?? null}
      unread={unread}
      onNotifications={() => router.push('/notifications')}
      onProfile={() => router.navigate('/(tabs)/profile')}
    />
  );

  // Estado de error global: sin datos y con fallo de red
  if (error && !loading && !partners.length && !banners.length) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.errorWrap}>
          <EmptyState
            icon="cloud-offline-outline"
            title="No pudimos cargar el inicio"
            actionLabel="Reintentar"
            onAction={onRetry}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {header}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + spacing.xxxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        <View style={styles.content}>
          

          {/* Banner arriba: contenido hero, mayor visibilidad */}
          {loading ? (
            <Skeleton width={contentWidth} height={BANNER_HEIGHT} rounded={radius.lg} />
          ) : banners.length > 0 ? (
            <BannerCarousel banners={banners} width={contentWidth} onPress={onBanner} />
          ) : null}

          <ServicesRow
            points={points}
            loading={loading}
            onFavorites={() => router.push('/profile/favorites')}
            onPoints={() => router.navigate('/(tabs)/rewards')}
            onVisits={() => router.push('/profile/visits')}
          />

          <View>
            <SectionHeader
              title="Negocios aliados"
              subtitle="Suma puntos en cada visita"
              actionLabel="Ver todos"
              onAction={() => router.navigate('/(tabs)/explore')}
            />
            {loading ? (
              <View style={styles.partnersRow}>
                {Array.from({ length: partnersVisible }).map((_, i) => (
                  <Skeleton
                    key={i}
                    width={partnerWidth}
                    height={partnerWidth + 34}
                    rounded={radius.lg}
                  />
                ))}
              </View>
            ) : partners.length ? (
              <FlatList
                data={partners}
                horizontal
                keyExtractor={(b) => String(b.id)}
                showsHorizontalScrollIndicator={false}
                snapToInterval={partnerWidth + PARTNER_GAP}
                decelerationRate="fast"
                contentContainerStyle={styles.partnersRow}
                renderItem={({ item }) => (
                  <BusinessMiniCard
                    business={item}
                    width={partnerWidth}
                    onPress={() => openBusiness(item.id)}
                  />
                )}
              />
            ) : (
              <EmptyState
                compact
                icon="storefront-outline"
                title="Aún no hay negocios aliados"
                actionLabel="Explorar"
                onAction={() => router.navigate('/(tabs)/explore')}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  partnersRow: {
    flexDirection: 'row',
    gap: PARTNER_GAP,
    paddingVertical: spacing.xxs,
  },
  errorWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: SCREEN_PADDING },
});
