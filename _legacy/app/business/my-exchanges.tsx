import { HeaderBusinessComponent } from '@/components/business/header';
import { useAuth } from '@/context/auth-context';
import { RedemptionItem, getBusinessRedemptionsRequest, validateRedemptionCodeRequest } from '@/services/modules/redemptions';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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


// ── Palette ──────────────────────────────────────────────
const C = {
  brand: '#b82a5e',
  brandLight: '#d4547e',
  brandDark: '#8a1f46',
  brandFaint: 'rgba(184,42,94,0.07)',
  brandBorder: 'rgba(184,42,94,0.2)',
  borderLight: 'rgba(184,42,94,0.1)',
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
  greenBorder: 'rgba(45,160,110,0.25)',
  red: '#e53e3e',
  redFaint: 'rgba(229,62,62,0.07)',
  redBorder: 'rgba(229,62,62,0.22)',
  white: '#ffffff',
};

// ── Types ─────────────────────────────────────────────────
type RedeemStatus = 'pending' | 'validated' | 'expired' | 'rejected';

interface Redeem {
  id: string;
  code: string;
  user: string;
  avatar: string;
  promo: string;
  emoji: string;
  pts: number;
  redeemedAt: string;
  expiresAt: string;
  status: RedeemStatus;
  rawData: RedemptionItem;
}

const STATUS_CONFIG: Record<RedeemStatus, {
  label: string; icon: string;
  bg: string; border: string; color: string;
}> = {
  pending:   { label: 'Pendiente',  icon: 'hourglass-outline',   bg: C.goldFaint,   border: C.goldBorder,   color: C.gold  },
  validated: { label: 'Validado',   icon: 'checkmark-circle',    bg: C.greenFaint,  border: C.greenBorder,  color: C.green },
  rejected:  { label: 'Rechazado',  icon: 'close-circle',        bg: C.redFaint,    border: C.redBorder,    color: C.red   },
  expired:   { label: 'Expirado',   icon: 'close-circle',        bg: C.redFaint,    border: C.redBorder,    color: C.red   },
};

const FILTERS = [
  { id: 'all',       label: 'Todos'      },
  { id: 'pending',   label: 'Pendientes' },
  { id: 'validated', label: 'Validados'  },
  { id: 'expired',   label: 'Expirados'  },
];

// ── Status Pill ───────────────────────────────────────────
function StatusPill({ status }: { status: RedeemStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[sp.pill, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
      <Text style={[sp.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}
const sp = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  text: { fontSize: 11, fontWeight: '700' },
});

// ── Redeem Card ───────────────────────────────────────────
function RedeemCard({
  item,
  onOpenValidator,
}: {
  item: Redeem;
  onOpenValidator: (redemptionCode: string) => void;
}) {
  const isPending = item.status === 'pending';
  const isDisabled = !isPending;

  return (
    <TouchableOpacity 
      style={[
        rc.card, 
        isPending && rc.cardPending,
        isDisabled && rc.cardDisabled
      ]}
      activeOpacity={isPending ? 0.7 : 1}
      onPress={isPending ? () => onOpenValidator(item.code) : undefined}
      disabled={isDisabled}
    >
      {isPending && <View style={rc.accentBar} />}

      {/* Top row */}
      <View style={rc.topRow}>
        {/* Avatar + user */}
        
        <View style={{ flex: 1 }}>
          <Text style={rc.userName}>{item.user}</Text>
          <Text style={rc.promoName}> <Ionicons name='gift-outline' size={14} color="#bbab1a" /> {item.promo}</Text>
        </View>
        <StatusPill status={item.status} />
      </View>

      {/* Points badge */}
      <View style={{ marginBottom: 10 }}>
        <View style={rc.ptsBadge}>
          <Ionicons name="star" size={10} color={C.gold} />
          <Text style={rc.ptsText}>{item.pts} pts</Text>
        </View>
      </View>

      {/* Time info */}
      <View style={rc.timeRow}>
        <View style={rc.timeItem}>
          <Ionicons name="time-outline" size={11} color={C.muted} />
          <Text style={rc.timeText}>Canjeado {item.redeemedAt}</Text>
        </View>
        <View style={rc.timeDot} />
        <View style={rc.timeItem}>
          <Ionicons
            name={item.status === 'pending' ? 'hourglass-outline' : 'calendar-outline'}
            size={11}
            color={C.muted}
          />
          <Text style={rc.timeText}>{item.expiresAt}</Text>
        </View>
      </View>

      {/* Helper text for pending/validated */}
      {isPending && (
        <View style={rc.helperBox}>
          <Ionicons name="information-circle" size={14} color={C.brand} />
          <Text style={rc.helperText}>Presiona para validar el código</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const rc = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    overflow: 'hidden',
    shadowColor: '#1a0f15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardPending: {
    borderColor: C.brandBorder,
    shadowColor: C.brand,
    shadowOpacity: 0.08,
  },
  cardDisabled: {
    opacity: 0.7,
  },
  accentBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
    backgroundColor: C.brand,
    borderTopLeftRadius: 18, borderBottomLeftRadius: 18,
  },

  topRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatarWrap:{
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.brandFaint, borderWidth: 1, borderColor: C.brandBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 20 },
  userName:  { color: C.text, fontSize: 13, fontWeight: '800' },
  promoName: { color: C.muted, fontSize: 12, marginTop: 2 },

  midRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  codeWrap:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: C.surfaceBorder },
  codeWrapActive: { backgroundColor: C.brandFaint, borderColor: C.brandBorder, borderStyle: 'dashed' },
  code:       { color: C.muted,  fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  codeActive: { color: C.brand },
  ptsBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.goldFaint, borderWidth: 1, borderColor: C.goldBorder, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  ptsText:    { color: '#92610a', fontSize: 11, fontWeight: '800' },

  timeRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  timeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { color: C.muted, fontSize: 11 },
  timeDot:  { width: 3, height: 3, borderRadius: 2, backgroundColor: C.mutedLight },

  cardClickable: { cursor: 'pointer' },
  helperBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.brandFaint, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.brandBorder, marginTop: 10 },
  helperText: { color: C.brand, fontSize: 11, fontWeight: '600', flex: 1 },

  actionsRow:  { flexDirection: 'row', gap: 10 },
  confirmBtn:  { flex: 1, borderRadius: 12, overflow: 'hidden' },
  confirmGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11 },
  confirmText: { color: C.white, fontSize: 13, fontWeight: '800' },
  rejectBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, backgroundColor: C.redFaint, borderWidth: 1, borderColor: C.redBorder },
  rejectText:  { color: C.red, fontSize: 13, fontWeight: '700' },
});

// ── Scanner Modal ─────────────────────────────────────────
function ScannerModal({
  visible,
  onClose,
  onValidate,
  token,
}: {
  visible: boolean;
  onClose: () => void;
  onValidate: (redemption: RedemptionItem) => void;
  token: string | null;
}) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<'valid' | 'invalid' | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setCode('');
      setResult(null);
    }
  }, [visible]);

  const handleValidate = async () => {
    if (!token) {
      Alert.alert('Error', 'No estás autenticado');
      return;
    }

    setIsValidating(true);
    try {
      const response = await validateRedemptionCodeRequest(token, code.trim().toUpperCase());
      if (response.valid && response.redemption) {
        // Validación exitosa - pasar el objeto validado directamente
        onValidate(response.redemption);
        setCode('');
        setResult(null);
        onClose();
      } else {
        // Validación fallida - mostrar resultado
        setResult('invalid');
      }
    } catch (error) {
      setResult('invalid');
      Alert.alert('Error', 'No se pudo validar el código');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setResult(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent >
      <View style={sm.overlay}>
        <View style={sm.sheet}>
          <View style={sm.handle} />

          {/* Header */}
          <View style={sm.header}>
            <Text style={sm.title}>Verificar canje</Text>
            <TouchableOpacity style={sm.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={18} color={C.muted} />
            </TouchableOpacity>
          </View>

        
          {/* Manual input */}
          <View style={sm.inputSection}>
            <Text style={sm.inputLabel}>Código de canje</Text>
            <View style={[sm.inputWrap, result === 'valid' && sm.inputValid, result === 'invalid' && sm.inputInvalid]}>
              <Ionicons name="ticket-outline" size={17} color={result === 'valid' ? C.green : result === 'invalid' ? C.red : C.brand} style={{ marginRight: 10 }} />
              <TextInput
                style={sm.input}
                placeholder="Ingresa el código"
                placeholderTextColor={C.mutedLight}
                value={code}
                onChangeText={(v) => { setCode(v.toUpperCase()); setResult(null); }}
                autoCapitalize="characters"
                maxLength={10}
                editable={!isValidating}
              />
              {result === 'valid' && <Ionicons name="checkmark-circle" size={18} color={C.green} />}
              {result === 'invalid' && <Ionicons name="close-circle" size={18} color={C.red} />}
              {isValidating && <ActivityIndicator color={C.brand} />}
            </View>

            {/* Result feedback */}
            {result === 'valid' && (
              <View style={sm.resultValid}>
                <Ionicons name="checkmark-circle" size={16} color={C.green} />
                <Text style={sm.resultValidText}>Código validado correctamente.</Text>
              </View>
            )}
            {result === 'invalid' && (
              <View style={sm.resultInvalid}>
                <Ionicons name="alert-circle" size={16} color={C.red} />
                <Text style={sm.resultInvalidText}>Código no encontrado o ya utilizado.</Text>
              </View>
            )}
          </View>

          {/* Buttons */}
          <View style={sm.btns}>
            <TouchableOpacity
              style={[sm.validateBtn, (!code.trim() || isValidating) && sm.validateBtnDisabled]}
              onPress={handleValidate}
              disabled={!code.trim() || isValidating}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[C.brand, C.brandDark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={sm.validateGradient}
              >
                <Ionicons name="search" size={16} color={C.white} />
                <Text style={sm.validateText}>{isValidating ? 'Validando...' : 'Verificar código'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const sm = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: C.white, borderRadius: 24, overflow: 'hidden', maxWidth: 340, width: '85%', maxHeight: '80%' },
  handle: { width: 40, height: 4, backgroundColor: C.surfaceBorder, borderRadius: 2, alignSelf: 'center', marginTop: 14, marginBottom: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 0 },
  title: { color: C.text, fontSize: 18, fontWeight: '900' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },

  qrBox: { margin: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.brandBorder },
  qrInner: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  qrText: { color: C.brandDark, fontSize: 15, fontWeight: '800' },
  qrSub:  { color: C.muted, fontSize: 12 },

  inputSection: { paddingHorizontal: 20, marginBottom: 16 },
  inputLabel:   { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.brandBorder,
    paddingHorizontal: 14, height: 54,
  },
  inputValid:   { borderColor: C.green },
  inputInvalid: { borderColor: C.red },
  input: { flex: 1, color: C.text, fontSize: 17, fontWeight: '800', letterSpacing: 2 },

  resultValid: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: C.greenFaint, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.greenBorder },
  resultValidText: { color: C.green, fontSize: 12, fontWeight: '600', flex: 1 },
  resultInvalid: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: C.redFaint, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.redBorder },
  resultInvalidText: { color: C.red, fontSize: 12, fontWeight: '600', flex: 1 },

  btns: { paddingHorizontal: 20, paddingBottom: 16 },
  validateBtn:         { borderRadius: 16, overflow: 'hidden' },
  validateBtnDisabled: { opacity: 0.4 },
  confirmBtn:          { borderRadius: 16, overflow: 'hidden' },
  validateGradient:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  validateText:        { color: C.white, fontSize: 15, fontWeight: '800' },
});

// ── Utility: Convert API data to Redeem format ──────────
function getAvatarEmoji(firstName: string): string {
  const emojis = ['👨', '👩', '🧔', '👱', '👴', '👵'];
  const index = firstName.charCodeAt(0) % emojis.length;
  return emojis[index];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'hace poco';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours} h`;
  if (diffDays === 1) return 'ayer';
  return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
}

function mapApiToRedeem(item: RedemptionItem): Redeem {
  const fullName = `${item.client_id.first_name} ${item.client_id.last_name}`;
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  // Determinar texto de expiración/estado
  let expiresAtText = '';
  if (item.status === 'validated') {
    expiresAtText = 'Validado';
  } else if (item.status === 'expired') {
    expiresAtText = 'Expirado';
  } else if (new Date(item.expires_at) < new Date()) {
    expiresAtText = 'Expirado';
  } else {
    const hoursLeft = Math.ceil((new Date(item.expires_at).getTime() - new Date().getTime()) / 3600000);
    expiresAtText = `Vence en ${hoursLeft}h`;
  }
  
  return {
    id: item._id,
    code: item.redemption_code,
    user: fullName,
    avatar: getAvatarEmoji(item.client_id.first_name),
    promo: item.promotion_id.title,
    emoji: '🎁', // Default emoji, could be expanded based on promotion category
    pts: item.points_spent,
    redeemedAt: formatDate(item.createdAt),
    expiresAt: expiresAtText,
    status: item.status as RedeemStatus,
    rawData: item,
  };
}

// ── Main Screen ───────────────────────────────────────────
export default function BusinessRedeemScreen() {
  const router = useRouter();
  const { authToken } = useAuth();
  const [redeems, setRedeems] = useState<Redeem[]>([]);
  const [activeFilter, setFilter] = useState('all');
  const [showScanner, setShowScanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRedemptionCode, setSelectedRedemptionCode] = useState<string>('');

  // Cargar datos reales del API
  useEffect(() => {
    loadRedemptions();
  }, [authToken]);

  const loadRedemptions = async () => {
    if (!authToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const apiData = await getBusinessRedemptionsRequest(authToken);
      const mappedRedeems = apiData.map(mapApiToRedeem);
      setRedeems(mappedRedeems);
    } catch (error) {
      console.error('Error loading redemptions:', error);
      Alert.alert('Error', 'No se pudieron cargar los canjes');
      setRedeems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const pending = redeems.filter((r) => r.status === 'pending').length;
  const validated = redeems.filter((r) => r.status === 'validated').length;
  const expired = redeems.filter((r) => r.status === 'expired').length;

  const filtered = redeems.filter((r) => {
    if (activeFilter === 'all') return true;
    return r.status === activeFilter;
  });

  const handleOpenValidator = (redemptionCode: string) => {
    setSelectedRedemptionCode(redemptionCode);
    setShowScanner(true);
  };

  const handleScanValidate = (redemption: RedemptionItem) => {
    // No hacer otra validación, solo actualizar el estado local con el objeto validado
    setRedeems((prev) =>
      prev.map((r) =>
        r.id === redemption._id
          ? { ...r, status: redemption.status as RedeemStatus }
          : r
      )
    );
    Alert.alert('¡Éxito!', 'Código validado correctamente');
    setShowScanner(false);
    setSelectedRedemptionCode('');
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <HeaderBusinessComponent title="Mis canjes" subtitle="Administra los canjes realizados en tu negocio" />

      {/* ── Loading ── */}
      {isLoading && (
        <View style={{ paddingVertical: 30, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      )}

      {!isLoading && (
        <>
          {/* ── Pending alert ── */}
          {pending > 0 && (
            <View style={s.pendingAlert}>
              <View style={s.pendingAlertDot} />
              <Text style={s.pendingAlertText}>
                Tienes <Text style={{ fontWeight: '800', color: C.brand }}>{pending} canje{pending > 1 ? 's' : ''} pendiente{pending > 1 ? 's' : ''}</Text> por confirmar
              </Text>
              <Ionicons name="chevron-down" size={14} color={C.brand} />
            </View>
          )}

          {/* ── Filters ── */}
          <View style={s.filtersWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.filtersScroll}
            >
              {FILTERS.map((f) => {
                const active = activeFilter === f.id;
                let count = 0;
                if (f.id === 'all') {
                  count = redeems.length;
                } else if (f.id === 'pending') {
                  count = pending;
                } else if (f.id === 'validated') {
                  count = validated;
                } else if (f.id === 'expired') {
                  count = expired;
                }

                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[s.filterPill, active && s.filterPillActive]}
                    onPress={() => setFilter(f.id)}
                  >
                    <Text style={[s.filterText, active && s.filterTextActive]}>{f.label}</Text>
                    <View style={[s.filterBadge, active && s.filterBadgeActive]}>
                      <Text style={[s.filterBadgeText, active && s.filterBadgeTextActive]}>{count}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── List ── */}
          <ScrollView
            style={s.list}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
          >
            {filtered.length === 0 ? (
              <View style={s.empty}>
                <View style={s.emptyIcon}>
                  <Ionicons name="gift-outline" size={36} color={C.mutedLight} />
                </View>
                <Text style={s.emptyTitle}>Sin canjes</Text>
                <Text style={s.emptySub}>No hay canjes en esta categoría aún.</Text>
              </View>
            ) : (
              filtered.map((item) => (
                <RedeemCard
                  key={item.id}
                  item={item}
                  onOpenValidator={handleOpenValidator}
                />
              ))
            )}
            <View style={{ height: 100 }} />
          </ScrollView>

         

          {/* ── Scanner Modal ── */}
          <ScannerModal
            visible={showScanner}
            onClose={() => {
              setShowScanner(false);
              setSelectedRedemptionCode('');
            }}
            onValidate={handleScanValidate}
            token={authToken}
          />
        </>
      )}
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
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: -25,
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
  scanBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 8 },
  statPill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, gap: 2 },
  statVal:  { fontSize: 20, fontWeight: '900' },
  statLabel:{ fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  /* Pending alert */
  pendingAlert: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.brandBorder,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  pendingAlertDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: C.brand },
  pendingAlertText: { flex: 1, color: C.textSub, fontSize: 13 },

  /* Filters */
  filtersWrap: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.surfaceBorder },
  filtersScroll: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', gap: 8 },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.surfaceBorder, flexShrink: 0,
  },
  filterPillActive:      { backgroundColor: C.brand, borderColor: C.brand },
  filterText:            { color: C.muted, fontSize: 13, fontWeight: '600' },
  filterTextActive:      { color: C.white },
  filterBadge:           { backgroundColor: C.surfaceBorder, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, minWidth: 18, alignItems: 'center' },
  filterBadgeActive:     { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterBadgeText:       { color: C.muted, fontSize: 10, fontWeight: '800' },
  filterBadgeTextActive: { color: C.white },

  /* List */
  list:        { flex: 1 },
  listContent: { padding: 16 },

  /* Empty */
  empty:     { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.surfaceBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle:{ color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  emptySub:  { color: C.muted, fontSize: 13 },

  /* FAB */
  fab: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    borderRadius: 32,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 10,
  },
  fabGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 28, paddingVertical: 15, borderRadius: 32,
  },
  fabText: { color: C.white, fontSize: 15, fontWeight: '800' },
});