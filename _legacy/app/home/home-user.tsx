import HeaderClientComponent from '@/components/client/headerClient';
import { useAuth } from '@/context/auth-context';
import { Advertisement, listAdvertisementsRequest } from '@/services/modules/advertisements';
import {
  PromotionItem,
  getAllPromotionsRequest,
} from '@/services/modules/promotions';
import {
  PlaceItem,
  createVisitRequest
} from '@/services/place-service';
import {
  StatsClients,
  UserProfile,
  getStatsClientsRequest,
  getUserProfileRequest,
} from '@/services/user-service';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

// ── Palette ──────────────────────────────────────────────
const C = {
  brand: '#b82a5e',
  brandLight: '#d4547e',
  brandDark: '#8a1f46',
  brandFaint: 'rgba(184,42,94,0.10)',
  bg: '#faf8fc',
  surface: '#f0ecf5',
  surfaceHigh: '#1e1228',
  white: '#ffffff',
  muted: '#9e8aaa',
  text: '#3d2652',
  gold: '#f5a623',
  goldLight: 'rgba(245,166,35,0.15)',
  green: '#2dc88a',
  greenFaint: 'rgba(45,200,138,0.12)',
};

const REWARD_GRADIENTS: [string, string][] = [
  ['#c0392b', '#e74c3c'],
  ['#8e44ad', '#b82a5e'],
  ['#1a6b8a', '#2980b9'],
  ['#1d7f5c', '#2dc88a'],
];

// ── Sub-components ────────────────────────────────────────

type RewardCardData = {
  id: string;
  title: string;
  pointsRequired: number;
  subtitle: string;
  tag: string;
  image?: string;
  colors: [string, string];
};

function getPromotionPlaceName(placeId: PromotionItem['place_id']): string | undefined {
  if (typeof placeId === 'string') {
    return undefined;
  }

  return placeId.name?.trim() || undefined;
}

function getPointsMeta(pointsBalance: number, rewards: RewardCardData[]) {
  const nextReward = rewards.find((reward) => reward.pointsRequired > pointsBalance) ?? null;

  if (!nextReward) {
    return {
      label: 'No hay recompensas activas',
      nextRewardTitle: 'Sin recompensas',
      pointsToNext: 0,
      progress: 1,
    };
  }

  const safeTarget = Math.max(1, nextReward.pointsRequired);

  return {
    label: `Te faltan ${nextReward.pointsRequired - pointsBalance} pts para canjear ${nextReward.title}`,
    nextRewardTitle: nextReward.title,
    pointsToNext: nextReward.pointsRequired - pointsBalance,
    progress: Math.min(1, pointsBalance / safeTarget),
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Ionicons name="star" size={11} color={C.gold} />
      <Text style={{ color: C.gold, fontSize: 11, fontWeight: '700' }}>{rating}</Text>
    </View>
  );
}

// ── Tarjeta de puntos del usuario ──
function PointsHeroCard({
  pointsBalance,
  nextRewardTitle,
  pointsToNext,
  progress,
  helperText,
}: {
  pointsBalance: number;
  nextRewardTitle: string;
  pointsToNext: number;
  progress: number;
  helperText: string;
}) {
  return (
    <View style={s.heroCard}>
      <LinearGradient
        colors={[C.brandDark, C.brand, '#e0436e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.heroGradient}
      >
        {/* Círculo decorativo */}
        <View style={s.heroBubble} />
        <View style={s.heroBubbleSmall} />

        <View style={s.heroRow}>
          <View>
            <Text style={s.heroLabel}>Tus puntos</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
              <Text style={s.heroPoints}>{pointsBalance}</Text>
              <Text style={s.heroPts}>pts</Text>
            </View>
          </View>
          <View style={s.heroLevelBadge}>
            <Ionicons name="gift-outline" size={14} color={C.gold} />
            <Text style={s.heroLevelText}>{nextRewardTitle}</Text>
          </View>
        </View>

        {/* Barra de progreso */}
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={s.progressLabel}>
          {pointsToNext > 0 ? (
            <>
              Te faltan <Text style={{ fontWeight: '800', color: C.gold }}>{pointsToNext} pts</Text> para el próximo canje
            </>
          ) : (
            helperText
          )}
        </Text>
      </LinearGradient>
    </View>
  );
}

// ── Acciones rápidas ──
function QuickActions({ onVisit, onScan, onRefer }: { onVisit: () => void; onScan: () => void; onRefer: () => void }) {
  const actions = [
    { icon: 'location-outline', label: 'Negocios', onPress: onVisit },
    { icon: 'camera-outline', label: 'Scanear', onPress: onScan },
    { icon: 'people-outline', label: 'Referir', onPress: onRefer },
  ];
  return (
    <View>
      <View style={s.sectionHeaderInline}>
        <View>
          <Text style={s.sectionTitle}>Accesos rápidos</Text>
          <Text style={s.sectionSubtitle}>Visita un  lugar o comparte tu código</Text>
        </View>
      </View>
      <View style={s.quickRow}>
        {actions.map((a) => (
          <TouchableOpacity
            key={a.label}
            style={s.quickBtn}
            activeOpacity={0.75}
            onPress={a.onPress}
          >
            <View style={s.quickIconWrap}>
              <Ionicons name={a.icon as any} size={22} color={C.brand} />
            </View>
            <Text style={s.quickLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Tarjeta de negocio participante ──
function BusinessCard({ place, onPress }: { place: PlaceItem; onPress?: () => void }) {
  const mainImage = place.images?.[0];
  const categoryName =
    typeof place.category_id === 'string' ? 'Negocio' : place.category_id?.name || 'Negocio';

  return (
    <TouchableOpacity style={s.bizCard} activeOpacity={0.88} onPress={onPress}>
      <Image source={{ uri: mainImage }} style={s.bizImage} contentFit="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(20,10,30,0.92)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Puntos badge arriba derecha */}
      <View style={s.bizPointsBadge}>
        <Ionicons name="flash" size={10} color={C.gold} />
        <Text style={s.bizPointsText}>2x pts</Text>
      </View>

      <View style={s.bizInfo}>
        <Text style={s.bizName} numberOfLines={1}>{place.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
          <View style={s.bizCatPill}>
            <Text style={s.bizCatText}>{categoryName}</Text>
          </View>
          <StarRating rating={4.5} />
        </View>
        <View style={s.bizEarnRow}>
          <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.55)" />
          <Text style={s.bizAddress} numberOfLines={1}>{place.address}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const BusinessCardMemo = memo(BusinessCard);

// ── Tarjeta de recompensa destacada ──
function RewardHighlightCard({
  image,
  title,
  subtitle,
  pts,
  tag,
  colors,
}: {
  image?: string;
  title: string;
  subtitle: string;
  pts: number;
  tag: string;
  colors: [string, string];
}) {
  const hasImage = Boolean(image);
  return (
    <TouchableOpacity activeOpacity={0.85} style={s.rewardCard}>
      {hasImage ? (
        <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <LinearGradient colors={colors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(14,8,19,0.92)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.rewardIconWrap}>
        <Ionicons name={hasImage ? 'pricetag' : 'gift-outline'} size={26} color={C.white} />
      </View>
      <View style={{ flex: 1, marginTop: 10 }}>
        <Text style={s.rewardTitle} numberOfLines={2}>{title}</Text>
        <Text style={s.rewardSubtitle} numberOfLines={2}>{subtitle}</Text>
      </View>
      <View style={s.rewardBottom}>
        <View style={s.rewardPtsPill}>
          <Text style={s.rewardPtsText}>{pts} pts</Text>
        </View>
        <Text style={s.rewardTag}>{tag}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Carousel Indicators ──
const CarouselIndicators = memo(({ count, activeIndex }: { count: number; activeIndex: number }) => (
  <View style={s.carouselIndicators}>
    {Array.from({ length: count }).map((_, i) => (
      <View
        key={i}
        style={[s.carouselIndicatorDot, activeIndex === i && s.carouselIndicatorDotActive]}
      />
    ))}
  </View>
));
CarouselIndicators.displayName = 'CarouselIndicators';

// ── Utility ───────────────────────────────────────────────
function getRandomItems<T>(array: T[], count: number): T[] {
  if (array.length <= count) return array;
  return [...array].sort(() => Math.random() - 0.5).slice(0, count);
}

// ── Main Screen ───────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { authToken, session } = useAuth();
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [clientStats, setClientStats] = useState<StatsClients | null>(null);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselScrollRef = useRef<ScrollView>(null);
  const carouselIndexRef = useRef(0);
  const scanLockRef = useRef(false);

  // Auto-scroll carousel
  useEffect(() => {
    if (advertisements.length === 0) return;
    const interval = setInterval(() => {
      carouselIndexRef.current = (carouselIndexRef.current + 1) % advertisements.length;
      carouselScrollRef.current?.scrollTo({
        x: carouselIndexRef.current * (width * 0.9 + 12),
        animated: true,
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [advertisements.length]);

  const fetchAdvertisements = useCallback(async () => {
    try {
      if (!authToken) return;
      const response = await listAdvertisementsRequest(authToken);
      setAdvertisements(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
    }
  }, [authToken]);


  const handleCarouselScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / (width * 0.9 + 12));
    carouselIndexRef.current = newIndex;
    setCarouselIndex(newIndex);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadUserData = async () => {
      if (!authToken) {
        if (mounted) {
          setProfile(null);
          setClientStats(null);
          setPromotions([]);
        }
        return;
      }

      try {
        const [profileResponse, statsResponse, promotionsResponse] = await Promise.allSettled([
          getUserProfileRequest(authToken),
          getStatsClientsRequest(authToken),
          getAllPromotionsRequest(authToken),
        ]);

        if (!mounted) {
          return;
        }

        if (profileResponse.status === 'fulfilled') {
          setProfile(profileResponse.value);
        }

        if (statsResponse.status === 'fulfilled') {
          setClientStats(statsResponse.value);
        }

        if (promotionsResponse.status === 'fulfilled') {
          const rawPromotions = Array.isArray(promotionsResponse.value)
            ? promotionsResponse.value
            : promotionsResponse.value.items ?? [];
          setPromotions(rawPromotions);
        }

        fetchAdvertisements();
      } catch (error) {
        console.error('Error loading home data:', error);
      }
    };

    loadUserData();

    return () => {
      mounted = false;
    };
  }, [authToken, fetchAdvertisements]);

  const memoizedAds = useMemo(
    () => advertisements.filter((ad) => ad.active === true),
    [advertisements],
  );
  const currentPoints = profile?.points_balance ?? clientStats?.total_points ?? 0;
  const referralCode = profile?.referral_code ?? session?.referral_code ?? 'No disponible';

  const highlightRewards = useMemo(() => {
    return promotions
      .filter((promotion) => promotion.status === 'active')
      .sort((left, right) => left.points_required - right.points_required)
      .slice(0, 3)
      .map((promotion, index): RewardCardData => ({
        id: promotion._id,
        title: promotion.title,
        pointsRequired: promotion.points_required,
        subtitle:
          promotion.description?.trim() || getPromotionPlaceName(promotion.place_id) || 'Promoción activa disponible',
        tag:
          promotion.total_claimed !== undefined && promotion.total_max_claims !== undefined
            ? `${promotion.total_claimed}/${promotion.total_max_claims} reclamadas`
            : 'Disponible',
        image: promotion.image,
        colors: REWARD_GRADIENTS[index % REWARD_GRADIENTS.length],
      }));
  }, [promotions]);

  const pointsMeta = useMemo(
    () => getPointsMeta(currentPoints, highlightRewards),
    [currentPoints, highlightRewards],
  );

  useEffect(() => {
    if (!showScannerModal || !cameraPermission) {
      return;
    }

    if (cameraPermission.status !== 'granted') {
      requestCameraPermission();
    }
  }, [cameraPermission, requestCameraPermission, showScannerModal]);

  const closeScannerModal = useCallback(() => {
    scanLockRef.current = false;
    setShowScannerModal(false);
  }, []);

  const resolvePlaceIdFromScan = useCallback((data: string) => {
    const rawValue = data.trim();

    try {
      const url = new URL(rawValue);
      const queryPlaceId =
        url.searchParams.get('place_id') ??
        url.searchParams.get('placeId') ??
        url.searchParams.get('id');

      if (queryPlaceId) {
        return queryPlaceId.trim();
      }

      const lastPathSegment = url.pathname.split('/').filter(Boolean).pop();
      if (lastPathSegment) {
        return decodeURIComponent(lastPathSegment).trim();
      }
    } catch {
      // El QR puede contener solo el identificador.
    }

    return rawValue;
  }, []);

  const handleQrScanned = useCallback(
    async ({ data, type }: { data: string; type?: string }) => {
      const normalizedType = type?.toLowerCase();
      if (normalizedType && !normalizedType.includes('qr')) {
        return;
      }

      if (scanLockRef.current) {
        return;
      }

      const placeId = resolvePlaceIdFromScan(data);
      if (!placeId) {
        Alert.alert('QR inválido', 'No se pudo leer un identificador válido en el código.');
        return;
      }

      if (!authToken) {
        Alert.alert('Inicia sesión', 'Debes iniciar sesión como cliente para registrar la visita.');
        return;
      }

      scanLockRef.current = true;

      try {
        await createVisitRequest(authToken, placeId);
        closeScannerModal();
        Alert.alert('Visita registrada', 'El QR fue leído correctamente y la visita quedó registrada.');
      } catch (error) {
        scanLockRef.current = false;
        Alert.alert(
          'No se pudo registrar',
          error instanceof Error ? error.message : 'Inténtalo nuevamente con otro QR.',
        );
      }
    },
    [authToken, closeScannerModal, resolvePlaceIdFromScan],
  );

  return (
    <View style={s.root}>
      <HeaderClientComponent />

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

       

        {/* ── Tarjeta de puntos hero ── */}
        <View style={s.heroPadding}>
          <PointsHeroCard
            pointsBalance={currentPoints}
            nextRewardTitle={pointsMeta.nextRewardTitle}
            pointsToNext={pointsMeta.pointsToNext}
            progress={pointsMeta.progress}
            helperText={pointsMeta.label}
          />
        </View>

        {/* ── Acciones rápidas ── */}
        <View style={s.section}>
          <QuickActions
            onVisit={() => router.push('/places/places' as never)}
            onScan={() => setShowScannerModal(true)}
            onRefer={() => setShowReferralModal(true)}
          />
        </View>

        {/* ── Promociones / Carousel ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View>
              <Text style={s.sectionTitle}>Visita estos lugares</Text>
              <Text style={s.sectionSubtitle}>Nuestras mejores opciones</Text>
            </View>
          </View>
          <ScrollView
            ref={carouselScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            onMomentumScrollEnd={handleCarouselScroll}
          >
            {memoizedAds.length > 0 ? (
              memoizedAds.map((ad) => (
                <View key={ad._id} style={s.carouselSlide}>
                  <Image source={{ uri: ad.image }} style={s.carouselImage} contentFit="cover" />
                  <LinearGradient
                    colors={['transparent', 'rgba(15,8,18,0.6)']}
                    style={s.carouselGradient}
                  />
                  {/* Badge "2x puntos" sobre el banner */}
                  
                </View>
              ))
            ) : (
              <View style={s.carouselSlide}>
                <LinearGradient
                  colors={[C.brandDark, C.brand]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.carouselPlaceholder}
                >
                  <Ionicons name="flash" size={32} color={C.gold} />
                  <Text style={s.carouselTitle}>Cargando promociones...</Text>
                  <Text style={s.carouselSubtitle}>Pronto verás ofertas exclusivas</Text>
                </LinearGradient>
              </View>
            )}
          </ScrollView>
          {memoizedAds.length > 0 && (
            <CarouselIndicators count={memoizedAds.length} activeIndex={carouselIndex} />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        visible={showReferralModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowReferralModal(false)}
      >
        <View style={s.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowReferralModal(false)}
          />
          <View style={s.referralModalCard}>
            <View style={s.referralModalHeader}>
              <View>
                <Text style={s.referralModalTitle}>Tu código de referido</Text>
                <Text style={s.referralModalSubtitle}>Comparte este código para invitar a otros usuarios</Text>
              </View>
              
            </View>

            <View style={s.referralCodeCard}>
              <Text style={s.referralCodeLabel}>Código</Text>
              <Text style={s.referralCodeValue}>{referralCode}</Text>
            </View>

            <Text style={s.referralModalHint}>
              Si el código aparece como no disponible, verifica que tu perfil esté actualizado.
            </Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showScannerModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeScannerModal}
      >
        <View style={s.modalBackdrop}>
          <View style={s.scannerModalCard}>
            <View style={s.scannerHeader}>
              <View>
                <Text style={s.scannerTitle}>Escanear QR</Text>
                <Text style={s.scannerSubtitle}>
                  Apunta la cámara al código del negocio para registrar tu visita.
                </Text>
              </View>
              <TouchableOpacity style={s.scannerCloseBtn} activeOpacity={0.8} onPress={closeScannerModal}>
                <Text style={s.scannerCloseText}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <View style={s.scannerFrame}>
              {cameraPermission?.status === 'granted' ? (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={handleQrScanned}
                />
              ) : (
                <View style={s.scannerPermissionBox}>
                  <Ionicons name="camera" size={34} color={C.brand} />
                  <Text style={s.scannerPermissionTitle}>Se necesita acceso a la cámara</Text>
                  <Text style={s.scannerPermissionText}>
                    Activa el permiso para poder enfocar y leer el QR.
                  </Text>
                  <TouchableOpacity
                    style={s.scannerPermissionButton}
                    activeOpacity={0.85}
                    onPress={requestCameraPermission}
                  >
                    <Text style={s.scannerPermissionButtonText}>
                      {cameraPermission?.status === 'denied' ? 'Volver a pedir permiso' : 'Activar cámara'}
                    </Text>
                  </TouchableOpacity>
                  {cameraPermission?.status === 'denied' ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => Linking.openSettings()}
                      style={s.scannerSettingsLink}
                    >
                      <Text style={s.scannerSettingsLinkText}>Abrir ajustes del dispositivo</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              <View style={s.scannerGuide} pointerEvents="none">
                <View style={s.scannerCornerTopLeft} />
                <View style={s.scannerCornerTopRight} />
                <View style={s.scannerCornerBottomLeft} />
                <View style={s.scannerCornerBottomRight} />
                <View style={s.scannerScanLine} />
              </View>
            </View>

              <View style={s.scannerHintBox}>
                <Text style={s.scannerHint}>
              El lector solo procesa códigos QR. 
              Si estás en un lugar que no dispone de QR, puedes registrar tu visita desde la sección Negocios,
                buscando el establecimiento y presionando el botón "Estoy Aquí".
            </Text>
            </View>
            
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
    backgroundColor: C.bg,
  },

  /* Welcome */
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
  },
  welcomeSub: {
    color: C.muted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  welcomeTitle: {
    color: C.surfaceHigh,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  /* Hero Points Card */
  heroPadding: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  heroCard: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  heroGradient: {
    padding: 22,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  heroBubble: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    right: -40,
    top: -40,
  },
  heroBubbleSmall: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    right: 60,
    bottom: -20,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroPoints: {
    color: C.white,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroPts: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245,166,35,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  heroLevelText: {
    color: C.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: C.gold,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 7,
  },

  /* Quick Actions */
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 4,
    gap: 12,
  },
  quickBtn: {
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  quickIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: C.brandFaint,
    borderWidth: 1,
    borderColor: 'rgba(184,42,94,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    color: C.text,
    fontSize: 11,
    fontWeight: '600',
  },

  /* Section */
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    color: C.surfaceHigh,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    color: C.muted,
    fontSize: 11,
    marginTop: 2,
  },
  sectionLink: {
    color: C.brand,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeaderInline: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  /* Carousel */
  carouselSlide: {
    width: width * 0.9,
    height: 110,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: C.surface,
  },
  carouselImage: {
    ...StyleSheet.absoluteFillObject,
  },
  carouselGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  carouselPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  carouselTitle: {
    color: C.white,
    fontSize: 15,
    fontWeight: '700',
  },
  carouselSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  carouselBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(20,10,30,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.5)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  carouselBadgeText: {
    color: C.gold,
    fontSize: 10,
    fontWeight: '800',
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  carouselIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(184,42,94,0.3)',
  },
  carouselIndicatorDotActive: {
    backgroundColor: C.brand,
    width: 20,
  },

  /* Reward Card */
  rewardCard: {
    width: 140,
    height: 170,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: C.surface,
    padding: 14,
    justifyContent: 'space-between',
  },
  rewardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardTitle: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
    marginTop: 8,
  },
  rewardSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 5,
  },
  rewardBottom: {
    gap: 6,
  },
  rewardPtsPill: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardPtsText: {
    color: C.gold,
    fontSize: 11,
    fontWeight: '800',
  },
  rewardTag: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Referral modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 6, 14, 0.56)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  referralModalCard: {
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 18,
    gap: 16,
  },
  referralModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  referralModalTitle: {
    color: C.surfaceHigh,
    fontSize: 18,
    fontWeight: '900',
  },
  referralModalSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  referralCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
  },
  referralCodeCard: {
    borderRadius: 16,
    backgroundColor: C.brandFaint,
    borderWidth: 1,
    borderColor: 'rgba(184,42,94,0.18)',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  referralCodeLabel: {
    color: C.brand,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  referralCodeValue: {
    color: C.surfaceHigh,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  referralModalHint: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 17,
  },

  /* Scanner modal */
  scannerModalCard: {
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 18,
    gap: 16,
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    position: 'relative',
    paddingRight: 76,
  },
  scannerTitle: {
    color: C.surfaceHigh,
    fontSize: 18,
    fontWeight: '900',
  },
  scannerSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  scannerCloseBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e32828df',
    borderWidth: 1,
    borderColor: 'rgba(61,38,82,0.08)',
  },
  scannerCloseText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  scannerFrame: {
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#120c17',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerGuide: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerCornerTopLeft: {
    position: 'absolute',
    top: 26,
    left: 26,
    width: 34,
    height: 34,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: C.white,
    borderTopLeftRadius: 8,
  },
  scannerCornerTopRight: {
    position: 'absolute',
    top: 26,
    right: 26,
    width: 34,
    height: 34,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: C.white,
    borderTopRightRadius: 8,
  },
  scannerCornerBottomLeft: {
    position: 'absolute',
    bottom: 26,
    left: 26,
    width: 34,
    height: 34,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: C.white,
    borderBottomLeftRadius: 8,
  },
  scannerCornerBottomRight: {
    position: 'absolute',
    bottom: 26,
    right: 26,
    width: 34,
    height: 34,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: C.white,
    borderBottomRightRadius: 8,
  },
  scannerScanLine: {
    position: 'absolute',
    left: 22,
    right: 22,
    height: 2,
    backgroundColor: C.gold,
    opacity: 0.9,
  },
  scannerPermissionBox: {
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  scannerPermissionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  scannerPermissionText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  scannerPermissionButton: {
    backgroundColor: C.brand,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
  },
  scannerPermissionButtonText: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
  },
  scannerSettingsLink: {
    paddingTop: 4,
  },
  scannerSettingsLinkText: {
    color: C.brand,
    fontSize: 12,
    fontWeight: '700',
  },
  scannerHintBox: {    
    paddingHorizontal: 10,
    marginTop: 12,
    backgroundColor: '#b82a5e',
    borderRadius: 5,
    paddingVertical: 10,
  },

  scannerHint: {
    color: C.white,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'justify',
  },

  /* Business Card */
  bizCard: {
    width: width * 0.62,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.surface,
  },
  bizImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bizPointsBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(20,10,30,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bizPointsText: {
    color: C.gold,
    fontSize: 10,
    fontWeight: '800',
  },
  bizInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  bizName: {
    color: C.white,
    fontSize: 15,
    fontWeight: '800',
  },
  bizCatPill: {
    backgroundColor: C.brandFaint,
    borderWidth: 1,
    borderColor: 'rgba(184,42,94,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bizCatText: {
    color: C.brandLight,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bizEarnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 5,
  },
  bizAddress: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    flex: 1,
  },

  /* CTA Banner */
  ctaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    padding: 18,
  },
  ctaIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: C.brandFaint,
    borderWidth: 1,
    borderColor: 'rgba(184,42,94,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    color: C.white,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  ctaSubtitle: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 15,
  },
});