import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { HeaderHomeComponent } from '@/components/business/headerHome';
import { getMyPlacesRequest } from '@/services/place-service';
import { useAuth } from '../../context/auth-context';

// ── Palette ──────────────────────────────────────────────
const C = {
  brand: '#b82a5e',
  brandLight: '#d4547e',
  brandDark: '#8a1f46',
  brandFaint: 'rgba(184,42,94,0.08)',
  brandBorder: 'rgba(184,42,94,0.18)',
  bg: '#f7f2f5',
  card: '#ffffff',
  text: '#1a0f15',
  textSub: '#6b5560',
  muted: '#9b8492',
  mutedLight: '#c5b5be',
  border: 'rgba(184,42,94,0.12)',
  gold: '#f5a623',
  goldFaint: 'rgba(245,166,35,0.08)',
  goldBorder: 'rgba(245,166,35,0.25)',
  green: '#2da06e',
  greenFaint: 'rgba(45,160,110,0.08)',
  greenBorder: 'rgba(45,160,110,0.22)',
  white: '#ffffff',
  indigo: '#fe9e7b',
  indigoFaint: 'rgba(254,158,123,0.08)',
  indigoBorder: 'rgba(254,158,123,0.22)',
};

// ── Mock data ─────────────────────────────────────────────
const STATS = [
  { label: 'Canjes hoy',    value: '8',    delta: '+3',  up: true,  icon: 'gift',         color: C.brand  },
  { label: 'Visitas',       value: '124',  delta: '+12', up: true,  icon: 'eye',          color: C.green  },
  { label: 'Reseñas',       value: '4.8',  delta: '+0.2',up: true,  icon: 'star',         color: C.gold   },
  { label: 'Promos activas',value: '3',    delta: '0',   up: null,  icon: 'pricetag',     color: C.indigo },  
];

const QUICK_ACTIONS = [
  { label: 'Nueva promo',  icon: 'add-circle',    route: '/business/my-promos', accent: C.brand, bg: C.brandFaint, border: C.brandBorder },
  { label: 'Mi negocio',   icon: 'storefront',    route: '/business/my-business',    accent: C.green, bg: C.greenFaint, border: C.greenBorder },
  { label: 'Canjes',       icon: 'gift',          route: '/business/my-exchanges', accent: C.gold,  bg: C.goldFaint,  border: C.goldBorder  },
  { label: 'Mi cuenta',    icon: 'person-circle', route: '/(tabs)/profile',    accent: C.indigo, bg: C.indigoFaint, border: C.indigoBorder },
];



// ── Components ────────────────────────────────────────────
function StatCard({ stat }: { stat: typeof STATS[0] }) {
  return (
    <View style={sc.card}>
      <View style={[sc.iconWrap, { backgroundColor: stat.color + '14' }]}>
        <Ionicons name={stat.icon as any} size={18} color={stat.color} />
      </View>
      <Text style={sc.value}>{stat.value}</Text>
      <Text style={sc.label}>{stat.label}</Text>
     
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 14,
    alignItems: 'flex-start',
    gap: 4,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  value:  { color: C.text,    fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  label:  { color: C.muted,   fontSize: 11, fontWeight: '600' },
  delta:  { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 2 },
  deltaText: { fontSize: 10, fontWeight: '700' },
});

function QuickCard({ item }: { item: typeof QUICK_ACTIONS[0] }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[qc.card, { borderColor: item.border, backgroundColor: C.card }]}
      activeOpacity={0.82}
      onPress={() => router.push(item.route as never)}
    >
      <View style={[qc.iconWrap, { backgroundColor: item.bg, borderColor: item.border }]}>
        <Ionicons name={item.icon as any} size={24} color={item.accent} />
      </View>
      <Text style={qc.label}>{item.label}</Text>
    </TouchableOpacity>
  );
}

const qc = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: { color: C.text, fontSize: 13, fontWeight: '700', textAlign: 'center' },
});


const pb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  emoji: { fontSize: 28, width: 36, textAlign: 'center' },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  title: { color: C.text, fontSize: 13, fontWeight: '700', flex: 1 },
  ptsBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.goldFaint, borderWidth: 1, borderColor: C.goldBorder, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  ptsText: { color: '#92610a', fontSize: 10, fontWeight: '800' },
  track: { height: 5, backgroundColor: C.bg, borderRadius: 3, overflow: 'hidden', marginBottom: 5 },
  fill:  { height: '100%', borderRadius: 3 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  uses: { color: C.muted, fontSize: 11 },
  daysBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  daysText: { color: C.muted, fontSize: 11 },
});

// ── Main Screen ───────────────────────────────────────────
export default function HomeBusinessScreen() {
  const router = useRouter();
  const { session, authToken } = useAuth();
  const [isCheckingPlace, setIsCheckingPlace] = useState(true);

  useEffect(() => {
    const validateBusinessPlace = async () => {
      if (!session || session.role !== 'Negocio' || !authToken) {
        setIsCheckingPlace(false);
        return;
      }

      try {
        const places = await getMyPlacesRequest(authToken);
        if (places.length === 0) {
          router.replace('/business/my-business?setup=1');
          return;
        }
      } catch {
        // Si falla la validacion remota, evitamos bloquear la pantalla.
      } finally {
        setIsCheckingPlace(false);
      }
    };

    validateBusinessPlace();
  }, [authToken, router, session]);

  const todayDate = new Date().toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  if (isCheckingPlace) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center', gap: 10 }]}>
        <ActivityIndicator size="large" color={C.brand} />
        <Text style={{ color: C.textSub, fontSize: 13 }}>Validando tu negocio...</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
              <HeaderHomeComponent />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Stats row ── *
        <View style={s.statsSection}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Resumen de hoy</Text>
            <TouchableOpacity style={s.seeAllBtn}
            onPress={() => router.push('/business/my-stats' as never)}
            >
              <Text style={s.seeAllText}>Ver métricas</Text>
              <Ionicons name="arrow-forward" size={12} color={C.brand} />
            </TouchableOpacity>
          </View>
          <View style={s.statsRow}>
            {STATS.slice(0, 2).map((stat) => <StatCard key={stat.label} stat={stat} />)}
          </View>
          <View style={[s.statsRow, { marginTop: 10 }]}>
            {STATS.slice(2, 4).map((stat) => <StatCard key={stat.label} stat={stat} />)}
          </View>
        </View>
        */}

        {/* ── Quick Actions ── */}
        <View style={s.statsSection}>
             <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Accesos rápidos</Text>
           
          </View>
            

          
          <View style={s.quickGrid}>
            {QUICK_ACTIONS.map((item) => (
              <QuickCard key={item.label} item={item} />
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 20 },

  /* Header */
  header: {
    paddingTop: Platform.select({ ios: 60, android: 44, default: 44 }),
    paddingHorizontal: 20,
    overflow: 'hidden',
    gap: 6,
  },
  circle1: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -80, right: -70,
  },
  circle2: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bizBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  bizBadgeText: { color: C.white, fontSize: 11, fontWeight: '700' },
  notifBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.gold,
    borderWidth: 1.5, borderColor: C.brand,
  },
  businessName: {
    color: C.white, fontSize: 28, fontWeight: '900',
    letterSpacing: -0.5, lineHeight: 32,
  },
  dateText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2, marginBottom: 16 },

  heroCtas: { flexDirection: 'row', gap: 10, marginTop: 4 },
  ctaPrimary: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 11, borderRadius: 14,
  },
  ctaPrimaryText: { color: C.white, fontSize: 14, fontWeight: '700' },
  ctaSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16, paddingVertical: 11, borderRadius: 14,
  },
  ctaSecondaryText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },

  /* Sections */
  statsSection: { paddingHorizontal: 20, paddingTop: 24, marginBottom: 4 },
  section:      { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:  { color: C.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  seeAllBtn:     { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.brandFaint, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: C.brandBorder },
  seeAllText:    { color: C.brand, fontSize: 12, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 10 },

  /* Quick grid */
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  /* Card shell */
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 0 },

  /* Redeems */
  redeemRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  avatarCircle:{
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.brandFaint, borderWidth: 1, borderColor: C.brandBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 20 },
  redeemUser:  { color: C.text, fontSize: 13, fontWeight: '700' },
  redeemPromo: { color: C.muted, fontSize: 12, marginTop: 2 },
  ptsBadge:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.goldFaint, borderWidth: 1, borderColor: C.goldBorder, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  ptsText:     { color: '#92610a', fontSize: 10, fontWeight: '800' },
  redeemTime:  { color: C.mutedLight, fontSize: 11 },

  /* Tips */
  tipsCard: {
    borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: C.brandBorder,
    gap: 10,
  },
  tipsHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipsIconWrap:{ width: 36, height: 36, borderRadius: 11, backgroundColor: C.brandFaint, borderWidth: 1, borderColor: C.brandBorder, alignItems: 'center', justifyContent: 'center' },
  tipsTitle:   { color: C.brandDark, fontSize: 14, fontWeight: '800' },
  tipBody:     { color: C.textSub, fontSize: 13, lineHeight: 20 },
  tipCta:      { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  tipCtaText:  { color: C.brand, fontSize: 13, fontWeight: '700' },
});