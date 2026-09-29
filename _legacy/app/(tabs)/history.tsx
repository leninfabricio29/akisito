import { HeaderFirstComponent } from '@/components/client/header';
import { useAuth } from '@/context/auth-context';
import { RedeemMyPromotionData, getMyExchangesRequest } from '@/services/exchanges-service';
import { VisitItem, getMyVisitsRequest } from '@/services/visits-service';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');


// ── Palette ──────────────────────────────────────────────
const C = {
  brand: '#b82a5e',
  brandLight: '#d4547e',
  brandDark: '#8a1f46',
  brandFaint: 'rgba(184,42,94,0.08)',
  brandBorder: 'rgba(184,42,94,0.18)',
  bg: '#ffffff',
  surface: '#f7f2f5',
  surfaceHigh: '#ede5ea',
  white: '#ffffff',
  muted: '#9b8492',
  mutedLight: '#c5b5be',
  text: '#1a0f15',
  textSub: '#6b5560',
  gold: '#f5a623',
  goldLight: '#fef3dc',
  goldBorder: 'rgba(245,166,35,0.3)',
  green: '#2da06e',
  greenFaint: 'rgba(45,160,110,0.08)',
  greenBorder: 'rgba(45,160,110,0.25)',
  purple: '#7c3aed',
  purpleFaint: 'rgba(124,58,237,0.08)',
};

// ── Real Data ──────────────────────────────────────────────
// Visits are now fetched from getMyVisitsRequest() service


// ── Helpers ───────────────────────────────────────────────
function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= rating ? 'star' : 'star-outline'}
          size={10}
          color={C.gold}
        />
      ))}
    </View>
  );
}

function formatExchangeDateLabel(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatExchangeTimeLabel(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return date.toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatVisitDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';

  return date.toLocaleDateString('es-EC', { month: 'short', day: 'numeric' });
}

function formatVisitTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getStatusLabel(status: RedeemMyPromotionData['status']) {
  if (status === 'validated') return 'Utilizado';
  if (status === 'expired') return 'Expirado';
  if (status === 'pending') return 'Pendiente';
  return 'Activo';
}

function calculateTimeUntilExpires(expiresAt: string): string {
  const now = new Date();
  const expiresDate = new Date(expiresAt);
  const diffMs = expiresDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Ya expiró';
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `Vence en ${minutes}m`;
  }

  if (minutes === 0) {
    return `Vence en ${hours}h`;
  }

  return `Vence en ${hours}h ${minutes}m`;
}

function getExpiresLabel(item: RedeemMyPromotionData) {
  if (item.status === 'validated') {
    return `Utilizado ${formatExchangeDateLabel(item.updatedAt)}`;
  }

  if (item.status === 'expired') {
    return `Expiró ${formatExchangeDateLabel(item.expires_at)}`;
  }

  return calculateTimeUntilExpires(item.expires_at);
}

function getExchangeGradient(status: RedeemMyPromotionData['status']) {
  if (status === 'validated') return ['#92400e', '#d97706'] as const;
  if (status === 'expired') return ['#334155', '#64748b'] as const;
  if (status === 'pending') return ['#0c4a6e', '#0891b2'] as const;
  return [C.brand, C.brandDark] as const;
}

function getExchangeIcon(status: RedeemMyPromotionData['status']): React.ComponentProps<typeof Ionicons>['name'] {
  if (status === 'validated') return 'checkmark-done-circle';
  if (status === 'expired') return 'hourglass-outline';
  if (status === 'pending') return 'ticket-outline';
  return 'gift-outline';
}

function StatusPill({ status, label }: { status: RedeemMyPromotionData['status']; label: string }) {
  const config = {
    validated: { bg: C.surface, border: C.surfaceHigh, color: C.muted, icon: 'checkmark-circle' },
    expired: { bg: 'rgba(220,38,38,0.07)', border: 'rgba(220,38,38,0.2)', color: '#dc2626', icon: 'close-circle' },
    pending: { bg: C.purpleFaint, border: 'rgba(124,58,237,0.2)', color: C.purple, icon: 'time' },
  }[status] ?? { bg: C.surface, border: C.surfaceHigh, color: C.muted, icon: 'ellipse' };

  return (
    <View style={[st.pill, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Ionicons name={config.icon as any} size={11} color={config.color} />
      <Text style={[st.pillText, { color: config.color }]}>{label}</Text>
    </View>
  );
}

// ── Visit Card ────────────────────────────────────────────
function VisitCard({ item }: { item: VisitItem }) {
  const mainImage = item.place_id?.images?.[0];

  return (
    <View style={vc.card}>
      {/* Left image */}
      <View style={vc.imgWrap}>
        {mainImage && (
          <Image source={{ uri: mainImage }} style={vc.img} contentFit="cover" />
        )}
        <View style={[vc.catDot, { backgroundColor: C.green }]} />
      </View>

      {/* Content */}
      <View style={vc.content}>
        <View style={vc.topRow}>
          <Text style={vc.name} numberOfLines={1}>{item.place_id?.name || 'Lugar'}</Text>
          {item.points_awarded && (
            <View style={[vc.pointsBadge]}>
              <Ionicons name="gift" size={10} color={C.goldBorder} />
              <Text style={vc.pointsText}>+15</Text>
            </View>
          )}
        </View>

        <View style={vc.locationRow}>
          <Ionicons name="location" size={11} color={C.brand} />
          <Text style={vc.locationText} numberOfLines={1}>{item.place_id?.address || 'Dirección'}</Text>
        </View>

        <View style={vc.bottomRow}>
          <View style={vc.dateChip}>
            <Text style={vc.dateText}>{formatVisitDate(item.createdAt)} · {formatVisitTime(item.createdAt)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Redeem Card ───────────────────────────────────────────
function RedeemCard({ item }: { item: RedeemMyPromotionData }) {
  const isActive = item.status === 'validated';

  return (
    <View style={[rc.card, isActive && rc.cardActive]}>
      {/* Gradient strip */}
      <LinearGradient
        colors={getExchangeGradient(item.status)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={rc.strip}
      >
        <Ionicons name={getExchangeIcon(item.status)} size={30} color={C.white} />
      </LinearGradient>

      {/* Content */}
      <View style={rc.content}>
        <View style={rc.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={rc.title}>{item.promotion_id?.title || 'Promoción'}</Text>
            <Text style={rc.business}>{item.business_id?.business_name || 'Negocio'}</Text>
          </View>
          <StatusPill status={item.status} label={getStatusLabel(item.status)} />
        </View>

        {/* Code */}
        <View style={[rc.codeRow, isActive && rc.codeRowActive]}>
          <Text style={[rc.codeLabel, isActive && rc.codeLabelActive]}>
            {item.redemption_code}
          </Text>
        </View>

        {/* Meta row */}
        <View style={rc.metaRow}>
          <View style={rc.metaItem}>
            <Ionicons name="star" size={11} color={C.gold} />
            <Text style={rc.metaText}>{item.points_spent} pts canjeados</Text>
          </View>
          <View style={rc.metaDot} />
          <View style={rc.metaItem}>
            <Ionicons
              name={isActive ? 'hourglass-outline' : 'calendar-outline'}
              size={11}
              color={C.muted}
            />
            <Text style={rc.metaText}>{getExpiresLabel(item)}</Text>
          </View>
          <View style={rc.metaDot} />
          <View style={rc.metaItem}>
            <Ionicons name="time-outline" size={11} color={C.muted} />
            <Text style={rc.metaText}>{formatExchangeDateLabel(item.createdAt)} · {formatExchangeTimeLabel(item.createdAt)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Summary Stats ─────────────────────────────────────────
function VisitStats({ visits }: { visits: VisitItem[] }) {
  const placesCount = visits.length;
  const visitsWithPoints = visits.filter(v => v.points_awarded).length;
  const totalPointsGained = visitsWithPoints * 15; // 15 puntos por visita
  return (
    <View style={ss.row}>
      {[
        { icon: 'location', label: 'Lugares', value: placesCount, color: C.brand },
        { icon: 'star', label: 'Puntos ganados', value: totalPointsGained, color: C.gold },
        { icon: 'time', label: 'Total', value: placesCount, color: C.green },
      ].map((stat, i) => (
        <View key={i} style={[ss.item, i < 2 && ss.itemBorder]}>
          <View style={[ss.iconWrap, { backgroundColor: stat.color + '15' }]}>
            <Ionicons name={stat.icon as any} size={16} color={stat.color} />
          </View>
          <Text style={ss.value}>{stat.value}</Text>
          <Text style={ss.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

function RedeemStats({ exchanges }: { exchanges: RedeemMyPromotionData[] }) {
  const totalPts = exchanges.reduce((sum, item) => sum + item.points_spent, 0);
  const active = exchanges.filter((r) => r.status === 'pending').length;
  return (
    <View style={ss.row}>
      {[
        { icon: 'gift', label: 'Canjeados', value: exchanges.length, color: C.brand },
        { icon: 'star', label: 'Pts usados', value: totalPts, color: C.gold },
        { icon: 'radio-button-on', label: 'Pendientes', value: active, color: C.brandDark },
      ].map((stat, i) => (
        <View key={i} style={[ss.item, i < 2 && ss.itemBorder]}>
          <View style={[ss.iconWrap, { backgroundColor: stat.color + '15' }]}>
            <Ionicons name={stat.icon as any} size={16} color={stat.color} />
          </View>
          <Text style={ss.value}>{stat.value}</Text>
          <Text style={ss.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────
export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState(0); // 0 = visits, 1 = redeems
  const indicatorX = useSharedValue(0);
  const PILL_W = (width - 40) / 2;
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [exchanges, setExchanges] = useState<RedeemMyPromotionData[]>([]);

    const { authToken } = useAuth();

  const handleTab = (idx: number) => {
    setActiveTab(idx);
    indicatorX.value = withSpring(idx * PILL_W, { damping: 18, stiffness: 180 });
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));


  useEffect(() => {
    if (!authToken) return;
    fetchVisits();
    fetchExchanges();
  }, [authToken]);

  // Refrescar datos cada vez que la pantalla gana el foco
  useFocusEffect(
    useCallback(() => {
      if (!authToken) return;
      fetchVisits();
      fetchExchanges();
    }, [authToken])
  );

  const fetchVisits = async () => {
    try {
      const visitsData = await getMyVisitsRequest(authToken ?? '');
      setVisits(visitsData);
    } catch (error) {
      console.error('Error fetching visits:', error);
    }
  };

  const fetchExchanges = async () => {
    try {
      const exchangesData = await getMyExchangesRequest(authToken?? '');
      setExchanges(exchangesData);
    } catch (error) {
      console.error('Error fetching exchanges:', error);
    }
  };


  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}

        <HeaderFirstComponent title="Historial" subtitle="Tus visitas y canjes recientes" />
     

      {/* ── Segmented Control ── */}
      <View style={s.segmentWrap}>
        <View style={s.segmentTrack}>
          {/* Sliding indicator */}
          <Animated.View style={[s.segmentIndicator, { width: PILL_W }, indicatorStyle]} />

          {/* Tabs */}
          {['Visitas', 'Canjes'].map((label, i) => {
            const active = activeTab === i;
            return (
              <TouchableOpacity
                key={label}
                style={[s.segmentTab, { width: PILL_W }]}
                onPress={() => handleTab(i)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={i === 0 ? 'location' : 'gift'}
                  size={14}
                  color={active ? C.white : C.muted}
                  style={{ marginRight: 5 }}
                />
                <Text style={[s.segmentText, active && s.segmentTextActive]}>
                  {label}
                </Text>
                <View style={[s.segmentCount, active && s.segmentCountActive]}>
                  <Text style={[s.segmentCountText, active && s.segmentCountTextActive]}>
                    {i === 0 ? visits.length : exchanges.length}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        key={activeTab} // remount on tab change for fresh scroll
      >
        {/* Stats summary */}
        <View style={s.statsCard}>
          {activeTab === 0 ? <VisitStats visits={visits} /> : <RedeemStats exchanges={exchanges} />}
        </View> 

        {/* Section label */}
        <Text style={s.sectionLabel}>
          {activeTab === 0
            ? `${visits.length} lugares visitados`
            : `${exchanges.length} promociones canjeadas`}
        </Text>

        {/* List */}
        {activeTab === 0
          ? visits.map((item) => <VisitCard key={item._id} item={item} />)
          : exchanges.map((item) => <RedeemCard key={item._id} item={item} />)}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    paddingTop: Platform.select({ ios: 60, android: 44, default: 44 }),
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: { color: C.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { color: C.muted, fontSize: 13, marginTop: 2 },

  /* Segment */
  segmentWrap: { paddingHorizontal: 20, marginBottom: 20 },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 4,
    position: 'relative',
    borderWidth: 1,
    borderColor: C.surfaceHigh,
  },
  segmentIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: C.brand,
    borderRadius: 12,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  segmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    zIndex: 1,
  },
  segmentText: { color: C.muted, fontSize: 14, fontWeight: '700' },
  segmentTextActive: { color: C.white },
  segmentCount: {
    marginLeft: 6,
    backgroundColor: C.surfaceHigh,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  segmentCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  segmentCountText: { color: C.muted, fontSize: 11, fontWeight: '700' },
  segmentCountTextActive: { color: C.white },

  /* Stats */
  statsCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.surfaceHigh,
    overflow: 'hidden',
  },

  sectionLabel: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
});

// ── Stats Styles ──────────────────────────────────────────
const ss = StyleSheet.create({
  row: { flexDirection: 'row' },
  item: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 5 },
  itemBorder: { borderRightWidth: 1, borderRightColor: C.surfaceHigh },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: { color: C.text, fontSize: 20, fontWeight: '900' },
  label: { color: C.muted, fontSize: 11, fontWeight: '600', textAlign: 'center' },
});

// ── Visit Card Styles ─────────────────────────────────────
const vc = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.surfaceHigh,
    shadowColor: '#1a0f15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imgWrap: { position: 'relative' },
  img: { width: 90, height: 110 },
  catDot: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: C.white,
  },
  content: { flex: 1, padding: 12, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  name: { flex: 1, color: C.text, fontSize: 14, fontWeight: '800', lineHeight: 18 },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(180, 102, 13, 0.1)',
    borderWidth: 1,
    borderColor: C.goldBorder,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pointsText: { color: '#92610a', fontSize: 11, fontWeight: '800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  locationText: { color: C.textSub, fontSize: 12, flex: 1 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: C.surface,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timeText: { color: C.muted, fontSize: 10, fontWeight: '600' },
  dateChip: {},
  dateText: { color: C.mutedLight, fontSize: 10 },
});

// ── Redeem Card Styles ────────────────────────────────────
const rc = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.surfaceHigh,
    shadowColor: '#1a0f15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardActive: {
    borderColor: C.brandBorder,
    shadowColor: C.brand,
    shadowOpacity: 0.1,
  },
  strip: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 30 },
  content: { flex: 1, padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  title: { color: C.text, fontSize: 15, fontWeight: '800', lineHeight: 19 },
  business: { color: C.muted, fontSize: 12, marginTop: 2 },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.surfaceHigh,
  },
  codeRowActive: {
    backgroundColor: C.brandFaint,
    borderColor: C.brandBorder,
    borderStyle: 'dashed',
  },
  codeLabel: {
    color: C.muted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  codeLabelActive: { color: C.brand },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: { color: C.brand, fontSize: 12, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: C.muted, fontSize: 11 },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.mutedLight },
});

// ── Status Pill Styles ────────────────────────────────────
const st = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontSize: 11, fontWeight: '700' },
});