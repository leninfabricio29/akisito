import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, PointsBadge } from '@/components/ui';
import type { BusinessSummary } from '@/services';
import { colors, gradients, radius, shadows, spacing } from '@/theme';
import { categoryIcon } from '@/utils/category-icon';
import { formatDistance, formatRating } from '@/utils/format';

type Props = {
  business: BusinessSummary;
  onPress: () => void;
  onToggleFavorite?: () => void;
};

/** Tarjeta de negocio para listados (Explorar, Favoritos). */
export function BusinessCard({ business, onPress, onToggleFavorite }: Props) {
  const distance = formatDistance(business.distance_m);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={business.name}
      style={({ pressed }) => [styles.card, shadows.sm, pressed && { opacity: 0.94 }]}
    >
      <View style={styles.cover}>
        {business.cover ? (
          <Image source={{ uri: business.cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient colors={gradients.primary} style={StyleSheet.absoluteFill}>
            <View style={styles.coverIcon}>
              <Ionicons name={categoryIcon(business.category?.icon)} size={40} color={colors.onPrimaryFaint} />
            </View>
          </LinearGradient>
        )}
        <LinearGradient colors={gradients.imageFade} style={styles.fade} />
        {onToggleFavorite && (
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={8}
            accessibilityLabel={business.is_favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            style={styles.heart}
          >
            <Ionicons
              name={business.is_favorite ? 'heart' : 'heart-outline'}
              size={18}
              color={business.is_favorite ? colors.heart : colors.text}
            />
          </Pressable>
        )}
        <View style={styles.coverBadges}>
          <PointsBadge points={business.checkin_points} prefix="+" />
          {distance && (
            <View style={styles.distance}>
              <Ionicons name="navigate" size={11} color={colors.onPrimary} />
              <AppText variant="caption" color="textInverse">
                {distance}
              </AppText>
            </View>
          )}
        </View>
      </View>

      <View style={styles.body}>
        <Avatar uri={business.logo} name={business.name} size={44} rounded="md" style={styles.logo} />
        <View style={{ flex: 1 }}>
          <AppText variant="title" numberOfLines={1}>
            {business.name}
          </AppText>
          <View style={styles.row}>
            <Ionicons name={categoryIcon(business.category?.icon)} size={12} color={colors.textSecondary} />
            <AppText variant="caption" color="textSecondary" numberOfLines={1} style={{ flexShrink: 1 }}>
              {business.category?.name} · {business.address}
            </AppText>
          </View>
        </View>
        <View style={styles.rating}>
          <Ionicons name="star" size={13} color={colors.star} />
          <AppText variant="bodyStrong">{formatRating(business.rating_avg)}</AppText>
          <AppText variant="caption" color="textMuted">
            ({business.rating_count})
          </AppText>
        </View>
      </View>
      {business.my_points !== null && business.my_points !== undefined && (
        <View style={styles.footer}>
          <Ionicons name="wallet-outline" size={14} color={colors.primary} />
          <AppText variant="caption" color="primary">
            Tienes {business.my_points} pts aquí
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cover: { height: 130, backgroundColor: colors.primarySoft },
  coverIcon: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 60 },
  heart: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.glassStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBadges: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.scrimStrong,
  },
  body: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  logo: { borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySoft,
  },
});
