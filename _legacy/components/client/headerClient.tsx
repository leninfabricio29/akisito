import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth-context';



const C = {
  brand: '#b82a5e',
  brandDark: '#8a1f46',
  white: '#ffffff',
  gold: '#f5c842',
};

function getInitial(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U';
}

export function HeaderClientComponent() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const displayName = session?.name?.trim() || session?.email || 'Usuario';
  const initials = getInitial(displayName);
  const avatarUrl = session?.avatar_url?.trim();
  const hasAvatar = Boolean(avatarUrl);

  const handleGoToProfile = () => {
    setMenuVisible(false);
    router.push('/client/profile');
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    await signOut();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView edges={['top']} >
      <View

        style={s.header}
      >
        <View style={s.headerTop}>
          <View style={s.userInfoWrap}>
            <View style={s.avatar}>
              {hasAvatar ? (
                <Image source={{ uri: avatarUrl }} style={s.avatarImage} contentFit="cover" />
              ) : (
                <Text style={s.avatarText}>{initials}</Text>
              )}
            </View>

            <View>
              <Text style={s.headerGreeting}>¡Buenos días! 👋</Text>
              <View style={s.userRow}>
                <Text style={s.headerLocation}>{displayName}</Text>
              </View>
            </View>
          </View>

          <View style={s.actionsWrap}>
            <TouchableOpacity
              style={s.notifBtn}
              onPress={() => router.push('/notifications/notifications')}
            >
              <Ionicons name="notifications-outline" size={20} color="#b82a5e" />
              <View style={s.notifDot} />
            </TouchableOpacity>

            <TouchableOpacity style={s.menuBtn} onPress={() => setMenuVisible(true)}>
              <Ionicons name="menu" size={22} color="#b82a5e" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={s.menuOverlay} onPress={() => setMenuVisible(false)}>
          <Pressable style={s.menuCard} onPress={() => undefined}>
            <TouchableOpacity style={s.menuItem} onPress={handleGoToProfile}>
              <Ionicons name="person-outline" size={18} color="#b82a5e" />
              <Text style={s.menuItemText}>Ir a perfil</Text>
            </TouchableOpacity>

            <View style={s.menuDivider} />

            <TouchableOpacity style={s.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#b82a5e" />
              <Text style={s.menuItemText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

export default HeaderClientComponent;

const s = StyleSheet.create({
  safe: {
    backgroundColor: 'transparent',
  },

  // HEADER
  header: {
    backgroundColor: '#fff',

    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 14,

   
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },

  userInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // AVATAR
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    

    backgroundColor: '#fff',

    borderWidth: 2,
    borderColor: '#b82a5e',
    padding: 2,

    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#b82a5e',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
  },

  headerGreeting: {
    color: '#b82a5e',
    fontSize: 13,
    marginBottom: 2,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  headerLocation: {
    color: '#b82a5e',
    fontSize: 12,
    fontWeight: '500',
  },

  // BOTONES REDONDEADOS
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,

    backgroundColor: '#fff',


    alignItems: 'center',
    justifyContent: 'center',

  },

  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,

    backgroundColor: '#fff',


    alignItems: 'center',
    justifyContent: 'center',

    
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
    borderColor: '#b82a5e',
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 72,
    paddingRight: 16,
  },

  menuCard: {
    width: 190,
    backgroundColor: '#fff',

    borderRadius: 18,

    borderWidth: 1,
    borderColor: '#b82a5e',

    paddingVertical: 8,

    shadowColor: '#b82a5e',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },

    elevation: 8,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  menuItemText: {
    color: '#b82a5e',
    fontSize: 14,
    fontWeight: '700',
  },

  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(184,42,94,0.15)',
    marginHorizontal: 12,
  },
});