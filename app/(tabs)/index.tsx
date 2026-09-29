import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { BusinessMiniCard } from '@/components/business/business-mini-card';
import { BannerCarousel } from '@/components/home/banner-carousel';
import { CategoriesCard } from '@/components/home/categories-card';
import { HOME_HEADER_OVERLAP, HomeHeader } from '@/components/home/home-header';
import { SearchCard } from '@/components/home/search-card';
import { TAB_BAR_HEIGHT } from '@/components/navigation/tab-bar';
import { EmptyState, SectionHeader, Skeleton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { businessService, contentService } from '@/services';
import type { Banner, BusinessSummary, Category } from '@/services';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';

const PARTNERS_VISIBLE = 3;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const unread = useUnreadCount();
  const { width } = useWindowDimensions();

  const [categories, setCategories] = useState<Category[]>([]);
  const [partners, setPartners] = useState<BusinessSummary[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const contentWidth = width - SCREEN_PADDING * 2;
  const partnerWidth = (contentWidth - spacing.sm * (PARTNERS_VISIBLE - 1)) / PARTNERS_VISIBLE;

  const load = useCallback(async () => {
    const [cats, list, ads] = await Promise.allSettled([
      businessService.categories(),
      businessService.list({ ordering: '-rating_avg', page_size: 12 }),
      contentService.banners(),
    ]);
    if (cats.status === 'fulfilled') setCategories(cats.value);
    if (list.status === 'fulfilled') setPartners(list.value.results);
    if (ads.status === 'fulfilled') setBanners(ads.value);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openBusiness = (id: number) => router.push({ pathname: '/businesses/[id]', params: { id: String(id) } });

  const onBanner = (banner: Banner) => {
    if (banner.business) openBusiness(banner.business);
    else if (banner.link_url) void Linking.openURL(banner.link_url);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + spacing.xxxl }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.onPrimary} colors={[colors.primary]} />
      }
    >
      <HomeHeader
        name={user ? `${user.first_name} ${user.last_name}` : ''}
        avatar={user?.avatar ?? null}
        unread={unread}
        onNotifications={() => router.push('/notifications')}
        onProfile={() => router.navigate('/(tabs)/profile')}
      />

      <View style={styles.content}>
        <SearchCard
          onPress={() => router.navigate({ pathname: '/(tabs)/explore', params: { focus: String(Date.now()) } })}
          onNearby={() => router.navigate({ pathname: '/(tabs)/explore', params: { nearby: String(Date.now()) } })}
        />

        <CategoriesCard
          categories={categories}
          loading={loading}
          onSelect={(c) =>
            router.navigate({ pathname: '/(tabs)/explore', params: { category: String(c.id), categoryName: c.name } })
          }
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
              {Array.from({ length: PARTNERS_VISIBLE }).map((_, i) => (
                <Skeleton key={i} width={partnerWidth} height={partnerWidth + 34} rounded={radius.lg} />
              ))}
            </View>
          ) : partners.length ? (
            <FlatList
              data={partners}
              horizontal
              keyExtractor={(b) => String(b.id)}
              showsHorizontalScrollIndicator={false}
              snapToInterval={partnerWidth + spacing.sm}
              decelerationRate="fast"
              contentContainerStyle={styles.partnersRow}
              renderItem={({ item }) => (
                <BusinessMiniCard business={item} width={partnerWidth} onPress={() => openBusiness(item.id)} />
              )}
            />
          ) : (
            <EmptyState compact icon="storefront-outline" title="Pronto habrá negocios aliados" />
          )}
        </View>

        {banners.length > 0 && <BannerCarousel banners={banners} width={contentWidth} onPress={onBanner} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: SCREEN_PADDING, marginTop: -HOME_HEADER_OVERLAP, gap: spacing.xl },
  partnersRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xxs },
});
