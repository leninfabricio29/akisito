import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Avatar, Card } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { useAlert } from '@/hooks/use-alert';
import { useWalletTotals } from '@/hooks/use-wallet-totals';
import { authService, errorMessage } from '@/services';
import { colors, gradients, radius, SCREEN_PADDING, shadows, spacing } from '@/theme';
import { formatDate } from '@/utils/format';

type MenuItem = { icon: keyof typeof Ionicons.glyphMap; label: string; hint?: string; href: Href };

const MENU: MenuItem[][] = [
  [
    { icon: 'receipt-outline', label: 'Mis canjes', hint: 'Códigos y estado de tus premios', href: '/profile/redemptions' },
    { icon: 'time-outline', label: 'Historial de visitas', hint: 'Tus check-ins y reseñas pendientes', href: '/profile/visits' },
    { icon: 'heart-outline', label: 'Favoritos', href: '/profile/favorites' },
    { icon: 'analytics-outline', label: 'Estadísticas', href: '/profile/stats' },
  ],
  [
    { icon: 'settings-outline', label: 'Configuración', hint: 'Datos personales y contraseña', href: '/profile/settings' },
    { icon: 'help-circle-outline', label: 'Ayuda', href: '/profile/help' },
  ],
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser, signOut } = useAuth();
  const { totals } = useWalletTotals();
  const alert = useAlert();
  const [uploading, setUploading] = useState(false);

  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : '';

  const changeAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      setUser(await authService.updateAvatar(result.assets[0].uri));
    } catch (error) {
      alert.error('No se pudo actualizar la foto', errorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const confirmSignOut = () =>
    alert.show({
      type: 'confirm',
      title: 'Cerrar sesión',
      message: '¿Seguro que quieres salir de tu cuenta?',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => void signOut() },
      ],
    });

  const stats = [
    { label: 'Puntos', value: totals.points, icon: 'star' as const, color: colors.accent },
    { label: 'Visitas', value: totals.visits, icon: 'qr-code' as const, color: colors.primary },
    { label: 'Reseñas', value: totals.reviews, icon: 'chatbubble' as const, color: colors.success },
  ];

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxxl * 2 }}>
        <LinearGradient
          colors={gradients.primaryDeep}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + spacing.xl }]}
        >
          <Pressable onPress={changeAvatar} accessibilityRole="button" accessibilityLabel="Cambiar foto de perfil">
            <Avatar uri={user?.avatar} name={fullName} size={96} borderColor={colors.onPrimaryFaint} />
            <View style={styles.camera}>
              {uploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="camera" size={16} color={colors.primary} />
              )}
            </View>
          </Pressable>
          <AppText variant="h2" color="textInverse" style={{ marginTop: spacing.md }}>
            {fullName}
          </AppText>
          <AppText style={styles.soft}>{user?.email}</AppText>
          {user && (
            <AppText variant="caption" style={[styles.soft, { marginTop: spacing.xs }]}>
              Cliente desde {formatDate(user.created_at)}
            </AppText>
          )}
        </LinearGradient>

        <View style={[styles.stats, shadows.md]}>
          {stats.map((stat, i) => (
            <View key={stat.label} style={[styles.stat, i > 0 && styles.statDivider]}>
              <Ionicons name={stat.icon} size={18} color={stat.color} />
              <AppText variant="h2">{stat.value}</AppText>
              <AppText variant="caption" color="textSecondary">
                {stat.label}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.body}>
          {MENU.map((group, g) => (
            <Card key={g} padded={false} style={styles.group}>
              {group.map((item, i) => (
                <Pressable
                  key={item.label}
                  onPress={() => router.push(item.href)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && { backgroundColor: colors.surfaceMuted }]}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="title">{item.label}</AppText>
                    {item.hint && (
                      <AppText variant="caption" color="textMuted">
                        {item.hint}
                      </AppText>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              ))}
            </Card>
          ))}

          <Pressable onPress={confirmSignOut} accessibilityRole="button" style={({ pressed }) => [styles.logout, pressed && { opacity: 0.8 }]}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <AppText variant="bodyStrong" color="danger">
              Cerrar sesión
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
      <Alert visible={alert.visibleConfig} config={alert.config} onDismiss={alert.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    alignItems: 'center',
    paddingBottom: spacing.xxxl + spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  camera: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soft: { color: colors.onPrimaryMuted },
  stats: {
    flexDirection: 'row',
    marginHorizontal: SCREEN_PADDING,
    marginTop: -spacing.xxxl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.divider },
  body: { padding: SCREEN_PADDING, gap: spacing.md, marginTop: spacing.sm },
  group: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
  },
});
