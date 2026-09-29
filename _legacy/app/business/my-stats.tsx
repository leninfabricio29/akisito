import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
function HeaderBusinessComponent({
  title,
  subtitle,
  backButtonProps,
}: {
  title: string;
  subtitle?: string;
  backButtonProps?: { onPress: () => void };
}) {
  return (
    <LinearGradient colors={[C.brand, C.brandDark]} style={s.header}>
      <View style={s.circle1} />
      <View style={s.circle2} />
      <View style={s.headerTop}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={backButtonProps?.onPress}
          disabled={!backButtonProps}
        >
          <Ionicons name="arrow-back" size={20} color={C.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>{title}</Text>
          {subtitle && <Text style={s.headerSub}>{subtitle}</Text>}
        </View>
      </View>
    </LinearGradient>
  );
}

const { width: SW } = Dimensions.get('window');

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
  surfaceBorder: '#ede5ea',
  gold: '#f5a623',
  goldFaint: 'rgba(245,166,35,0.08)',
  goldBorder: 'rgba(245,166,35,0.25)',
  green: '#2da06e',
  greenFaint: 'rgba(45,160,110,0.08)',
  greenBorder: 'rgba(45,160,110,0.22)',
  purple: '#7c3aed',
  blue: '#0891b2',
  white: '#ffffff',
};

// ── Period selector ───────────────────────────────────────
const PERIODS = ['Semana', 'Mes', 'Año'];

// ── Mock data per period ──────────────────────────────────
const DATA = {
  Semana: {
    bars: [
      { label: 'Lun', visits: 14, redeems: 3  },
      { label: 'Mar', visits: 22, redeems: 5  },
      { label: 'Mié', visits: 18, redeems: 4  },
      { label: 'Jue', visits: 30, redeems: 8  },
      { label: 'Vie', visits: 26, redeems: 7  },
      { label: 'Sáb', visits: 38, redeems: 11 },
      { label: 'Dom', visits: 20, redeems: 4  },
    ],
    kpis: { visits: 168, redeems: 42, revenue: '$420', rating: 4.8, newUsers: 28 },
    prevVisits: 140,
    prevRedeems: 35,
    promoBreakdown: [
      { label: 'Cena para dos',      value: 18, color: C.brand  },
      { label: 'Café + Pastel',       value: 14, color: C.gold   },
      { label: 'Almuerzo ejecutivo',  value: 10, color: C.green  },
    ],
    hourly: [6,4,8,14,22,28,32,24,18,12,9,6],
  },
  Mes: {
    bars: [
      { label: 'S1',  visits: 98,  redeems: 24 },
      { label: 'S2',  visits: 124, redeems: 31 },
      { label: 'S3',  visits: 110, redeems: 28 },
      { label: 'S4',  visits: 168, redeems: 42 },
    ],
    kpis: { visits: 500, redeems: 125, revenue: '$1,250', rating: 4.7, newUsers: 89 },
    prevVisits: 420,
    prevRedeems: 98,
    promoBreakdown: [
      { label: 'Cena para dos',      value: 58, color: C.brand  },
      { label: 'Café + Pastel',       value: 42, color: C.gold   },
      { label: 'Almuerzo ejecutivo',  value: 25, color: C.green  },
    ],
    hourly: [20,15,30,52,88,110,128,96,74,48,36,24],
  },
  Año: {
    bars: [
      { label: 'Ene', visits: 310, redeems: 78  },
      { label: 'Feb', visits: 280, redeems: 70  },
      { label: 'Mar', visits: 420, redeems: 105 },
      { label: 'Abr', visits: 390, redeems: 98  },
      { label: 'May', visits: 500, redeems: 125 },
      { label: 'Jun', visits: 460, redeems: 115 },
    ],
    kpis: { visits: 2360, redeems: 591, revenue: '$5,910', rating: 4.8, newUsers: 312 },
    prevVisits: 1980,
    prevRedeems: 495,
    promoBreakdown: [
      { label: 'Cena para dos',      value: 240, color: C.brand  },
      { label: 'Café + Pastel',       value: 198, color: C.gold   },
      { label: 'Almuerzo ejecutivo',  value: 153, color: C.green  },
    ],
    hourly: [95,72,140,240,412,520,600,450,348,225,168,112],
  },
};

type Period = keyof typeof DATA;

// ── Helpers ───────────────────────────────────────────────
function delta(current: number, prev: number) {
  const pct = Math.round(((current - prev) / prev) * 100);
  return { pct, up: pct >= 0 };
}




// ── Bar Chart ─────────────────────────────────────────────
function BarChart({
  data,
  period,
}: {
  data: { label: string; visits: number; redeems: number }[];
  period: Period;
}) {
  const [active, setActive] = useState<number | null>(null);
  const maxVisits  = Math.max(...data.map((d) => d.visits));
  const CHART_H    = 140;
  const BAR_W      = Math.min(28, (SW - 80) / (data.length * 2.2));

  return (
    <View>
      {/* Legend */}
      <View style={bc.legend}>
        <View style={bc.legendItem}>
          <View style={[bc.legendDot, { backgroundColor: C.brand }]} />
          <Text style={bc.legendText}>Visitas</Text>
        </View>
        <View style={bc.legendItem}>
          <View style={[bc.legendDot, { backgroundColor: C.green }]} />
          <Text style={bc.legendText}>Canjes</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={[bc.chartArea, { height: CHART_H + 32 }]}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((pct) => (
          <View
            key={pct}
            style={[bc.gridLine, { bottom: 24 + CHART_H * pct }]}
          >
            <Text style={bc.gridLabel}>
              {Math.round(maxVisits * pct)}
            </Text>
          </View>
        ))}

        {/* Bars */}
        <View style={bc.barsRow}>
          {data.map((d, i) => {
            const vH = Math.max(4, (d.visits  / maxVisits) * CHART_H);
            const rH = Math.max(4, (d.redeems / maxVisits) * CHART_H);
            const isActive = active === i;
            return (
              <TouchableOpacity
                key={i}
                style={bc.barGroup}
                onPress={() => setActive(isActive ? null : i)}
                activeOpacity={0.8}
              >
                {/* Tooltip */}
                {isActive && (
                  <View style={bc.tooltip}>
                    <Text style={bc.tooltipTitle}>{d.label}</Text>
                    <Text style={bc.tooltipLine}>
                      <Text style={{ color: C.brand }}>●</Text> {d.visits} visitas
                    </Text>
                    <Text style={bc.tooltipLine}>
                      <Text style={{ color: C.green }}>●</Text> {d.redeems} canjes
                    </Text>
                  </View>
                )}
                <View style={bc.barPair}>
                  {/* Visits bar */}
                  <View style={[bc.bar, { height: vH, width: BAR_W, backgroundColor: isActive ? C.brand : C.brandLight, opacity: isActive ? 1 : 0.75 }]}>
                    <LinearGradient colors={[C.brand, C.brandDark]} style={StyleSheet.absoluteFill} />
                  </View>
                  {/* Redeems bar */}
                  <View style={[bc.bar, { height: rH, width: BAR_W, backgroundColor: C.green, opacity: isActive ? 1 : 0.65 }]}>
                    <LinearGradient colors={[C.green, '#1a7a52']} style={StyleSheet.absoluteFill} />
                  </View>
                </View>
                <Text style={[bc.barLabel, isActive && bc.barLabelActive]}>{d.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
const bc = StyleSheet.create({
  legend:     { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: C.muted, fontSize: 12, fontWeight: '600' },
  chartArea:  { position: 'relative', paddingLeft: 32 },
  gridLine: {
    position: 'absolute', left: 32, right: 0,
    height: 1, backgroundColor: C.surfaceBorder,
  },
  gridLabel: { position: 'absolute', left: -30, top: -8, color: C.mutedLight, fontSize: 9, fontWeight: '600' },
  barsRow:   { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: '100%', paddingBottom: 24 },
  barGroup:  { alignItems: 'center', flex: 1 },
  barPair:   { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar:       { borderRadius: 6, overflow: 'hidden' },
  barLabel:  { color: C.mutedLight, fontSize: 9, fontWeight: '600', marginTop: 4 },
  barLabelActive: { color: C.brand, fontWeight: '800' },
  tooltip: {
    position: 'absolute', top: -80, zIndex: 99,
    backgroundColor: C.text, borderRadius: 10,
    padding: 8, minWidth: 90,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  tooltipTitle: { color: C.white, fontSize: 11, fontWeight: '800', marginBottom: 3 },
  tooltipLine:  { color: 'rgba(255,255,255,0.8)', fontSize: 10, lineHeight: 15 },
});

// ── Pie Chart (SVG-free using View arcs) ──────────────────
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  const SIZE  = 120;
  const THICK = 22;

  // Build segments as stacked rotation conic using border trick
  let cumulative = 0;
  const segments = data.map((d) => {
    const pct   = d.value / total;
    const deg   = pct * 360;
    const start = cumulative;
    cumulative += deg;
    return { ...d, pct, deg, start };
  });

  return (
    <View style={dc.wrap}>
      {/* Donut using overlapping views with clip */}
      <View style={[dc.donut, { width: SIZE, height: SIZE }]}>
        {/* Background ring */}
        <View style={[dc.ring, { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: THICK, borderColor: C.surfaceBorder }]} />
        {/* Colored segments as stacked arcs — simplified as proportion bars */}
        <View style={[dc.innerHole, { width: SIZE - THICK * 2 - 4, height: SIZE - THICK * 2 - 4, borderRadius: (SIZE - THICK * 2 - 4) / 2 }]}>
          <Text style={dc.centerValue}>{total}</Text>
          <Text style={dc.centerLabel}>total</Text>
        </View>
        {/* Render colored arcs as border segments */}
        {segments.map((seg, i) => (
          <View
            key={i}
            style={[
              dc.arc,
              {
                width: SIZE, height: SIZE, borderRadius: SIZE / 2,
                borderWidth: THICK,
                borderTopColor:    i === 0 ? seg.color : 'transparent',
                borderRightColor:  i === 1 ? seg.color : 'transparent',
                borderBottomColor: i === 2 ? seg.color : 'transparent',
                borderLeftColor:   'transparent',
                transform: [{ rotate: `${seg.start}deg` }],
                opacity: 0.9,
              },
            ]}
          />
        ))}
      </View>

      {/* Legend */}
      <View style={dc.legend}>
        {segments.map((seg) => (
          <View key={seg.label} style={dc.legendRow}>
            <View style={[dc.legendDot, { backgroundColor: seg.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={dc.legendLabel} numberOfLines={1}>{seg.label}</Text>
              <View style={dc.legendBarWrap}>
                <View style={[dc.legendBar, { width: `${seg.pct * 100}%` as any, backgroundColor: seg.color }]} />
              </View>
            </View>
            <View style={dc.legendRight}>
              <Text style={dc.legendVal}>{seg.value}</Text>
              <Text style={dc.legendPct}>{Math.round(seg.pct * 100)}%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const dc = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: 20 },
  donut:   { position: 'relative', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ring:    { position: 'absolute' },
  arc:     { position: 'absolute' },
  innerHole: {
    position: 'absolute', zIndex: 10,
    backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
  },
  centerValue: { color: C.text, fontSize: 18, fontWeight: '900', lineHeight: 20 },
  centerLabel: { color: C.muted, fontSize: 9, fontWeight: '600' },
  legend:   { flex: 1, gap: 10 },
  legendRow:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:{ width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  legendLabel: { color: C.text, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  legendBarWrap: { height: 4, backgroundColor: C.surfaceBorder, borderRadius: 2, overflow: 'hidden' },
  legendBar:     { height: '100%', borderRadius: 2 },
  legendRight:   { alignItems: 'flex-end', gap: 1 },
  legendVal: { color: C.text, fontSize: 12, fontWeight: '800' },
  legendPct: { color: C.muted, fontSize: 10 },
});

// ── Hourly sparkline ──────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const H   = 48;
  const W   = (SW - 80) / data.length;
  const labels = ['8h','9h','10h','11h','12h','13h','14h','15h','16h','17h','18h','19h'];

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: H, gap: 3 }}>
        {data.map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: H }}>
            <View
              style={{
                width: '80%',
                height: Math.max(4, (v / max) * H),
                borderRadius: 4,
                backgroundColor: color,
                opacity: v === max ? 1 : 0.45 + (v / max) * 0.45,
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={[color, color + 'aa']}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {labels.map((l, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', color: C.mutedLight, fontSize: 8, fontWeight: '600' }}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

// ── Comparison row ────────────────────────────────────────
function ComparisonRow({ label, current, prev, color }: {
  label: string; current: number; prev: number; color: string;
}) {
  const { pct, up } = delta(current, prev);
  const maxVal = Math.max(current, prev);

  return (
    <View style={cr.row}>
      <Text style={cr.label}>{label}</Text>
      <View style={cr.bars}>
        {/* Previous */}
        <View style={cr.barWrap}>
          <Text style={cr.barSublabel}>Anterior</Text>
          <View style={cr.track}>
            <View style={[cr.fill, { width: `${(prev / maxVal) * 100}%` as any, backgroundColor: C.mutedLight }]} />
          </View>
          <Text style={cr.barVal}>{prev}</Text>
        </View>
        {/* Current */}
        <View style={cr.barWrap}>
          <Text style={cr.barSublabel}>Actual</Text>
          <View style={cr.track}>
            <View style={[cr.fill, { width: `${(current / maxVal) * 100}%` as any, backgroundColor: color }]} />
          </View>
          <Text style={[cr.barVal, { color }]}>{current}</Text>
        </View>
      </View>
      <View style={[cr.deltaBadge, { backgroundColor: up ? C.greenFaint : C.brandFaint, borderColor: up ? C.greenBorder : C.brandBorder }]}>
        <Ionicons name={up ? 'trending-up' : 'trending-down'} size={12} color={up ? C.green : C.brand} />
        <Text style={[cr.deltaText, { color: up ? C.green : C.brand }]}>
          {up ? '+' : ''}{pct}%
        </Text>
      </View>
    </View>
  );
}
const cr = StyleSheet.create({
  row:          { gap: 8, marginBottom: 16 },
  label:        { color: C.text, fontSize: 13, fontWeight: '800' },
  bars:         { gap: 5 },
  barWrap:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barSublabel:  { color: C.mutedLight, fontSize: 10, width: 48 },
  track:        { flex: 1, height: 6, backgroundColor: C.surfaceBorder, borderRadius: 3, overflow: 'hidden' },
  fill:         { height: '100%', borderRadius: 3 },
  barVal:       { color: C.muted, fontSize: 11, fontWeight: '700', width: 32, textAlign: 'right' },
  deltaBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  deltaText:    { fontSize: 11, fontWeight: '800' },
});

// ── Section card ──────────────────────────────────────────
function SectionCard({ title, subtitle, icon, children }: {
  title: string; subtitle?: string; icon: string; children: React.ReactNode;
}) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.cardIconWrap}>
          <Ionicons name={icon as any} size={15} color={C.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{title}</Text>
          {subtitle && <Text style={s.cardSub}>{subtitle}</Text>}
        </View>
      </View>
      {children}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────
export default function StatsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('Semana');
  const d = DATA[period];
  const visitsDelta  = delta(d.kpis.visits,  d.prevVisits);
  const redeemsDelta = delta(d.kpis.redeems, d.prevRedeems);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}

      <HeaderBusinessComponent
        title="Mis estadísticas"
        subtitle="Analiza el rendimiento de tus negocio"
        backButtonProps={{ onPress: () => router.back() }}
      />

    
  
        {/* Period selector */}
        <View style={s.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.periodPill, period === p && s.periodPillActive]}
              onPress={() => setPeriod(p as Period)}
            >
              <Text style={[s.periodText, period === p && s.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>


      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
       

        {/* ── Bar chart ── */}
       

        {/* ── Comparison ── */}
       

        {/* ── Promo breakdown (donut) ── */}
        <SectionCard
          icon="pie-chart"
          title="Canjes por promoción"
          subtitle="Distribución del período"
        >
          <DonutChart data={d.promoBreakdown} />
        </SectionCard>

        {/* ── Hourly traffic sparkline ── */}
        <SectionCard
          icon="time"
          title="Tráfico por hora"
          subtitle="Promedio de visitas por franja horaria"
        >
          <Sparkline data={d.hourly} color={C.brand} />
          <View style={s.sparkHint}>
            <Ionicons name="information-circle-outline" size={12} color={C.mutedLight} />
            <Text style={s.sparkHintText}>
              Pico de visitas entre las 14h–15h. Ideal para publicar promos a las 13h.
            </Text>
          </View>
        </SectionCard>

       
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    paddingTop: Platform.select({ ios: 56, android: 42, default: 42 }),
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
    gap: 10,
  },
  circle1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -60,
  },
  circle2: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: -20,
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: C.white, fontSize: 18, fontWeight: '900' },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 13 },

  periodRow: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 0 },
  periodPill: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  periodPillActive: { backgroundColor: C.white },
  periodText: { color: '#868585', fontSize: 13, fontWeight: '700' },
  periodTextActive: { color: C.brand },

  scrollContent: { padding: 16, gap: 14 },

  kpiGrid: { gap: 10 },
  kpiRow:  { flexDirection: 'row', gap: 10 },

  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 18 },
  cardIconWrap: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: C.brandFaint, borderWidth: 1, borderColor: C.brandBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
  cardSub:   { color: C.muted, fontSize: 11, marginTop: 1 },

  sparkHint: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 10 },
  sparkHintText: { color: C.mutedLight, fontSize: 11, lineHeight: 16, flex: 1 },

  insightCard: {
    borderRadius: 20, padding: 18, gap: 10,
    borderWidth: 1, borderColor: C.brandBorder,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  insightIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: C.brandFaint, borderWidth: 1, borderColor: C.brandBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  insightTitle: { color: C.brandDark, fontSize: 14, fontWeight: '800' },
  insightBody:  { color: C.textSub, fontSize: 13, lineHeight: 20 },
});