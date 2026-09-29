import { useAuth } from '@/context/auth-context';
import { FavoriteItem, getMyFavoritesRequest, removeFavoriteRequest } from '@/services/favorites-service';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { HeaderModal } from './headerModal';
import {
  Dimensions,
  FlatList,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');
const COLUMNS   = 3;
const GAP       = 8;
const CARD_W    = (SW - 32 - GAP * (COLUMNS - 1)) / COLUMNS;
const CARD_H    = CARD_W * 1.35;

// ── Palette ──────────────────────────────────────────────
const C = {
  brand: '#b82a5e',
  brandLight: '#d4547e',
  brandDark: '#8a1f46',
  brandFaint: 'rgba(184,42,94,0.08)',
  brandBorder: 'rgba(184,42,94,0.18)',
  bg: '#ffffff',
  surfaceGray: '#f7f2f5',
  surfaceBorder: '#ede5ea',
  white: '#ffffff',
  muted: '#9b8492',
  mutedLight: '#c5b5be',
  text: '#1a0f15',
  textSub: '#6b5560',
  gold: '#f5a623',
  goldFaint: 'rgba(245,166,35,0.08)',
  goldBorder: 'rgba(245,166,35,0.25)',
};

// ── Real data ─────────────────────────────────────────────
type Favorite = FavoriteItem & {
  savedCount?: number; // populated dinamically
};

const INITIAL_FAVS: Favorite[] = [];


// ── Image zoom modal ──────────────────────────────────────
function ImageModal({
  fav,
  visible,
  onClose,
}: {
  fav: Favorite | null;
  visible: boolean;
  onClose: () => void;
}) {
  const mainImage = fav?.place_id?.images?.[0];
  const categoryName = typeof fav?.place_id?.category_id === 'object' 
    ? fav?.place_id?.category_id?.name 
    : 'Lugar';

  return (
    <Modal
      visible={visible && !!fav}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={im.overlay}>
          {/* Backdrop blur simulation with dark bg */}
          <View style={im.backdrop} />

          {fav && (
            <TouchableWithoutFeedback>
              <View style={im.content}>
                {/* Image */}
                <View style={im.imgWrap}>
                  <Image
                    source={{ uri: mainImage }}
                    style={im.img}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(26,15,21,0.9)']}
                    style={im.imgGradient}
                  />

                  {/* Close button */}
                  <TouchableOpacity style={im.closeBtn} onPress={onClose}>
                    <Ionicons name="close" size={18} color={C.white} />
                  </TouchableOpacity>
                </View>

                {/* Info panel */}
                <View style={im.info}>
                  <View style={im.categoryPill}>
                    <Text style={im.categoryText}>{categoryName}</Text>
                  </View>
                  <Text style={im.name}>{fav.place_id?.name}</Text>
                  <View style={im.locRow}>
                    <Ionicons name="location" size={13} color={C.brand} />
                    <Text style={im.locText}>{fav.place_id?.address}</Text>
                  </View>
                  

                  
                </View>
              </View>
            </TouchableWithoutFeedback>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const im = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,8,18,0.82)',
  },
  content: {
    width: SW - 32,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: C.white,
  },
  imgWrap: { height: SH * 0.36, position: 'relative' },
  img:     { width: '100%', height: '100%' },
  imgGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  info:         { padding: 18 },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: C.brandFaint, borderWidth: 1, borderColor: C.brandBorder,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 8,
  },
  categoryText: { color: C.brand, fontSize: 10, fontWeight: '700' },
  name:         { color: C.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.3, marginBottom: 6 },
  locRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  locText:      { color: C.textSub, fontSize: 13 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  metaText:     { color: C.muted, fontSize: 12 },
  cta:          { borderRadius: 14, overflow: 'hidden' },
  ctaGradient:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  ctaText:      { color: C.white, fontSize: 14, fontWeight: '800' },
});

// ── Favorite grid card ────────────────────────────────────
function FavCard({
  fav,
  onImagePress,
  onRemove,
}: {
  fav: Favorite;
  onImagePress: (f: Favorite) => void;
  onRemove: (placeId: string) => void;
}) {
  const [removing, setRemoving] = useState(false);
  const mainImage = fav.place_id?.images?.[0];

  const handleRemove = () => {
    setRemoving(true);
    // Small delay so the icon change is visible before removal
    setTimeout(() => onRemove(fav.place_id._id), 250);
  };

  const savedLabel =
    (fav.savedCount || 0) >= 1000
      ? `+${((fav.savedCount || 0) / 1000).toFixed(1)}K`
      : `+${fav.savedCount || 0}`;

  return (
    <View style={fc.card}>
      {/* ── Image (tappable → zoom) ── */}
      <TouchableOpacity
        style={fc.imgWrap}
        activeOpacity={0.9}
        onPress={() => onImagePress(fav)}
      >
        <Image source={{ uri: mainImage }} style={fc.img} contentFit="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(26,15,21,0.75)']}
          style={fc.imgGradient}
        />

        {/* Zoom hint */}
        <View style={fc.zoomHint}>
          <Ionicons name="expand" size={10} color={C.white} />
        </View>
      </TouchableOpacity>

      {/* ── Info below image ── */}
      <View style={fc.info}>
        {/* Name */}
        <Text style={fc.name} numberOfLines={2}>{fav.place_id?.name}</Text>

        {/* Category */}
        <View style={fc.distRow}>
          <Text style={fc.distText}>
            {typeof fav.place_id?.category_id === 'object' 
              ? fav.place_id?.category_id?.name 
              : 'Lugar'}
          </Text>
        </View>

        {/* Social count */}
        
      </View>

      {/* ── Remove button (top-right of card) ── */}
      <TouchableOpacity
        style={fc.removeBtn}
        onPress={handleRemove}
        hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
      >
        <Ionicons
          name={removing ? 'heart-dislike' : 'bookmark'}
          size={13}
          color={removing ? C.muted : C.brand}
        />
      </TouchableOpacity>
    </View>
  );
}

const fc = StyleSheet.create({
  card: {
    width: CARD_W,
    backgroundColor: C.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  imgWrap: { height: CARD_H * 0.62, position: 'relative' },
  img:     { width: '100%', height: '100%' },
  imgGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
  },
  zoomHint: {
    position: 'absolute', bottom: 5, right: 5,
    width: 20, height: 20, borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  info: { padding: 7, gap: 3 },
  name: { color: C.text, fontSize: 10, fontWeight: '800', lineHeight: 13 },
  distRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  distText:  { color: C.muted, fontSize: 9, fontWeight: '600' },
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  socialText:{ color: C.muted, fontSize: 9 },

  removeBtn: {
    position: 'absolute', top: 5, right: 5,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1, borderColor: C.brandBorder,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ── Empty state ───────────────────────────────────────────
function EmptyState() {
  return (
    <View style={es.wrap}>
      <View style={es.iconWrap}>
        <Ionicons name="bookmark-outline" size={40} color={C.mutedLight} />
      </View>
      <Text style={es.title}>Sin favoritos aún</Text>
      <Text style={es.sub}>
        Guarda los lugares que más te gusten y aparecerán aquí para acceder rápido.
      </Text>
    </View>
  );
}
const es = StyleSheet.create({
  wrap:    { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  iconWrap:{ width: 80, height: 80, borderRadius: 24, backgroundColor: C.surfaceGray, borderWidth: 1, borderColor: C.surfaceBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title:   { color: C.text, fontSize: 17, fontWeight: '800', marginBottom: 6 },
  sub:     { color: C.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});

// ── Main screen ───────────────────────────────────────────
type ModalFavoritesProps = {
  visible: boolean;
  onClose: () => void;
};

export default function ModalFavorites({ visible, onClose }: ModalFavoritesProps) {
  const { authToken } = useAuth();
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [zoomed, setZoomed] = useState<Favorite | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && authToken) {
      fetchFavorites();
    }
  }, [visible, authToken]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const favoritesData = await getMyFavoritesRequest(authToken ?? '');
      // Calculate savedCount as total number of unique places
      const enrichedFavs: Favorite[] = favoritesData.map((fav) => ({
        ...fav,
        savedCount: Math.floor(Math.random() * 300) + 10, // Placeholder: random number for demo
      }));
      setFavs(enrichedFavs);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePress = (fav: Favorite) => {
    setZoomed(fav);
    setShowModal(true);
  };

  const handleRemove = async (placeId: string) => {
    try {
      await removeFavoriteRequest(authToken ?? '', placeId);
      setFavs((prev) => prev.filter((f) => f.place_id._id !== placeId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  // FlatList renderItem (3-column grid via numColumns)
  const renderItem = ({ item }: { item: Favorite }) => (
    <FavCard
      fav={item}
      onImagePress={handleImagePress}
      onRemove={handleRemove}
    />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.root}>
        <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
        <HeaderModal
          title="Mis Favoritos"
          subtitle="Los lugares que has guardado para visitar"
          onClose={onClose}
        />

      {/* ── Grid ── */}
        <FlatList
          data={favs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={COLUMNS}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
          ListHeaderComponent={
            favs.length > 0 ? (
              <View style={s.listHeader}>
                <Text style={s.listHeaderText}>
                  Toca una imagen para verla ampliada · toca{' '}
                  <Ionicons name="bookmark" size={11} color={C.brand} /> para quitar
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={<View style={{ height: 40 }} />}
        />

      {/* ── Image zoom modal ── */}
        <ImageModal
          fav={zoomed}
          visible={showModal}
          onClose={() => setShowModal(false)}
        />
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surfaceGray },

  header: {
    paddingTop: Platform.select({ ios: 56, android: 42, default: 42 }),
    paddingBottom: 18,
    paddingHorizontal: 20,
    overflow: 'hidden',
    gap: 14,
  },
  circle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -55,
  },
  circle2: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -35, left: -25,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { alignItems: 'flex-start' },
  headerTitle:  { color: C.white, fontSize: 17, fontWeight: '900' },
  headerSub:    { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 },

  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 14,
    paddingVertical: 10,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryDivider: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.15)' },
  summaryVal:   { color: C.white, fontSize: 15, fontWeight: '900' },
  summaryLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  listContent: { padding: 16 },
  row:         { gap: GAP, marginBottom: GAP },

  listHeader: {
    backgroundColor: C.white,
    borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1, borderColor: C.surfaceBorder,
  },
  listHeaderText: { color: C.muted, fontSize: 11, textAlign: 'center', lineHeight: 16 },
});