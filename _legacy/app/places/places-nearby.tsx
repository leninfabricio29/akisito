import { HeaderFirstComponent } from '@/components/client/header';
import { listPlacesRequest, PlaceItem } from '@/services/place-service';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import MapScreen, { Place } from '@/components/maps/map';

const C = {
  brand: '#b82a5e',
  brandDark: '#8a1f46',
  bg: '#ffffff',
  surface: '#f7f2f5',
  border: 'rgba(184,42,94,0.18)',
  text: '#1a0f15',
  textSub: '#6b5560',
  muted: '#9b8492',
  white: '#ffffff',
};

const FALLBACK_ORIGIN = {
  latitude: -3.99313,
  longitude: -79.20422,
  name: 'Loja (referencia)',
};

const PAGE_SIZE = 50;
const NEARBY_RADIUS_KM = 5;

function normalizeCategory(category?: string): string {
  if (!category) {
    return 'general';
  }

  const value = category
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (value.includes('resta')) return 'restaurante';
  if (value.includes('cafe')) return 'restaurante';
  if (value.includes('hotel')) return 'bienestar';
  if (value.includes('tour')) return 'aventura';
  if (value.includes('spa')) return 'bienestar';
  if (value.includes('bar')) return 'diversion';
  if (value.includes('parque')) return 'parques';
  if (value.includes('natur')) return 'naturaleza';
  if (value.includes('cult')) return 'cultura';
  return value;
}

function toMapPlace(item: PlaceItem): Place | null {
  const coordinates = item.location?.coordinates;
  if (!coordinates || coordinates.length !== 2) {
    return null;
  }

  const [longitude, latitude] = coordinates;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const categoryName = typeof item.category_id === 'string' ? undefined : item.category_id?.name;

  return {
    id: item._id,
    name: item.name,
    latitude,
    longitude,
    category: normalizeCategory(categoryName),
  };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earth = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earth * c;
}

export default function PlacesNearScreen() {
  const router = useRouter();
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);
  const [origin, setOrigin] = useState(FALLBACK_ORIGIN);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [viewMode, setViewMode] = useState<'nearby' | 'all'>('all');

  useEffect(() => {
    let mounted = true;

    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!mounted) {
          return;
        }

        setOrigin({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: 'Tu ubicación',
        });
      } catch {
        // Keep fallback origin if location request fails.
      } finally {
        if (mounted) {
          setIsLoadingLocation(false);
        }
      }
    };

    loadLocation();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadPlaces = async () => {
      setIsLoadingPlaces(true);
      try {
        const firstPage = await listPlacesRequest({ page: 1, limit: PAGE_SIZE });
        let items = firstPage.items;
        const totalPages = firstPage.pagination.totalPages || 1;

        if (totalPages > 1) {
          const pageRequests: Promise<Awaited<ReturnType<typeof listPlacesRequest>>>[] = [];
          for (let page = 2; page <= totalPages; page += 1) {
            pageRequests.push(listPlacesRequest({ page, limit: PAGE_SIZE }));
          }

          const pages = await Promise.all(pageRequests);
          items = items.concat(...pages.map((pageData) => pageData.items));
        }

        if (!mounted) {
          return;
        }

        const mapped = items
          .map(toMapPlace)
          .filter((item): item is Place => item !== null);

        setAllPlaces(mapped);
      } catch {
        if (mounted) {
          setAllPlaces([]);
        }
      } finally {
        if (mounted) {
          setIsLoadingPlaces(false);
        }
      }
    };

    loadPlaces();

    return () => {
      mounted = false;
    };
  }, []);

  const visiblePlaces = useMemo(() => {
    if (viewMode === 'all') {
      return allPlaces;
    }

    return allPlaces.filter((place) => {
      const distance = haversineKm(origin.latitude, origin.longitude, place.latitude, place.longitude);
      return distance <= NEARBY_RADIUS_KM;
    });
  }, [allPlaces, origin.latitude, origin.longitude, viewMode]);

  if (isLoadingLocation || isLoadingPlaces) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color={C.brand} />
        <Text style={s.loaderText}>{isLoadingLocation ? 'Obteniendo tu ubicación...' : 'Cargando puntos del mapa...'}</Text>
      </View>
    );
  }

  return (
      <View style={s.root}>

      
        <HeaderFirstComponent title='Lugares cerca de ti'
            subtitle='Explora los puntos de interés a tu alrededor'
            backButtonProps={{ onPress: () => router.back() }}
        />
      <View style={s.mapWrap}>
        <MapScreen
          origin={origin}
          places={visiblePlaces}
          onPressGoPlace={(place) => router.push(`/places/place?id=${place.id}` as never)}
        />
      </View>

      <View style={s.controlsWrap}>
        <Text style={s.controlTitle}>Vista</Text>
        <View style={s.radiusRow}>
          <TouchableOpacity
            style={[s.radiusChip, viewMode === 'all' && s.radiusChipActive]}
            onPress={() => setViewMode('all')}
          >
            <Text style={[s.radiusChipText, viewMode === 'all' && s.radiusChipTextActive]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.radiusChip, viewMode === 'nearby' && s.radiusChipActive]}
            onPress={() => setViewMode('nearby')}
          >
            <Text style={[s.radiusChipText, viewMode === 'nearby' && s.radiusChipTextActive]}>Cercanos</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.infoText}>
          {viewMode === 'all'
            ? `${visiblePlaces.length} puntos cargados desde /places`
            : `${visiblePlaces.length} lugares dentro de ${NEARBY_RADIUS_KM} km`}
        </Text>

      </View>

      </View>
  );
}

const s = StyleSheet.create({

      root: { flex: 1, backgroundColor: C.bg },

  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    gap: 10,
  },
  loaderText: {
    color: C.textSub,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 8, android: 14, default: 10 }),
    paddingBottom: 10,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
  },
  title: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 2,
  },
  allPlacesBtn: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.brand,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  allPlacesText: {
    color: C.brand,
    fontSize: 12,
    fontWeight: '700',
  },
  mapWrap: {
    flex: 1,
  },
  controlsWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
  },
  controlTitle: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  radiusChip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: C.white,
  },
  radiusChipActive: {
    backgroundColor: C.brandDark,
    borderColor: C.brandDark,
  },
  radiusChipDisabled: {
    opacity: 0.45,
  },
  radiusChipText: {
    color: C.textSub,
    fontSize: 12,
    fontWeight: '700',
  },
  radiusChipTextActive: {
    color: C.white,
  },
  categoryList: {
    gap: 8,
  },
  categoryChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  categoryChipText: {
    color: C.textSub,
    fontSize: 11,
    fontWeight: '600',
  },
  infoText: {
    color: C.textSub,
    fontSize: 12,
    marginTop: 2,
  },
});
