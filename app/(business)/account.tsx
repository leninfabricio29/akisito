import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusBanner } from '@/components/portal/status-banner';
import { AppText, Avatar, Card } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { useBusiness } from '@/context/business-context';
import { useAlert } from '@/hooks/use-alert';
import { errorMessage, portalService } from '@/services';
import { colors, gradients, radius, SCREEN_PADDING, spacing } from '@/theme';
import { formatRating } from '@/utils/format';

type Item = { icon: keyof typeof Ionicons.glyphMap; label: string; hint?: string; href: Href; needsApproval?: boolean };

export default function BusinessAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { business, setBusiness, reload, isApproved } = useBusiness();
  const alert = useAlert();
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const groups: Item[][] = [
    [
      { icon: 'create-outline', label: 'Perfil del negocio', hint: 'Datos, fotos, ubicación y reglas de puntos', href: '/business/edit' },
      { icon: 'qr-code-outline', label: 'Mi código QR', hint: 'Imprímelo y colócalo en caja', href: '/business/qr', needsApproval: true },
      {
        icon: 'eye-outline',
        label: 'Ver mi página pública',
        hint: 'Así te ven tus clientes',
        href: { pathname: '/businesses/[id]', params: { id: String(business?.id ?? '') } },
        needsApproval: true,
      },
    ],
    [
      { icon: 'chatbubbles-outline', label: 'Reseñas', hint: business ? `${formatRating(business.rating_avg)} ★ · ${business.rating_count} reseñas` : undefined, href: '/business/reviews' },
      { icon: 'receipt-outline', label: 'Historial de canjes', href: '/business/redemptions' },
    ],
    [
      { icon: 'person-circle-outline', label: 'Mi cuenta', hint: 'Datos del propietario y contraseña', href: '/profile/settings' },
      { icon: 'help-circle-outline', label: 'Ayuda', href: '/profile/help' },
    ],
  ];

  const changeLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      setBusiness(await portalService.updateLogo(result.assets[0].uri));
    } catch (error) {
      alert.error('No se pudo actualizar el logo', errorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const confirmSignOut = () =>
    alert.show({
      type: 'confirm',
      title: 'Cerrar sesión',
      message: '¿Seguro que quieres salir?',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => void signOut() },
      ],
    });

  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable onPress={changeLogo} accessibilityRole="button" accessibilityLabel="Cambiar logo">
          <Avatar uri={business?.logo} name={business?.name} size={64} rounded="md" borderColor={colors.onPrimaryFaint} />
          <View style={styles.camera}>
            {uploading ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="camera" size={13} color={colors.primary} />}
          </View>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <AppText variant="h2" color="textInverse" numberOfLines={1}>
            {business?.name ?? user?.business?.name}
          </AppText>
          {business && <AppText style={{ color: colors.onPrimaryMuted }}>RUC {business.ruc}</AppText>}
          <View style={styles.badge}>
            <Ionicons name={isApproved ? 'shield-checkmark' : 'hourglass-outline'} size={14} color={colors.onPrimary} />
            <AppText variant="caption" color="textInverse">
              {isApproved ? 'Negocio verificado' : 'En revisión'}
            </AppText>
          </View>
        </View>
      </LinearGradient>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl * 2 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await reload();
              setRefreshing(false);
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.body}>
          <StatusBanner />
          {groups.map((group, g) => (
            <Card key={g} padded={false} style={{ overflow: 'hidden' }}>
              {group
                .filter((item) => !item.needsApproval || isApproved)
                .map((item, i) => (
                  <Pressable
                    key={item.label}
                    onPress={() => router.push(item.href)}
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
          <Pressable onPress={confirmSignOut} style={({ pressed }) => [styles.logout, pressed && { opacity: 0.85 }]}>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingBottom: spacing.xl, paddingHorizontal: SCREEN_PADDING, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  camera: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
  },
  body: { padding: SCREEN_PADDING, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
  rowIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
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
