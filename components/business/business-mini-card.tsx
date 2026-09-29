import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import type { BusinessSummary } from '@/services';
import { colors, radius, shadows, spacing } from '@/theme';
import { categoryIcon } from '@/utils/category-icon';
import { formatRating } from '@/utils/format';

type Props = { business: BusinessSummary; width: number; onPress: () => void };

/** Tarjeta compacta para carruseles (3 por pantalla). */
export function BusinessMiniCard({ business, width, onPress }: Props) {
  const image = business.logo || business.cover;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={business.name}
      style={({ pressed }) => [styles.card, shadows.sm, { width }, pressed && { opacity: 0.9 }]}
    >
      <View style={[styles.imageWrap, { height: width - spacing.md }]}>
        {image ? (
          <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <Ionicons name={categoryIcon(business.category?.icon)} size={30} color={colors.primary} />
        )}
      </View>
      <AppText variant="caption" numberOfLines={1} style={styles.name}>
        {business.name}
      </AppText>
      <View style={styles.meta}>
        <Ionicons name="star" size={11} color={colors.star} />
        <AppText variant="caption" color="textSecondary" style={styles.metaText}>
          {formatRating(business.rating_avg)}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  imageWrap: {
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  name: { marginTop: spacing.xs + 2, color: colors.text, fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1, marginBottom: 2 },
  metaText: { fontSize: 11 },
});
