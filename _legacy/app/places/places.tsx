import { HeaderFirstComponent } from '@/components/client/header';
import { useAuth } from '@/context/auth-context';
import {
  addFavoriteRequest,
  listFavoritesRequest,
  listPlacesRequest,
  PlaceItem,
  removeFavoriteRequest,
} from '@/services/place-service';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type SortKey = 'distance' | 'rating' | 'recent';

const C = {
  brand: '#b82a5e',
  brandDark: '#8a1f46',
  brandFaint: 'rgba(184,42,94,0.08)',
  brandBorder: 'rgba(184,42,94,0.18)',
  bg: '#ffffff',
  surface: '#f7f2f5',
  surfaceBorder: '#ede5ea',
  text: '#1a0f15',
  textSub: '#6b5560',
  muted: '#9b8492',
  mutedLight: '#c5b5be',
  white: '#ffffff',
  gold: '#f5a623',
};

const PAGE_LIMIT = 10;



const getCategoryName = (place: PlaceItem): string => {
  if (typeof place.category_id === 'string') {
    return 'General';
  }
  return place.category_id?.name || 'General';
};

const getBusinessName = (place: PlaceItem): string => {
  if (typeof place.business_id === 'string') {
    return '';
  }

  if (!place.business_id) {
    return '';
  }

  if (place.business_id.business_name) {
    return place.business_id.business_name;
  }

  const first = place.business_id.first_name || '';
  const last = place.business_id.last_name || '';
  return `${first} ${last}`.trim();
};

function PlaceCard({
  item,
  saved,
  onPressDetail,
}: {
  item: PlaceItem;
  saved: boolean;
  onToggleFavorite: (placeId: string) => void;
  onPressDetail: (placeId: string) => void;
}) {
  const categoryName = getCategoryName(item);
  const image = item.images?.[0] || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80';

  return (
    <View style={s.card}>
      <View style={s.rightCol}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => onPressDetail(item._id)}>
                  <Text style={s.name} numberOfLines={1}>{item.name}</Text>

          <View style={s.imageWrap}>
            <Image source={{ uri: image }} style={s.image} contentFit="cover" />
          </View>
        </TouchableOpacity>

        
      </View>
      <View style={s.info}>
        <View style={s.categoryBadge}>
          <Text style={s.categoryBadgeText}>{categoryName}</Text>
        </View>


        <View style={s.row}>
          <Ionicons name="location-outline" size={13} color={C.brand} />
          <Text style={s.location} numberOfLines={1}>{item.address}</Text>
        </View>
        <TouchableOpacity style={s.moreBtn} activeOpacity={0.82} onPress={() => onPressDetail(item._id)}>
          <Ionicons name="chevron-forward" size={18} color={C.white} />
        </TouchableOpacity>
      </View>

      
    </View>
  );
}

export default function PlacesScreen() {
  const router = useRouter();
  const { authToken, session } = useAuth();

  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('recent');

  const isClient = session?.role === 'Usuario';

  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    places.forEach((item) => {
      if (typeof item.category_id !== 'string' && item.category_id) {
        map.set(item.category_id._id, item.category_id.name);
      }
    });

    return [{ id: 'all', name: 'Todo' }, ...Array.from(map.entries()).map(([id, name]) => ({ id, name }))];
  }, [places]);

  const filteredPlaces = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    let items = places.filter((item) => {
      const bySearch = !searchValue
        || item.name.toLowerCase().includes(searchValue)
        || item.address.toLowerCase().includes(searchValue)
        || item.description.toLowerCase().includes(searchValue);

      const byCategory = activeCategory === 'all'
        || (typeof item.category_id !== 'string' && item.category_id._id === activeCategory);

      return bySearch && byCategory;
    });

    if (sortBy === 'recent') {
      items = items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    if (sortBy === 'rating') {
      items = items.sort((a, b) => b.images.length - a.images.length);
    }

    if (sortBy === 'distance') {
      items = items.sort((a, b) => a.address.localeCompare(b.address));
    }

    return items;
  }, [activeCategory, places, search, sortBy]);

  const loadFavorites = useCallback(async () => {
    if (!authToken || !isClient) {
      return;
    }

    try {
      const favorites = await listFavoritesRequest(authToken);
      const ids = favorites
        .map((item) => (typeof item.place_id === 'string' ? item.place_id : item.place_id._id))
        .filter(Boolean);
      setFavoriteIds(new Set(ids));
    } catch {
      setFavoriteIds(new Set());
    }
  }, [authToken, isClient]);

  const loadPlaces = useCallback(
    async (targetPage: number, mode: 'replace' | 'append') => {
      const response = await listPlacesRequest({
        page: targetPage,
        limit: PAGE_LIMIT,
      });

      setTotalPages(response.pagination.totalPages || 1);
      setPage(response.pagination.page || targetPage);

      if (mode === 'replace') {
        setPlaces(response.items);
        return;
      }

      setPlaces((prev) => {
        const next = [...prev, ...response.items];
        const unique = new Map(next.map((item) => [item._id, item]));
        return Array.from(unique.values());
      });
    },
    [],
  );

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      try {
        await Promise.all([loadPlaces(1, 'replace'), loadFavorites()]);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [loadFavorites, loadPlaces]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadPlaces(1, 'replace'), loadFavorites()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || page >= totalPages) {
      return;
    }

    setIsLoadingMore(true);
    try {
      await loadPlaces(page + 1, 'append');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleToggleFavorite = async (placeId: string) => {
    if (!authToken || !isClient) {
      return;
    }

    const isSaved = favoriteIds.has(placeId);

    try {
      if (isSaved) {
        await removeFavoriteRequest(authToken, placeId);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(placeId);
          return next;
        });
        return;
      }

      await addFavoriteRequest(authToken, placeId);
      setFavoriteIds((prev) => new Set(prev).add(placeId));
    } catch {
      // La UI mantiene el estado actual si falla la API.
    }
  };

  const handleOpenDetail = (placeId: string) => {
    router.push(`/places/place?id=${placeId}` as never);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      <HeaderFirstComponent
        title="Lugares a visitar"
        subtitle="Explora nuevos lugares y acumula puntos"
        backButtonProps={{ onPress: () => router.back() }}
      />

      <View style={s.searchWrap}>
        <Ionicons name="search" size={16} color={C.mutedLight} />
        <TextInput
          style={s.searchInput}
          placeholder="Buscar por nombre, dirección o descripción"
          placeholderTextColor={C.mutedLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={s.categoriesWrap}>
        <FlatList
          data={categoryOptions}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.categoriesList}
          renderItem={({ item }) => {
            const active = item.id === activeCategory;
            return (
              <TouchableOpacity
                style={[s.catChip, active && s.catChipActive]}
                onPress={() => setActiveCategory(item.id)}
              >
                <Text style={[s.catChipText, active && s.catChipTextActive]}>  {item.name} ({filteredPlaces.length})</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

    

      {isLoading ? (
        <View style={s.loaderWrap}>
          <ActivityIndicator size="large" color={C.brand} />
          <Text style={s.loaderText}>Cargando lugares...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPlaces}
          keyExtractor={(item) => item._id}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <PlaceCard
              item={item}
              saved={favoriteIds.has(item._id)}
              onToggleFavorite={handleToggleFavorite}
              onPressDetail={handleOpenDetail}
            />
          )}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Ionicons name="location-outline" size={34} color={C.mutedLight} />
              <Text style={s.emptyTitle}>No encontramos lugares</Text>
              <Text style={s.emptyText}>Prueba con otra búsqueda o quita filtros.</Text>
            </View>
          }
          ListFooterComponent={
            page < totalPages ? (
              <TouchableOpacity
                style={s.loadMoreBtn}
                onPress={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <ActivityIndicator size="small" color={C.brand} />
                ) : (
                  <>
                    <Text style={s.loadMoreText}>Cargar más</Text>
                    <Ionicons name="chevron-down" size={16} color={C.brand} />
                  </>
                )}
              </TouchableOpacity>
            ) : <View style={{ height: 24 }} />
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  searchWrap: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    backgroundColor: C.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 14 },
  categoriesWrap: { minHeight: 54 },
  categoriesList: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },
  catChipActive: {
    backgroundColor: C.brand,
    borderColor: C.brand,
  },
  catChipText: { color: C.textSub, fontSize: 12, fontWeight: '600' },
  catChipTextActive: { color: C.white },
  sortBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.surfaceBorder,
    backgroundColor: C.white,
    gap: 8,
  },
  countText: { color: C.muted, fontSize: 12 },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.brandBorder,
    backgroundColor: C.brandFaint,
  },
  sortChipActive: { backgroundColor: C.brand, borderColor: C.brand },
  sortChipText: { color: C.brand, fontSize: 11, fontWeight: '700' },
  sortChipTextActive: { color: C.white },
  listContent: { padding: 16, paddingBottom: 24 },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(184,42,94,0.10)',
    borderRadius: 8,
    backgroundColor: C.white,
    marginBottom: 16,
    shadowColor: '#b82a5e',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    minHeight: 150,
  },

  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },

  rightCol: {
    width: 132,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  imageWrap: {
    width: 120,
    height: 120,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: C.surface,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  categoryBadge: {
    backgroundColor: C.brandFaint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(184,42,94,0.14)',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },

  categoryBadgeText: {
    color: '#b82a5e',
    fontSize: 10,
    fontWeight: '800',
  },

  name: {
    color: C.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 22,
  },

row: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 5,
},

  location: {
    color: C.textSub,
    fontSize: 10,
    flex: 1,},

meta: {
  color: '#b82a5e',
  fontSize: 12,
  fontWeight: '700',
},

  moreBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.brand,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

loaderWrap: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  gap: 10,
},

loaderText: {
  color: C.textSub,
  fontSize: 13,
},

emptyWrap: {
  alignItems: 'center',
  paddingTop: 48,
  gap: 8,
},

emptyTitle: {
  color: C.text,
  fontSize: 16,
  fontWeight: '800',
},

emptyText: {
  color: C.muted,
  fontSize: 12,
},

loadMoreBtn: {
  marginTop: 10,
  alignSelf: 'center',

  borderRadius: 30,

  paddingHorizontal: 16,
  paddingVertical: 11,

  borderWidth: 1,
  borderColor: 'rgba(184,42,94,0.14)',

  backgroundColor: '#fff',

  flexDirection: 'row',
  gap: 5,
  alignItems: 'center',
},

loadMoreText: {
  color: '#b82a5e',
  fontWeight: '800',
  fontSize: 12,
},
});
