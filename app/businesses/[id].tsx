import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessInfo } from '@/components/business/business-info';
import { RatingSummaryCard, ReviewItem } from '@/components/reviews/review-item';
import { RedemptionCodeModal } from '@/components/rewards/redemption-code-modal';
import { RewardCard } from '@/components/rewards/reward-card';
import { AppText, Avatar, Button, EmptyState, IconButton, Skeleton } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { usePaginated } from '@/hooks/use-paginated';
import { useRedeem } from '@/hooks/use-redeem';
import type { BusinessDetail, PublicReview, ReviewSummary, Reward } from '@/services';
import { businessService, errorMessage } from '@/services';
import { colors, gradients, radius, SCREEN_PADDING, shadows, spacing } from '@/theme';
import { categoryIcon } from '@/utils/category-icon';
import { formatRating } from '@/utils/format';

type Tab = 'info' | 'rewards' | 'reviews';

const TABS: { key: Tab; label: string }[] = [
  { key: 'info', label: 'Información' },
  { key: 'rewards', label: 'Promociones' },
  { key: 'reviews', label: 'Reseñas' },
];

const COVER_HEIGHT = 230;
const LOGO_SIZE = 84;

export default function BusinessDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string; tab?: Tab }>();
  const businessId = Number(params.id);

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(params.tab ?? 'info');
  const [rewards, setRewards] = useState<Reward[] | null>(null);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviewsTouched, setReviewsTouched] = useState(tab === 'reviews');

  const loadBusiness = useCallback(async () => {
    try {
      setBusiness(await businessService.detail(businessId));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [businessId]);

  const loadRewards = useCallback(async () => {
    try {
      setRewards((await businessService.rewards(businessId)).results);
    } catch {
      setRewards([]);
    }
  }, [businessId]);

  useEffect(() => {
    void loadBusiness();
    void loadRewards();
  }, [loadBusiness, loadRewards]);

  // Las reseñas se cargan solo al abrir la pestaña, y luego por páginas al hacer scroll.
  const reviews = usePaginated<PublicReview>(
    async (page) => {
      const data = await businessService.reviews(businessId, page);
      if (page === 1) setSummary(data.summary);
      return data;
    },
    [businessId],
    reviewsTouched,
  );

  const { redeem, redeemingId, redemption, closeRedemption, alert } = useRedeem(() => {
    void loadRewards();
    void loadBusiness();
  });

  const selectTab = (next: Tab) => {
    setTab(next);
    if (next === 'reviews') setReviewsTouched(true);
  };

  const toggleFavorite = async () => {
    if (!business) return;
    const wasFavorite = business.is_favorite;
    setBusiness({ ...business, is_favorite: !wasFavorite });
    try {
      if (wasFavorite) await businessService.removeFavorite(business.id);
      else await businessService.addFavorite(business.id);
    } catch {
      setBusiness((b) => (b ? { ...b, is_favorite: wasFavorite } : b));
    }
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  if (error && !business) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <IconButton icon="chevron-back" accessibilityLabel="Regresar" onPress={goBack} style={{ margin: spacing.lg }} />
        <EmptyState icon="storefront-outline" title="No pudimos abrir el negocio" message={error} actionLabel="Reintentar" onAction={loadBusiness} />
      </View>
    );
  }

  const cover = business?.cover ?? null;

  const header = (
    <View>
      <View style={styles.cover}>
        {cover ? (
          <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient colors={gradients.primary} style={StyleSheet.absoluteFill}>
            {business && (
              <View style={styles.coverIcon}>
                <Ionicons name={categoryIcon(business.category.icon)} size={64} color={colors.onPrimaryFaint} />
              </View>
            )}
          </LinearGradient>
        )}
        <LinearGradient colors={gradients.imageFadeTop} style={styles.topFade} />
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <IconButton icon="chevron-back" accessibilityLabel="Regresar" onPress={goBack} elevated />
          <IconButton
            icon={business?.is_favorite ? 'heart' : 'heart-outline'}
            color={business?.is_favorite ? colors.heart : colors.text}
            accessibilityLabel={business?.is_favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            onPress={toggleFavorite}
            elevated
          />
        </View>
      </View>

      <View style={styles.identity}>
        <View style={[styles.logo, shadows.md]}>
          <Avatar uri={business?.logo} name={business?.name} size={LOGO_SIZE} rounded="md" />
        </View>
        {business ? (
          <View style={styles.titles}>
            <AppText variant="h1" numberOfLines={2}>
              {business.name}
            </AppText>
            <View style={styles.metaRow}>
              <View style={styles.meta}>
                <Ionicons name={categoryIcon(business.category.icon)} size={14} color={colors.primary} />
                <AppText variant="caption" color="textSecondary">
                  {business.category.name}
                </AppText>
              </View>
              <View style={styles.meta}>
                <Ionicons name="star" size={14} color={colors.star} />
                <AppText variant="caption" color="textSecondary">
                  {formatRating(business.rating_avg)} ({business.rating_count})
                </AppText>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.titles, { gap: spacing.sm }]}>
            <Skeleton width="70%" height={24} />
            <Skeleton width="45%" height={14} />
          </View>
        )}
      </View>

      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map((t) => {
          const active = tab === t.key;
          const count = t.key === 'rewards' ? rewards?.length : t.key === 'reviews' ? business?.rating_count : undefined;
          return (
            <Pressable
              key={t.key}
              onPress={() => selectTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tab, active && styles.tabActive]}
            >
              <AppText variant="bodyStrong" style={{ color: active ? colors.primary : colors.textSecondary }}>
                {t.label}
                {count ? ` (${count})` : ''}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const data: (Reward | PublicReview)[] =
    tab === 'rewards' ? (rewards ?? []) : tab === 'reviews' ? reviews.items : [];

  const renderTabBody = () => {
    if (!business) {
      return (
        <View style={styles.body}>
          <Skeleton height={110} rounded={radius.lg} style={{ marginBottom: spacing.md }} />
          <Skeleton height={180} rounded={radius.lg} />
        </View>
      );
    }
    if (tab === 'info') {
      return (
        <View style={styles.body}>
          <BusinessInfo
            business={business}
            onOpenMap={() =>
              router.push({
                pathname: '/businesses/map',
                params: {
                  lat: business.latitude,
                  lng: business.longitude,
                  name: business.name,
                  address: business.address,
                },
              })
            }
          />
        </View>
      );
    }
    if (tab === 'rewards') {
      if (rewards === null) return <ActivityIndicator color={colors.primary} style={{ margin: spacing.xxl }} />;
      return (
        <EmptyState
          icon="gift-outline"
          title="Sin promociones por ahora"
          message={`${business.name} aún no publica recompensas. ¡Igual suma puntos en cada visita!`}
        />
      );
    }
    if (reviews.loading) return <ActivityIndicator color={colors.primary} style={{ margin: spacing.xxl }} />;
    if (reviews.error) {
      return <EmptyState icon="cloud-offline-outline" title="No se cargaron las reseñas" message={reviews.error} actionLabel="Reintentar" onAction={reviews.retry} />;
    }
    return (
      <EmptyState
        icon="chatbubbles-outline"
        title="Aún no hay reseñas"
        message="Visita el negocio, escanea su QR y sé el primero en opinar."
      />
    );
  };

  const reviewsHeader =
    tab === 'reviews' && summary && reviews.items.length > 0 ? (
      <View style={[styles.body, { paddingBottom: 0 }]}>
        <RatingSummaryCard average={parseFloat(summary.rating_avg)} count={summary.rating_count} breakdown={summary.breakdown} />
      </View>
    ) : null;

  return (
    <View style={styles.root}>
      <FlatList<Reward | PublicReview>
        data={data}
        keyExtractor={(item) => `${tab}-${item.id}`}
        ListHeaderComponent={
          <>
            {header}
            {reviewsHeader}
          </>
        }
        ListEmptyComponent={renderTabBody()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            {tab === 'rewards' ? (
              <RewardCard
                reward={item as Reward}
                showBusiness={false}
                redeeming={redeemingId === item.id}
                onRedeem={() => redeem(item as Reward)}
              />
            ) : (
              <ReviewItem review={item as PublicReview} businessName={business?.name ?? ''} />
            )}
          </View>
        )}
        onEndReached={tab === 'reviews' ? reviews.loadMore : undefined}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          tab === 'reviews' && reviews.loadingMore ? (
            <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} />
          ) : tab === 'reviews' && reviews.error && reviews.items.length ? (
            <Button title="Reintentar" variant="ghost" onPress={reviews.retry} />
          ) : (
            <View style={{ height: insets.bottom + spacing.xxl }} />
          )
        }
        showsVerticalScrollIndicator={false}
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
  cover: { height: COVER_HEIGHT, backgroundColor: colors.primarySoft },
  coverIcon: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 110 },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    paddingHorizontal: SCREEN_PADDING,
    marginTop: -LOGO_SIZE / 2,
  },
  logo: { borderRadius: LOGO_SIZE * 0.28 + 4, padding: 4, backgroundColor: colors.surface },
  titles: { flex: 1, paddingBottom: spacing.xs },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabs: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    marginHorizontal: SCREEN_PADDING,
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm + 2, borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.surface, ...shadows.sm },
  body: { padding: SCREEN_PADDING },
  item: { paddingHorizontal: SCREEN_PADDING, paddingTop: spacing.md },
});
