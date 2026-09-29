import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, RatingStars } from '@/components/ui';
import type { PublicReview } from '@/services';
import { colors, radius, spacing } from '@/theme';
import { timeAgo } from '@/utils/format';

export function ReviewItem({ review, businessName }: { review: PublicReview; businessName: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar uri={review.avatar} name={review.author} size={38} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">{review.author}</AppText>
          <View style={styles.meta}>
            <RatingStars value={review.rating} size={12} />
            <AppText variant="caption" color="textMuted">
              {timeAgo(review.created_at)}
            </AppText>
          </View>
        </View>
      </View>
      {!!review.comment && <AppText style={{ marginTop: spacing.sm }}>{review.comment}</AppText>}
      {!!review.reply && (
        <View style={styles.reply}>
          <AppText variant="caption" color="primary" style={{ fontWeight: '700' }}>
            Respuesta de {businessName}
          </AppText>
          <AppText variant="body" color="textSecondary" style={{ marginTop: 2 }}>
            {review.reply}
          </AppText>
        </View>
      )}
    </View>
  );
}

export function RatingSummaryCard({
  average,
  count,
  breakdown,
}: {
  average: number;
  count: number;
  breakdown: Record<string, number>;
}) {
  const max = Math.max(1, ...Object.values(breakdown));
  return (
    <View style={[styles.card, styles.summary]}>
      <View style={styles.summaryLeft}>
        <AppText variant="display">{average > 0 ? average.toFixed(1) : '—'}</AppText>
        <RatingStars value={average} size={14} />
        <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
          {count} {count === 1 ? 'reseña' : 'reseñas'}
        </AppText>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        {[5, 4, 3, 2, 1].map((star) => (
          <View key={star} style={styles.bar}>
            <AppText variant="caption" color="textSecondary" style={{ width: 10 }}>
              {star}
            </AppText>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${((breakdown[String(star)] ?? 0) / max) * 100}%` }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  reply: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  summaryLeft: { alignItems: 'center' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.star, borderRadius: 3 },
});
