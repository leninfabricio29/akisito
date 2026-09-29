import { HeaderFirstComponent } from '@/components/client/header';
import { useAuth } from '@/context/auth-context';
import { RedeemPromotionData, redeemPromotionRequest } from '@/services/exchanges-service';
import { PromotionItem, getAllPromotionsRequest } from '@/services/promotion-service';
import { getUserProfileRequest } from '@/services/user-service';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

const NOTCH= 14; // radio del semicírculo dentado

// ── Palette ──────────────────────────────────────────────
const C = {
    brand: '#b82a5e',
    brandLight: '#d4547e',
    brandDark: '#8a1f46',
    brandFaint: 'rgba(184,42,94,0.08)',
    brandBorder: 'rgba(184,42,94,0.2)',
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
};

function formatExpiresAt(isoDate: string): string {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function isValidRedemptionPayload(value: RedeemPromotionData | null): value is RedeemPromotionData {
    if (!value) return false;
    return Boolean(value.redemption_code && value.expires_at && value.promotion);
}


// ── Animated Progress Bar ─────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
    const pct = Math.min(current / total, 1);
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(anim, {
            toValue: pct,
            tension: 60,
            friction: 10,
            useNativeDriver: false,
        }).start();
    }, []);

    const canRedeem = current >= total;

    return (
        <View style={pb.wrap}>
            <View style={pb.track}>
                <Animated.View
                    style={[
                        pb.fill,
                        {
                            width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                            backgroundColor: canRedeem ? C.green : C.brand,
                        },
                    ]}
                />
                {/* Milestone dots */}
                {[0.25, 0.5, 0.75].map((m) => (
                    <View
                        key={m}
                        style={[
                            pb.dot,
                            { left: `${m * 100}%` as any },
                            pct >= m && { backgroundColor: C.white },
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

// ── Promo Card ────────────────────────────────────────────
function PromoCard({
    promo,
    userPoints,
    onRedeem,
    isRedeeming,
}: {
    promo: PromotionItem;
    userPoints: number;
    onRedeem: (p: PromotionItem) => void;
    isRedeeming?: boolean;
}) {
    const canRedeem = userPoints >= promo.points_required;
    const pct = Math.min((userPoints / promo.points_required) * 100, 100);
    const missing = Math.max(promo.points_required - userPoints, 0);

    // Obtener nombre del lugar
    const placeName = typeof promo.place_id === 'object'
        ? promo.place_id.name || 'Lugar no especificado'
        : 'Lugar no especificado';

    return (
        <View style={pc.card}>
            {/* Imagen de la promo */}
            {promo.image && (
                <Image
                    source={{ uri: promo.image }}
                    style={pc.promoImage}
                    defaultSource={{ uri: "https://via.placeholder.com/400x300?text=Promo" }}
                />
            )}

            {/* Body */}
            <View style={pc.body}>
                <Text style={pc.title}>{promo.title}</Text>
                <Text style={pc.business}>{placeName}</Text>
                <Text style={pc.description} numberOfLines={2}>{promo.description}</Text>

                {/* Points info */}
                <View style={pc.pointsRow}>
                    <View style={pc.pointsLeft}>
                        <Ionicons name="star" size={14} color={C.gold} />
                        <Text style={pc.pointsRequired}>{promo.points_required.toLocaleString()}</Text>
                        <Text style={pc.pointsLabel}>puntos</Text>
                    </View>
                    {!canRedeem && (
                        <View style={pc.missingBadge}>
                            <Text style={pc.missingText}>Te faltan {missing} pts</Text>
                        </View>
                    )}
                    {canRedeem && (
                        <View style={pc.readyBadge}>
                            <Ionicons name="checkmark-circle" size={13} color={C.green} />
                            <Text style={pc.readyText}>¡Listo para canjear!</Text>
                        </View>
                    )}
                </View>

                {/* Progress */}
                <View style={pc.progressSection}>
                    <View style={pc.progressLabels}>
                        <Text style={pc.progressCurrent}>{Math.round(pct)}% completado</Text>
                        <Text style={pc.progressFraction}>
                            {Math.min(userPoints, promo.points_required)}/{promo.points_required} pts
                        </Text>
                    </View>
                    <ProgressBar current={userPoints} total={promo.points_required} />
                </View>

                {/* CTA */}
                <TouchableOpacity
                    style={[pc.redeemBtn, (!canRedeem || isRedeeming) && pc.redeemBtnLocked]}
                    onPress={() => canRedeem && !isRedeeming && onRedeem(promo)}
                    activeOpacity={canRedeem ? 0.8 : 1}
                    disabled={!canRedeem || isRedeeming}
                >
                    <LinearGradient
                        colors={canRedeem ? [C.brand, C.brandDark] : ['#e8dde5', '#e8dde5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={pc.redeemGradient}
                    >
                        <Ionicons
                            name={canRedeem ? 'gift' : 'lock-closed'}
                            size={16}
                            color={canRedeem ? C.white : C.mutedLight}
                        />
                        <Text style={[pc.redeemText, !canRedeem && pc.redeemTextLocked]}>
                            {isRedeeming ? 'Generando cupón...' : canRedeem ? 'Canjear ahora' : `Faltan ${missing} puntos`}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ── Redeem Success Modal ──────────────────────────────────
function RedeemModal({
    promo,
    redemption,
    visible,
    onClose,
}: {
    promo: PromotionItem | null;
    redemption: RedeemPromotionData | null;
    visible: boolean;
    onClose: () => void;
}) {
    if (!promo || !isValidRedemptionPayload(redemption)) return null;

    const expiresLabel = formatExpiresAt(redemption.expires_at);
    const qrValue = redemption.redemption_code;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=0&bgcolor=ffffff&color=000000&data=${encodeURIComponent(qrValue)}`;
    const bizName = typeof promo.place_id === 'object' ? promo.place_id.name : 'Lugar';
    const title = redemption.promotion?.title || promo.title;
    const points = redemption.promotion?.points_required ?? promo.points_required;

    return (
        <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
            <View style={rm.overlay}>
                <View style={rm.coupon}>

                    {/* Botón X */}
                    <TouchableOpacity style={rm.closeX} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close" size={20} color={C.white} />
                    </TouchableOpacity>

                    {/* ── Fila 1: Info | QR ── */}
                    <LinearGradient
                        colors={[C.brand, C.brandDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={rm.topRow}
                    >
                        {/* Columna izquierda */}
                        <View style={rm.infoCol}>
                            <Text style={rm.badgeText}>🎉 Cupón activo</Text>
                            <Text style={rm.titleText} numberOfLines={3}>{title}</Text>
                            <Text style={rm.bizText} numberOfLines={1}>{bizName}</Text>
                        </View>

                        {/* Divisor vertical */}
                        <View style={rm.dividerV} />

                        {/* Columna derecha: QR */}
                        <View style={rm.qrCol}>
                            <View style={rm.qrBox}>
                                <Image source={{ uri: qrUrl }} style={rm.qrImg} resizeMode="contain" />
                            </View>
                            <Text style={rm.codeText}>{qrValue}</Text>
                        </View>
                    </LinearGradient>

                    {/* ── Tear line ── */}
                    <View style={rm.tearRow}>
                        <View style={rm.notchLeft} />
                        <View style={rm.tearLine} />
                        <View style={rm.notchRight} />
                    </View>

                    {/* ── Fila 2: Detalles ── */}
                    <View style={rm.bottomRow}>
                        <View style={rm.detail}>
                            <Ionicons name="time-outline" size={14} color={C.muted} />
                            <Text style={rm.detailText}>Vence: {expiresLabel}</Text>
                        </View>
                        <View style={rm.detailSep} />
                        <View style={rm.detail}>
                            <Ionicons name="star" size={14} color={C.gold} />
                            <Text style={rm.detailText}>{points} pts descontados</Text>
                        </View>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

// ── Main Screen ───────────────────────────────────────────
export default function PromotionsScreen() {
    const [redeemPromo, setRedeemPromo] = useState<PromotionItem | null>(null);
    const [redeemData, setRedeemData] = useState<RedeemPromotionData | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [promos, setPromos] = useState<PromotionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [userPoints, setUserPoints] = useState(0);
    const [isRedeemingPromotionId, setIsRedeemingPromotionId] = useState<string | null>(null);
    const { authToken } = useAuth();

    const redeemableCount = promos.filter((p) => userPoints >= p.points_required).length;

    useEffect(() => {
        fetchPromos();
        fetchUserProfile();
    }, [authToken]);

    // Refrescar datos cada vez que la pantalla gana el foco
    useFocusEffect(
        useCallback(() => {
            if (!authToken) return;
            fetchPromos();
            fetchUserProfile();
        }, [authToken])
    );


    const fetchPromos = async () => {
        if (!authToken) {
            setPromos([]);
            setLoading(false);
            return;
        }

        try {
            const data = await getAllPromotionsRequest(authToken);
            // Extraer items si viene con paginación
            const items = Array.isArray(data) ? data : (data as any).items || [];
            setPromos(items);
        } catch (error) {
            console.error('Error fetching promotions:', error);
            setPromos([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserProfile = async () => {
        if (!authToken) {
            setUserPoints(0);
            return;
        }

        try {
            const profile = await getUserProfileRequest(authToken ?? '');
            setUserPoints(profile.points_balance || 0);
        } catch (error) {
            setUserPoints(0);
        }
    };

    const handleRedeemPromotion = async (promo: PromotionItem) => {
        if (!authToken) {
            Alert.alert('Sesión expirada', 'Inicia sesión nuevamente para continuar.');
            return;
        }

        setIsRedeemingPromotionId(promo._id);
        try {
            const result = await redeemPromotionRequest(authToken, promo._id);
            // Refrescar datos después del canje
            await Promise.all([fetchPromos(), fetchUserProfile()]);
            setRedeemData(result);
            setRedeemPromo(promo);
            setShowModal(true);
        } catch (error) {
            console.error('Error redeeming promotion:', error);
            Alert.alert('No se pudo canjear', error instanceof Error ? error.message : 'Ocurrió un error al canjear la promoción.');
        } finally {
            setIsRedeemingPromotionId(null);
        }
    };


    return (
        <View style={s.root}>
            <StatusBar barStyle="dark-content" />

            {/* ── Header ── */}
            <HeaderFirstComponent title="Promociones" subtitle="Canjea tus puntos por experiencias" />

            {/* ── Points Banner ── */}
            <View style={s.banner}>
                <LinearGradient
                    colors={['#fff8f0', '#fef3dc']}
                    style={s.bannerGradient}
                >
                    <View style={s.bannerLeft}>
                        <Text style={s.bannerLabel}>Tus puntos disponibles</Text>
                        <View style={s.bannerPts}>
                            <Ionicons name="star-half-outline" size={22} color={C.gold} />
                            <Text style={s.bannerPtsVal}>{userPoints}</Text>
                            <Text style={s.bannerPtsWord}>puntos</Text>
                        </View>
                        {redeemableCount > 0 && (
                            <View style={s.bannerBadge}>
                                <Ionicons name="gift" size={11} color={C.green} />
                                <Text style={s.bannerBadgeText}>
                                    {redeemableCount} promo{redeemableCount > 1 ? 's' : ''} disponible{redeemableCount > 1 ? 's' : ''}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={s.bannerRight}>
                        <Text style={s.bannerEmoji}><Ionicons name="gift" size={42} color={C.green} /> </Text>
                    </View>
                </LinearGradient>
            </View>

            {/* ── Promo List ── */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.list}
            >
                {loading ? (
                    <View style={s.loadingContainer}>
                        <Text style={s.loadingText}>Cargando promociones...</Text>
                    </View>
                ) : promos.length === 0 ? (
                    <View style={s.emptyContainer}>
                        <Text style={s.emptyText}>No hay promociones disponibles</Text>
                    </View>
                ) : (
                    <>
                        <Text style={s.listCount}>
                            {promos.length} promoción{promos.length !== 1 ? 'es' : ''}
                        </Text>
                        {promos.map((promo) => (
                            <PromoCard
                                key={promo._id}
                                promo={promo}
                                userPoints={userPoints}
                                onRedeem={handleRedeemPromotion}
                                isRedeeming={isRedeemingPromotionId === promo._id}
                            />
                        ))}
                    </>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ── Redeem Modal ── */}
            <RedeemModal
                promo={redeemPromo}
                redemption={redeemData}
                visible={showModal}
                onClose={() => {
                    setShowModal(false);
                    setRedeemData(null);
                    setRedeemPromo(null);
                }}
            />
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: Platform.select({ ios: 60, android: 44, default: 44 }),
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    headerTitle: { color: C.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    headerSub: { color: C.muted, fontSize: 13, marginTop: 2 },
    pointsBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: C.goldLight,
        borderWidth: 1,
        borderColor: C.goldBorder,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
    },
    pointsVal: { color: C.text, fontSize: 15, fontWeight: '800' },
    pointsPts: { color: C.muted, fontSize: 11, fontWeight: '600' },

    /* Banner */
    banner: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
    bannerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderWidth: 1,
        borderColor: C.goldBorder,
        borderRadius: 20,
    },
    bannerLeft: { flex: 1 },
    bannerLabel: { color: C.textSub, fontSize: 12, fontWeight: '600', marginBottom: 6 },
    bannerPts: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    bannerPtsVal: { color: C.text, fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    bannerPtsWord: { color: C.muted, fontSize: 14, alignSelf: 'flex-end', marginBottom: 4 },
    bannerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        backgroundColor: C.greenFaint,
        borderWidth: 1,
        borderColor: C.greenBorder,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    bannerBadgeText: { color: C.green, fontSize: 11, fontWeight: '700' },
    bannerRight: { alignItems: 'center', justifyContent: 'center' },
    bannerEmoji: { fontSize: 48 },

    /* Categories */
    categoriesWrap: {
        marginTop: 20,
        marginBottom: 4,
    },
    categoriesScroll: {
        paddingHorizontal: 20,
        gap: 8,
    },
    catPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(184,42,94,0.15)',
    },
    catPillActive: {
        backgroundColor: C.brand,
        borderColor: C.brand,
    },
    catLabel: {
        color: 'red',
        fontSize: 13,
        fontWeight: '600',
    },
    catLabelActive: {
        color: C.white,
    },
    /* List */
    list: { paddingHorizontal: 20, paddingTop: 16 },
    listCount: { color: C.muted, fontSize: 12, marginBottom: 14, fontWeight: '600' },
    loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    loadingText: { color: C.muted, fontSize: 14, fontWeight: '500' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { color: C.textSub, fontSize: 16, fontWeight: '600' },
});

// ── Promo Card Styles ─────────────────────────────────────
const pc = StyleSheet.create({
    card: {
        backgroundColor: C.white,
        borderRadius: 24,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: C.surfaceHigh,
        shadowColor: C.brand,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    promoImage: {
        width: '100%',
        height: 180,
        backgroundColor: C.surface,
    },
    header: {
        height: 100,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 14,
        position: 'relative',
    },
    tagWrap: {
        backgroundColor: 'rgba(0,0,0,0.25)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    tagText: { color: C.white, fontSize: 11, fontWeight: '700' },
    emoji: { fontSize: 44, position: 'absolute', right: 16, top: '50%', marginTop: -26 },
    expiresWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        position: 'absolute',
        bottom: 10,
        left: 18,
    },
    expiresText: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },

    body: { padding: 18 },
    business: { color: C.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    title: { color: C.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.3, marginBottom: 6 },
    description: { color: C.textSub, fontSize: 13, lineHeight: 19, marginBottom: 12 },

    valueRow: { marginBottom: 12 },
    valueBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        backgroundColor: C.greenFaint,
        borderWidth: 1,
        borderColor: C.greenBorder,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    valueText: { color: C.green, fontSize: 12, fontWeight: '700' },

    pointsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    pointsLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    pointsRequired: { color: C.text, fontSize: 20, fontWeight: '900' },
    pointsLabel: { color: C.muted, fontSize: 13 },
    missingBadge: {
        backgroundColor: C.brandFaint,
        borderWidth: 1,
        borderColor: C.brandBorder,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    missingText: { color: C.brand, fontSize: 11, fontWeight: '700' },
    readyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: C.greenFaint,
        borderWidth: 1,
        borderColor: C.greenBorder,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    readyText: { color: C.green, fontSize: 11, fontWeight: '700' },

    progressSection: { marginBottom: 16 },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressCurrent: { color: C.textSub, fontSize: 12, fontWeight: '600' },
    progressFraction: { color: C.muted, fontSize: 12 },

    redeemBtn: { borderRadius: 16, overflow: 'hidden' },
    redeemBtnLocked: { opacity: 0.9 },
    redeemGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    redeemText: { color: C.white, fontSize: 15, fontWeight: '800' },
    redeemTextLocked: { color: C.mutedLight },
});

// ── Progress Bar Styles ───────────────────────────────────
const pb = StyleSheet.create({
    wrap: { width: '100%' },
    track: {
        height: 8,
        backgroundColor: C.surfaceHigh,
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
    },
    fill: {
        height: '100%',
        borderRadius: 4,
    },
    dot: {
        position: 'absolute',
        top: 2,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(155,132,146,0.4)',
        marginLeft: -2,
    },
});

// ── Redeem Modal Styles ───────────────────────────────────
const rm = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    coupon: {
        width: 340,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 18,
    },

    /* X button */
    closeX: {
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 10,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* Fila superior */
    topRow: {
        flexDirection: 'row',
        padding: 20,
        paddingTop: 22,
        paddingBottom: 22,
        alignItems: 'center',
    },
    infoCol: {
        flex: 1,
        paddingRight: 14,
    },
    badgeText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 6,
    },
    titleText: {
        color: C.white,
        fontSize: 16,
        fontWeight: '900',
        lineHeight: 22,
        marginBottom: 8,
    },
    bizText: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 12,
    },

    dividerV: {
        width: 1,
        alignSelf: 'stretch',
        backgroundColor: 'rgba(255,255,255,0.25)',
        marginHorizontal: 4,
    },

    qrCol: {
        alignItems: 'center',
        paddingLeft: 14,
    },
    qrBox: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: C.white,
        padding: 4,
        overflow: 'hidden',
    },
    qrImg: {
        width: '100%',
        height: '100%',
    },
    codeText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginTop: 6,
    },

    /* Tear line */
    tearRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.white,
    },
    notchLeft: {
        width: NOTCH * 2,
        height: NOTCH * 2,
        borderRadius: NOTCH,
        backgroundColor: 'rgba(0,0,0,0.55)',
        marginLeft: -NOTCH,
    },
    notchRight: {
        width: NOTCH * 2,
        height: NOTCH * 2,
        borderRadius: NOTCH,
        backgroundColor: 'rgba(0,0,0,0.55)',
        marginRight: -NOTCH,
    },
    tearLine: {
        flex: 1,
        height: 1,
        borderWidth: 1,
        borderColor: C.surfaceHigh,
        borderStyle: 'dashed',
        marginHorizontal: 6,
    },

    /* Fila inferior */
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.white,
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    detail: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailSep: {
        width: 1,
        height: 20,
        backgroundColor: C.surfaceHigh,
        marginHorizontal: 8,
    },
    detailText: {
        color: C.textSub,
        fontSize: 12,
    },
});