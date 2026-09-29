import AlertComponent from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { useAlert } from '@/hooks/use-alert';
import {
    addFavoriteRequest,
    createReviewRequest,
    createVisitRequest,
    getPlaceByIdRequest,
    listFavoritesRequest,
    listPlaceReviewsRequest,
    PlaceItem,
    removeFavoriteRequest,
    ReviewItem,
} from '@/services/place-service';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = {
  brand: '#b82a5e',
  brandDark: '#8a1f46',
  brandFaint: 'rgba(184,42,94,0.08)',
  brandBorder: 'rgba(184,42,94,0.2)',
  bg: '#ffffff',
  surface: '#f7f2f5',
  surfaceBorder: '#ede5ea',
  white: '#ffffff',
  muted: '#9b8492',
  mutedLight: '#c5b5be',
  text: '#1a0f15',
  textSub: '#6b5560',
  gold: '#f5a623',
};

const REVIEW_LIMIT = 10;
const VISIT_RADIUS_METERS = 300;

type LocalReview = {
  id: string;
  author: string;
  rating: number;
  dateText: string;
  text: string;
};

function toCategoryName(place: PlaceItem | null): string {
  if (!place) {
    return 'General';
  }

  if (typeof place.category_id === 'string') {
    return 'General';
  }

  return place.category_id?.name || 'General';
}

function reviewAuthor(review: ReviewItem): string {
  if (typeof review.client_id === 'string') {
    return 'Usuario';
  }

  const first = review.client_id.first_name || '';
  const last = review.client_id.last_name || '';
  return `${first} ${last}`.trim() || 'Usuario';
}

function toRelativeDate(dateValue?: string): string {
  if (!dateValue) {
    return 'hoy';
  }

  const created = new Date(dateValue).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return 'hoy';
  }

  if (diffDays === 1) {
    return 'hace 1 día';
  }

  if (diffDays < 30) {
    return `hace ${diffDays} días`;
  }

  const months = Math.floor(diffDays / 30);
  if (months === 1) {
    return 'hace 1 mes';
  }

  return `hace ${months} meses`;
}

function toLocalReview(review: ReviewItem): LocalReview {
  return {
    id: review._id,
    author: reviewAuthor(review),
    rating: review.rating,
    dateText: toRelativeDate(review.createdAt),
    text: review.comment || 'Sin comentario',
  };
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earth = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earth * c;
}

function toWhatsAppNumber(rawPhone?: string): string {
  if (!rawPhone) {
    return '';
  }

  return rawPhone.replace(/[^\d]/g, '');
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => onChange(s)}>
          <Ionicons name={s <= value ? 'star' : 'star-outline'} size={27} color={s <= value ? C.gold : C.mutedLight} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: LocalReview }) {
  return (
    <View style={s.reviewCard}>
      <View style={s.reviewHeader}>
        <Text style={s.reviewAuthor}>{review.author}</Text>
        <Text style={s.reviewDate}>{review.dateText}</Text>
      </View>
      <View style={s.reviewStars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons key={star} name={star <= review.rating ? 'star' : 'star-outline'} size={12} color={C.gold} />
        ))}
      </View>
      <Text style={s.reviewText}>{review.text}</Text>
    </View>
  );
}

export default function PlaceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { authToken, session } = useAuth();

  const placeId = id || '';
  const isClient = session?.role === 'Usuario';

  const [place, setPlace] = useState<PlaceItem | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [saved, setSaved] = useState(false);

  const [reviews, setReviews] = useState<LocalReview[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isRegisteringVisit, setIsRegisteringVisit] = useState(false);
  const [showModalProgress, setShowModalProgress] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [visitedHere, setVisitedHere] = useState(false);
  const { visibleConfig, config, hide, success, error , info} = useAlert();
  const isReviewSubmitDisabled = !visitedHere || isSubmittingReview;

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return 0;
    }
    const total = reviews.reduce((acc, item) => acc + item.rating, 0);
    return Number((total / reviews.length).toFixed(1));
  }, [reviews]);

  const loadPlace = useCallback(async () => {
    if (!placeId) {
      return;
    }

    const data = await getPlaceByIdRequest(placeId);
    setPlace(data);
  }, [placeId]);

  const loadReviews = useCallback(
    async (targetPage: number, mode: 'replace' | 'append') => {
      if (!placeId) {
        return;
      }

      const response = await listPlaceReviewsRequest(placeId, targetPage, REVIEW_LIMIT);
      const mapped = response.items.map(toLocalReview);

      setReviewPage(response.pagination.page || targetPage);
      setReviewTotalPages(response.pagination.totalPages || 1);

      if (mode === 'replace') {
        setReviews(mapped);
        return;
      }

      setReviews((prev) => [...prev, ...mapped]);
    },
    [placeId],
  );

  const loadFavoriteState = useCallback(async () => {
    if (!authToken || !isClient || !placeId) {
      return;
    }

    try {
      const favorites = await listFavoritesRequest(authToken);
      const exists = favorites.some((item) => {
        const favoritePlaceId = typeof item.place_id === 'string' ? item.place_id : item.place_id._id;
        return favoritePlaceId === placeId;
      });
      setSaved(exists);
    } catch {
      setSaved(false);
    }
  }, [authToken, isClient, placeId]);

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      try {
        await Promise.all([loadPlace(), loadReviews(1, 'replace'), loadFavoriteState()]);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [loadFavoriteState, loadPlace, loadReviews]);

  const handleToggleFavorite = async () => {
    if (!authToken || !isClient || !placeId) {
      error('Inicia sesión', 'Debes iniciar sesión como cliente para usar favoritos.');
      return;
    }

    if (isTogglingFavorite) {
      return;
    }

    const wasSaved = saved;
    setIsTogglingFavorite(true);
    setSaved(!wasSaved);
    try {
      if (wasSaved) {
        await removeFavoriteRequest(authToken, placeId);
        info('Favorito eliminado', 'El lugar fue eliminado de tus favoritos.');
      } else {
        await addFavoriteRequest(authToken, placeId);
        success('Favorito agregado', 'El lugar fue agregado a tus favoritos.');
      }
    } catch (errorApi) {
      setSaved(wasSaved);
      error('Favoritos', errorApi instanceof Error ? errorApi.message : 'No se pudo actualizar favoritos.');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const validateNearby = async (): Promise<boolean> => {
    if (!place) {
      return false;
    }

    const [lng, lat] = place.location.coordinates;

    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permiso requerido', 'Debes permitir ubicación para validar que estás en el lugar.');
      return false;
    }

    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const distance = haversineMeters(current.coords.latitude, current.coords.longitude, lat, lng);

    if (distance > VISIT_RADIUS_METERS) {
      Alert.alert(
        'Fuera de rango',
        `Debes estar dentro de ${VISIT_RADIUS_METERS} metros para registrar visita o reseña. Distancia actual aproximada: ${Math.round(distance)} m.`,
      );
      return false;
    }

    return true;
  };

  const handleVisit = async () => {
    if (!authToken || !isClient || !placeId) {
      error('Inicia sesión', 'Debes iniciar sesión como cliente para registrar tu visita.');
      return;
    }

    setShowModalProgress(true);
    setIsRegisteringVisit(true);
    try {
      const allowed = await validateNearby();
      if (!allowed) {
        return;
      }

      await createVisitRequest(authToken, placeId);
      setVisitedHere(true);
      success('Visita registrada', 'Tu visita fue registrada correctamente. Ahora ya puedes dejar tu reseña.');
    } catch (errorApi) {
      error('No se pudo registrar', errorApi instanceof Error ? errorApi.message : 'Inténtalo nuevamente.');
    } finally {
      setIsRegisteringVisit(false);
      setShowModalProgress(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!authToken || !isClient || !placeId) {
      error('Inicia sesión', 'Debes iniciar sesión como cliente para dejar una reseña.');
      return;
    }

    if (!visitedHere) {
      error('Primero confirma visita', 'Pulsa “Estoy aquí” para validar ubicación y registrar visita antes de reseñar.');
      return;
    }

    if (reviewRating === 0 || reviewText.trim().length < 10) {
      error('Reseña incompleta', 'Califica el lugar y escribe al menos 10 caracteres.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const allowed = await validateNearby();
      if (!allowed) {
        return;
      }

      await createReviewRequest(authToken, {
        place_id: placeId,
        rating: reviewRating,
        comment: reviewText.trim(),
      });

      setReviewText('');
      setReviewRating(0);
      await loadReviews(1, 'replace');
      success('Operación exitosa', 'Gracias por compartir tu experiencia.');
    } catch (errorApi) {
      error('Error', errorApi instanceof Error ? errorApi.message : 'Inténtalo nuevamente.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const loadMoreReviews = async () => {
    if (isLoadingMoreReviews || reviewPage >= reviewTotalPages) {
      return;
    }

    setIsLoadingMoreReviews(true);
    try {
      await loadReviews(reviewPage + 1, 'append');
    } finally {
      setIsLoadingMoreReviews(false);
    }
  };

  const previewReviews = reviews.slice(0, 3);

  const handleCall = async () => {
    if (!place?.phone) {
      error('No disponible', 'Este lugar no tiene teléfono registrado.');
      return;
    }

    const url = `tel:${place.phone}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      error('No disponible', 'No se pudo abrir la app de llamadas.');
      return;
    }

    await Linking.openURL(url);
  };

  const handleWhatsApp = async () => {
    const number = toWhatsAppNumber(place?.phone);
    if (!number) {
      error('No disponible', 'Este lugar no tiene número para WhatsApp.');
      return;
    }

    const message = encodeURIComponent(`Hola, vi tu lugar en Winner y me gustaría más información sobre ${place?.name ?? 'su negocio'}.`);
    const whatsappUrl = `https://wa.me/${number}?text=${message}`;
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (!canOpen) {
      error('No disponible', 'No se pudo abrir WhatsApp en este dispositivo.');
      return;
    }

    await Linking.openURL(whatsappUrl);
  };

  const handleDirections = async () => {
    if (!place) {
      return;
    }

    const [destinationLng, destinationLat] = place.location.coordinates;

    let mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}&travelmode=driving`;

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${current.coords.latitude},${current.coords.longitude}&destination=${destinationLat},${destinationLng}&travelmode=driving`;
      }
    } catch {
      // Si no hay permiso o falla geolocalizacion, Google Maps usa ubicacion actual al abrir.
    }

    const canOpen = await Linking.canOpenURL(mapsUrl);
    if (!canOpen) {
      error('No disponible', 'No se pudo abrir Google Maps.');
      return;
    }

    await Linking.openURL(mapsUrl);
  };

  if (isLoading) {
    return (
      <View style={s.loaderRoot}>
        <ActivityIndicator size="large" color={C.brand} />
        <Text style={s.loaderText}>Cargando lugar...</Text>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={s.loaderRoot}>
        <Text style={s.errorTitle}>Lugar no encontrado</Text>
        <TouchableOpacity style={s.backBtnPlain} onPress={() => router.back()}>
          <Text style={s.backBtnPlainText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const category = toCategoryName(place);
  const images = place.images.length > 0
    ? place.images
    : ['https://images.unsplash.com/photo-1552566626-52f8b828add9?w=900&q=80'];
  const selectedImage = images[activeImage] || images[0];

  return (
    <View style={s.root}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: C.brand }} />
      <StatusBar barStyle="light-content" />

      <View style={s.heroWrap}>
        <Image source={{ uri: selectedImage }} style={s.heroImage} contentFit="cover" />
        <View style={s.heroActions}>
          <TouchableOpacity style={s.heroBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={C.white} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.heroBtn, isTogglingFavorite && s.heroBtnDisabled]} onPress={handleToggleFavorite} disabled={isTogglingFavorite}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={C.white} />
          </TouchableOpacity>
        </View>

        <View style={s.thumbStrip}>
          {images.map((img, idx) => (
            <TouchableOpacity key={`${img}-${idx}`} onPress={() => setActiveImage(idx)}>
              <Image source={{ uri: img }} style={[s.thumb, idx === activeImage && s.thumbActive]} contentFit="cover" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        <View style={s.categoryPill}>
          <Text style={s.categoryText}>{category}</Text>
        </View>

        <Text style={s.name}>{place.name}</Text>

        <View style={s.row}>
          <Ionicons name="location-outline" size={14} color={C.brand} />
          <Text style={s.rowText}>{place.address}</Text>
        </View>

        <View style={s.row}>
          <Ionicons name="star" size={14} color={C.gold} />
          <Text style={s.rowText}>{averageRating > 0 ? `${averageRating} (${reviews.length} reseñas)` : 'Sin reseñas aún'}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Acerca del lugar</Text>
          <Text style={s.description}>{place.description}</Text>

          <View style={s.quickIconRow}>
            <TouchableOpacity style={s.quickIconBtn} onPress={handleCall}>
              <Ionicons name="call-outline" size={18} color={C.brand} />
            </TouchableOpacity>

            <TouchableOpacity style={s.quickIconBtn} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={18} color={C.brand} />
            </TouchableOpacity>

            <TouchableOpacity style={s.quickIconBtn} onPress={handleDirections}>
              <Ionicons name="navigate-outline" size={18} color={C.brand} />
            </TouchableOpacity>
          </View>

          {place.schedule ? (
            <View style={s.row}>
              <Ionicons name="time-outline" size={14} color={C.muted} />
              <Text style={s.rowText}>{place.schedule}</Text>
            </View>
          ) : null}
        </View>

        {isClient ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>Escribe una reseña</Text>
            <Text style={s.cardSub}>Primero confirma que estás cerca del lugar con “Estoy aquí”.</Text>

            <StarPicker value={reviewRating} onChange={setReviewRating} />

            <TextInput
              style={s.input}
              placeholder="¿Qué te pareció este lugar?"
              placeholderTextColor={C.mutedLight}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[s.submitBtn, isReviewSubmitDisabled && s.submitBtnDisabled]}
              onPress={handleSubmitReview}
              disabled={isReviewSubmitDisabled}
            >
              {isSubmittingReview ? <ActivityIndicator size="small" color={C.white} /> : null}
              <Text style={s.submitBtnText}>Publicar reseña</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={s.reviewsSection}>
          <View style={s.reviewsHead}>
            <Text style={s.cardTitle}>Reseñas</Text>
            <TouchableOpacity style={s.linkBtn} onPress={() => setShowAllReviews(true)}>
              <Text style={s.linkBtnText}>Ver todas</Text>
              <Ionicons name="chevron-forward" size={14} color={C.brand} />
            </TouchableOpacity>
          </View>

          {previewReviews.length === 0 ? (
            <Text style={s.noReviews}>Aún no hay reseñas para este lugar.</Text>
          ) : (
            previewReviews.map((review) => <ReviewCard key={review.id} review={review} />)
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={s.fabWrap}>
        <TouchableOpacity style={[s.fab, isRegisteringVisit && s.fabDisabled]} onPress={handleVisit} disabled={isRegisteringVisit}>
          <Ionicons name="radio-button-on" size={18} color={C.white} />
          <Text style={s.fabText}>Estoy aquí</Text>
        </TouchableOpacity>
      </View>

      <Modal 
      visible={showModalProgress}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModalProgress(false)}
      >

        <View style={s.modalProgressRoot}>
          <View style={s.modalProgressContent}>
            <ActivityIndicator size="large" color={C.brand} />
            
            <Text style={s.modalProgressText}>Validando ubicación...</Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAllReviews}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={() => setShowAllReviews(false)}
      >
        <View style={s.modalRoot}>
          <View style={s.modalHeader}>
            <View>
              <Text style={s.modalTitle}>Todas las reseñas</Text>
              <Text style={s.modalSub}>{place.name}</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={() => setShowAllReviews(false)}>
              <Ionicons name="close" size={20} color={C.textSub} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={reviews}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ReviewCard review={item} />}
            contentContainerStyle={s.modalList}
            ListFooterComponent={
              reviewPage < reviewTotalPages ? (
                <TouchableOpacity style={s.loadMoreBtn} onPress={loadMoreReviews} disabled={isLoadingMoreReviews}>
                  {isLoadingMoreReviews ? <ActivityIndicator size="small" color={C.brand} /> : null}
                  <Text style={s.loadMoreText}>Cargar más reseñas</Text>
                </TouchableOpacity>
              ) : <View style={{ height: 18 }} />
            }
          />
        </View>
      </Modal>
          <AlertComponent visible={visibleConfig} config={config} onDismiss={hide} />
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: C.white }} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loaderRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loaderText: { color: C.textSub, fontSize: 13 },
  errorTitle: { color: C.text, fontSize: 16, fontWeight: '800' },
  backBtnPlain: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: C.brandFaint,
    borderWidth: 1,
    borderColor: C.brandBorder,
  },
  backBtnPlainText: { color: C.brand, fontWeight: '700' },
  heroWrap: { height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroActions: {
    position: 'absolute',
    top: Platform.select({ ios: 52, android: 36, default: 36 }),
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnDisabled: { opacity: 0.6 },
  thumbStrip: { position: 'absolute', bottom: 14, right: 14, flexDirection: 'row', gap: 7 },
  thumb: {
    width: 48,
    height: 34,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.65,
  },
  thumbActive: { borderColor: C.white, opacity: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: C.brandFaint,
    borderWidth: 1,
    borderColor: C.brandBorder,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  categoryText: { color: C.brand, fontSize: 11, fontWeight: '700' },
  name: { color: C.text, fontSize: 24, fontWeight: '800', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  rowText: { color: C.textSub, fontSize: 13, flex: 1 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    backgroundColor: C.surface,
    padding: 16,
    marginTop: 14,
  },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 5 },
  cardSub: { color: C.muted, fontSize: 12, marginBottom: 12 },
  description: { color: C.textSub, fontSize: 14, lineHeight: 21, marginBottom: 10 },
  quickIconRow: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 12 },
  quickIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.brandFaint,
    borderWidth: 1,
    borderColor: C.brandBorder,
  },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    borderRadius: 12,
    minHeight: 100,
    backgroundColor: C.white,
    padding: 12,
    color: C.text,
    fontSize: 14,
    marginBottom: 12,
  },
  submitBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: C.white, fontWeight: '800', fontSize: 14 },
  reviewsSection: { marginTop: 16 },
  reviewsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkBtnText: { color: C.brand, fontWeight: '700', fontSize: 13 },
  noReviews: { color: C.muted, fontSize: 12 },
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    backgroundColor: C.surface,
    padding: 12,
    marginBottom: 10,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor: { color: C.text, fontSize: 13, fontWeight: '700' },
  reviewDate: { color: C.muted, fontSize: 11 },
  reviewStars: { flexDirection: 'row', gap: 2, marginTop: 5, marginBottom: 8 },
  reviewText: { color: C.textSub, fontSize: 13, lineHeight: 19 },
  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.select({ ios: 20, android: 105, default: 16 }),
    alignItems: 'center',
  },
  fab: {
    borderRadius: 30,
    backgroundColor: C.brandDark,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  fabDisabled: { opacity: 0.75 },
  fabText: { color: C.white, fontWeight: '800', fontSize: 15 },
  modalRoot: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 58, android: 16, default: 16 }),
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: C.surfaceBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { color: C.text, fontSize: 17, fontWeight: '800' },
  modalSub: { color: C.muted, fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
  },
  modalList: { padding: 16, paddingBottom: 24 },
  loadMoreBtn: {
    alignSelf: 'center',
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.brandBorder,
    backgroundColor: C.brandFaint,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadMoreText: { color: C.brand, fontWeight: '700' },

  modalProgressRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalProgressContent: {
    backgroundColor: C.white,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  modalProgressText: { color: C.text, fontSize: 14, fontWeight: '500' },
});
