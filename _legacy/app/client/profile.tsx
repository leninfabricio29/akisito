import ModalFavorites from '@/components/client/modalFavorites';
import ModalHelp from '@/components/client/modalHelp';
import ModalStats from '@/components/client/modalStats';
import { getStatsClientsRequest } from '@/services/user-service';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ModalSettings from '../../components/client/modalSettings';

import { HeaderFirstComponent } from '@/components/client/header';
import { useAuth } from '../../context/auth-context';


const { width } = Dimensions.get('window');

const DEFAULT_AVATAR = 'https://api.dicebear.com/9.x/adventurer/png?seed=winner-user';

function getInitial(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U';
}

// ── Palette ──────────────────────────────────────────────
const C = {
  brand: '#b82a5e',
  brandLight: '#d4547e',
  brandDark: '#8a1f46',
  brandFaint: '#787878ff',
  bg: '#f6f6f6ff',
  surface: '#ffffffff',
  surfaceHigh: '#241630',
  white: '#ffffff',
  muted: '#a08898',
  text: '#000000ff',
};

// ── Data ─────────────────────────────────────────────────
const INITIAL_STATS = [
  { label: 'Reseñas', value: '0' },
  { label: 'Puntos', value: '0' },
];

const menuItems = [
  { icon: 'bookmark-outline', label: 'Favoritos', action: 'favorites' },
  { icon: 'analytics-outline', label: 'Estadísticas', action: 'stats' },
  { icon: 'settings-outline', label: 'Configuración', action: 'settings' },
  { icon: 'help-circle-outline', label: 'Ayuda', action: 'help' },
];

// ── Component ─────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [profileStats, setProfileStats] = useState(INITIAL_STATS);

  const [showFavorites, setShowFavorites] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { session } = useAuth();
  const { authToken } = useAuth();
  const isBusiness = session?.role === 'Negocio';
  const displayName = session?.name?.trim() || session?.email || 'Usuario';
  const avatarUrl = session?.avatar_url?.trim();
  const hasAvatar = Boolean(avatarUrl);
  const initials = getInitial(displayName);

  const visibleMenuItems = menuItems.filter((item) => {
    if (!isBusiness) return true;
    return item.action !== 'favorites' && item.action !== 'stats' && item.action !== 'help';
  });

  React.useEffect(() => {
    if (authToken && !isBusiness) {
      getStatsClientsRequest(authToken)
        .then((data) => {
          setProfileStats([
            { label: 'Reseñas', value: String(data.total_reviews ?? 0) },
            { label: 'Puntos', value: String(data.total_points ?? 0) },
          ]);
        })
        .catch((error) => {
          console.log('Error fetching stats clients:', error);
        });
    }
  }, [authToken, isBusiness]);

  const handleLogout = async () => {
    router.replace('/(tabs)' as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <HeaderFirstComponent title="Perfil" subtitle="Administra tu cuenta y preferencias" />

      <ScrollView style={s.root} showsVerticalScrollIndicator={false}>
        {/* ── Header gradient ── */}
        <View style={s.headerGradient}>
          {/* Avatar area */}
          <View style={s.avatarWrapper}>
            <View style={s.avatarRing}>
              {hasAvatar ? (
                <Image
                  source={{ uri: avatarUrl || DEFAULT_AVATAR }}
                  style={s.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={s.avatarFallback}>
                  <Text style={s.avatarFallbackText}>{initials}</Text>
                </View>
              )}
            </View>
            <View style={s.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={22} color={C.brand} />
            </View>
          </View>

          {/* Name & handle */}
          <Text style={s.name}>{session?.name}</Text>
          <Text style={s.handle}>{session?.email}</Text>

          {!isBusiness && (
            <Text style={s.handle}>Codigo referido: {session?.referral_code || 'No disponible'}</Text>
          )}

        </View>

        {/* ── Stats card (overlapping) ── */}
        {!isBusiness && (
          <View style={s.statsCard}>
            {profileStats.map((stat, i) => (
              <View key={stat.label} style={[s.statItem, i < profileStats.length - 1 && s.statDivider]}>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Body ── */}
        <View style={[s.body, isBusiness && s.bodyBusiness]}>
          {/* Menu */}
          <Text style={s.sectionTitle}>Opciones</Text>
          <View style={s.card}>
            {visibleMenuItems.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[s.menuRow, i < visibleMenuItems.length - 1 && s.activityBorder]}
                onPress={() => {
                  if (item.action === 'favorites') {
                    setShowFavorites(true);
                  } else if (item.action === 'stats') {
                    setShowStats(true);
                  } else if (item.action === 'settings') {
                    setShowSettings(true);
                  } else if (item.action === 'help') {
                    setShowHelp(true);
                  } else {
                    Alert.alert('Funcionalidad no implementada', `La acción "${item.label}" aún no está disponible.`);
                  }
                }}
              >
                <Ionicons name={item.icon as any} size={20} color={C.brand} style={{ marginRight: 14 }} />
                <Text style={s.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.muted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            ))}
          </View>

          {isBusiness && (
            <TouchableOpacity style={s.backHomeBtn} onPress={() => router.replace('/(tabs)' as never)}>
              <Ionicons name="home-outline" size={18} color={C.white} style={{ marginRight: 8 }} />
              <Text style={s.backHomeText}>Volver a Inicio</Text>
            </TouchableOpacity>
          )}

          {/* Logout */}
          {/* Home */}
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Ionicons name="home-outline" size={18} color={C.brand} style={{ marginRight: 8 }} />
            <Text style={s.logoutText}>Volver a Inicio</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      <ModalFavorites
        visible={showFavorites}
        onClose={() => setShowFavorites(false)}
      />

      <ModalStats
        visible={showStats}
        onClose={() => setShowStats(false)}
      />

      <ModalSettings
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onDeleteAccount={() => {
          Alert.alert(
            'Eliminar cuenta',
            'Esta acción es permanente. ¿Deseas continuar?',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Eliminar',
                style: 'destructive',
                onPress: () => {
                  setShowSettings(false);
                  Alert.alert('Cuenta eliminada', 'Tu cuenta fue eliminada correctamente.');
                },
              },
            ]
          );
        }}
      />

      <ModalHelp
        visible={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  /* Header */
  headerGradient: {
    backgroundColor: C.white,
    paddingBottom: 64,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  screenTitle: {
    color: C.brand,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Avatar */
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(184,42,94,0.15)',
  },
  avatarFallbackText: {
    color: C.brand,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 1,
  },

  name: {
    color: C.brand,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  handle: {
    color: 'rgba(184,42,94,0.75)',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 10,
  },
  bio: {
    color: 'color: rgba(184,42,94,0.85)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
    marginBottom: 20,
  },

 
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 24,
  },
  btnPrimaryText: {
    color: C.white,
    fontWeight: '600',
    fontSize: 14,
  },
  btnSecondary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Stats card */
  statsCard: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 18,
    marginTop: -36,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(184,42,94,0.2)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(160,136,152,0.2)',
  },
  statValue: {
    color: C.brand    ,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: C.muted,
    fontSize: 11,
    marginTop: 3,
    letterSpacing: 0.3,
  },

  /* Body */
  body: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  bodyBusiness: {
    paddingTop: 12,
  },
  sectionTitle: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },

  /* Badges */
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  badge: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(184,42,94,0.15)',
  },
  badgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeLabel: {
    color: C.text,
    fontSize: 11,
    fontWeight: '600',
  },

  /* Card */
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    marginBottom: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(184,42,94,0.12)',
  },

  /* Activity */
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(160,136,152,0.12)',
  },
  activityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(184,42,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: {
    color: C.text,
    fontSize: 13,
    lineHeight: 18,
  },
  activityTime: {
    color: C.muted,
    fontSize: 11,
    marginTop: 2,
  },

  /* Menu */
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  menuLabel: {
    color: C.text,
    fontSize: 15,
  },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(184,42,94,0.35)',
    marginBottom: 8,
  },
  backHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.brand,
    backgroundColor: C.brand,
    marginBottom: 10,
  },
  backHomeText: {
    color: C.white,
    fontWeight: '700',
    fontSize: 15,
  },
  logoutText: {
    color: C.brand,
    fontWeight: '600',
    fontSize: 15,
  },
});