import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth-context';


const C = {
  brand: '#b82a5e',
  brandLight: '#d4547e',
  brandDark: '#8a1f46',
  gold: '#f5a623',
  white: '#ffffff',
};

function getInitial(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U';
}

export function HeaderHomeComponent() {
  const router = useRouter();
  const { session } = useAuth();
  const displayName = session?.name?.trim() || session?.email || 'Negocio';
  const avatarUrl = session?.avatar_url?.trim();
  const hasAvatar = Boolean(avatarUrl);
  const initials = getInitial(displayName);

  const isBusinessRole = session?.role === 'Negocio';

  const todayDate = new Date().toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <SafeAreaView edges={['top']} style={s.safe}>
    <LinearGradient
      colors={[C.brandDark, C.brand, C.brandLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.header}
    >
      <View style={s.circle1} />
      <View style={s.circle2} />

      <View style={s.headerTop}>
        <View style={s.bizBadge}>
          <Ionicons name="business" size={13} color={C.brandLight} />
          <Text style={s.bizBadgeText}>{session?.businessName}</Text>
        </View>

        {!isBusinessRole && (
          <TouchableOpacity
            style={s.notifBtn}
            onPress={() => router.push('/(tabs)/notifications' as never)}
          >
            <Ionicons name="notifications-outline" size={20} color={C.white} />
            <View style={s.notifDot} />
          </TouchableOpacity>

          
        )}
      </View>

      <View style={s.identityRow}>
        <View style={s.avatarWrap}>
          {hasAvatar ? (
            <Image source={{ uri: avatarUrl }} style={s.avatarImage} contentFit="cover" />
          ) : (
            <Text style={s.avatarText}>{initials}</Text>
          )}
        </View>
        <Text style={s.businessName}>{session?.businessName ?? 'Mi Negocio'}</Text>
      </View>
      <Text style={s.dateText}>{todayDate}</Text>
    </LinearGradient>
    </SafeAreaView>
  );
}

export default HeaderHomeComponent;

const s = StyleSheet.create({
    safe: {
    backgroundColor: 'white', // evita corte visual en notch
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 44,
    overflow: 'hidden',
    gap: 6,
  },
  circle1: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -80,
    right: -70,
  },
  circle2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -40,
    left: -30,
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
  bizBadgeText: {
    color: C.white,
    fontSize: 11,
    fontWeight: '700',
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.gold,
    borderWidth: 1.5,
    borderColor: C.brand,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '800',
  },
  businessName: {
    color: C.white,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  dateText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
  },
});