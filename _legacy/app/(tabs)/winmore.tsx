import { HeaderFirstComponent } from '@/components/client/header';
import { useAuth } from '@/context/auth-context';
import { getPointSourcesRequest, PointSource } from '@/services/modules/point-sources';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useRef } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    Animated,
    Dimensions,
} from 'react-native';
import Svg, { Circle, Rect, Path, G } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

const C = {
  brand: '#b82a5e',
  brandDark: '#8a1f46',
  brandFaint: 'rgba(184,42,94,0.08)',
  brandBorder: 'rgba(184,42,94,0.18)',
  bg: '#ffffff',
  surface: '#ffffff',
  surfaceSoft: '#f7f2f5',
  white: '#ffffff',
  muted: '#9b8492',
  text: '#1a0f15',
  textSub: '#6b5560',
  gold: '#f5b042',
  success: '#2e7d64',
};

// Componente SVG para cada slide del carrusel
const SlideIcon = ({ type, color }: { type: string; color: string }) => {
  if (type === 'star') {
    return (
      <Svg width={44} height={44} viewBox="0 0 24 24">
        <Path
          d="M12 2L15 8.5L22 9.5L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9.5L9 8.5L12 2Z"
          fill={color}
          stroke={C.brand}
          strokeWidth={1}
        />
      </Svg>
    );
  } else if (type === 'heart') {
    return (
      <Svg width={44} height={44} viewBox="0 0 24 24">
        <Path
          d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.54L12 21.35Z"
          fill={color}
          stroke={C.brand}
          strokeWidth={1}
        />
      </Svg>
    );
  }
  return (
    <Svg width={44} height={44} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" fill={color} stroke={C.brand} strokeWidth={1} />
      <Path d="M12 8V16M8 12H16" stroke={C.brand} strokeWidth={1.5} />
    </Svg>
  );
};

// Tarjeta de punto fuente mejorada
function PointSourceCard({ source, index }: { source: PointSource; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        s.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={s.cardTop}>
        <View style={s.iconWrap}>
          <Ionicons name="gift-outline" size={22} color={C.brand} />
        </View>
        <View style={s.cardTitleWrap}>
          <Text style={s.cardTitle}>{source.name}</Text>
          <View style={s.pointsBadge}>
            <Ionicons name="star" size={12} color={C.brand} />
            <Text style={s.cardPoints}>+{source.points} pts</Text>
          </View>
        </View>
      </View>
   
    </Animated.View>
  );
}

export default function PointsSourcesScreen() {
  const { authToken } = useAuth();
  const [pointSources, setPointSources] = useState<PointSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPointSources = async () => {
      if (!authToken) {
        setPointSources([]);
        return;
      }

      setIsLoading(true);
      try {
        const sources = await getPointSourcesRequest(authToken);
        setPointSources(sources);
      } catch (error) {
        console.error('Error fetching point sources:', error);
        setPointSources([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPointSources();
  }, [authToken]);

  // Carrusel de tips SVG
  const carouselItems = [
    { title: 'Completa tu perfil', desc: '+150 puntos', icon: 'star', color: '#FFD966' },
    { title: 'Invita amigos', desc: '+200 c/u', icon: 'heart', color: '#F4A261' },
    { title: 'Primera compra', desc: '+500 puntos', icon: 'gift', color: '#76C893' },
    { title: 'Revisión semanal', desc: '+50 diarios', icon: 'check', color: '#9C89B8' },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <HeaderFirstComponent title="Gana Más" subtitle="Formas de ganar puntos" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      
       
        {/* Intro mejorado */}
        <View style={s.introCard}>
          <Ionicons name="bulb-outline" size={20} color={C.brand} style={s.introIcon} />
          <View style={s.introTextWrap}>
            <Text style={s.introTitle}>¡Súmate a la diversión!</Text>
            <Text style={s.introText}>
              Completa las actividades y acumula puntos canjeables por premios increíbles.
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={C.brand} />
            <Text style={s.loadingText}>Cargando formas de ganar puntos...</Text>
          </View>
        ) : pointSources.length > 0 ? (
          <View style={s.list}>
            <Text style={s.listTitle}>Actividades disponibles</Text>
            {pointSources.map((source, idx) => (
              <PointSourceCard key={source._id} source={source} index={idx} />
            ))}
          </View>
        ) : (
          <View style={s.emptyWrap}>
            <View style={s.emptyIcon}>
              <Ionicons name="sparkles-outline" size={28} color={C.brand} />
            </View>
            <Text style={s.emptyTitle}>No hay fuentes disponibles</Text>
            <Text style={s.emptyText}>
          Por ahora no hay actividades activas. ¡Vuelve pronto para acumular puntos!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  // Resumen de puntos
  pointsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.brandFaint,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 24,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: C.textSub,
    marginBottom: 4,
  },
  summaryPoints: {
    fontSize: 24,
    fontWeight: '800',
    color: C.brand,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  // Carrusel
  carouselContainer: {
    marginBottom: 24,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  carouselContent: {
    paddingRight: 20,
  },
  carouselSlide: {
    width: screenWidth * 0.7,
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: C.brandBorder,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  slideIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  slideTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
  },
  slideDesc: {
    fontSize: 13,
    color: C.brand,
    fontWeight: '600',
    marginBottom: 12,
  },
  slideButton: {
    backgroundColor: C.brandFaint,
    paddingVertical: 8,
    borderRadius: 30,
    alignItems: 'center',
  },
  slideButtonText: {
    color: C.brand,
    fontWeight: '700',
    fontSize: 13,
  },
  // Intro mejorado
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceSoft,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  introIcon: {
    marginRight: 4,
  },
  introTextWrap: {
    flex: 1,
  },
  introTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    marginBottom: 4,
  },
  introText: {
    fontSize: 13,
    color: C.textSub,
    lineHeight: 19,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: C.muted,
    fontSize: 14,
  },
  list: {
    marginTop: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(184,42,94,0.12)',
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.brandFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    marginBottom: 4,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardPoints: {
    color: C.brand,
    fontSize: 13,
    fontWeight: '700',
  },
  cardDescription: {
    color: C.textSub,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: C.brand,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: C.brandFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: C.textSub,
    textAlign: 'center',
    lineHeight: 20,
  },
});