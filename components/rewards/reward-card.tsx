import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, PointsBadge, ProgressBar } from '@/components/ui';
import type { Reward } from '@/services';
import { colors, radius, shadows, spacing } from '@/theme';
import { formatDate } from '@/utils/format';

type Props = {
  reward: Reward;
  redeeming?: boolean;
  showBusiness?: boolean;
  onRedeem: () => void;
  onOpenBusiness?: () => void;
};

export function RewardCard({ reward, redeeming, showBusiness = true, onRedeem, onOpenBusiness }: Props) {
  const mine = reward.my_points ?? 0;
  const missing = Math.max(reward.points_required - mine, 0);

  return (
    <View style={[styles.card, shadows.sm]}>
      <View style={styles.top}>
        <View style={styles.image}>
          {reward.image ? (
            <Image source={{ uri: reward.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          ) : (
            <Ionicons name="gift" size={30} color={colors.primary} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          {showBusiness && (
            <Pressable onPress={onOpenBusiness} hitSlop={6} disabled={!onOpenBusiness}>
              <AppText variant="caption" color="primary" numberOfLines={1}>
                {reward.business.name}
              </AppText>
            </Pressable>
          )}
          <AppText variant="title" numberOfLines={2} style={{ marginTop: 2 }}>
            {reward.title}
          </AppText>
          {!!reward.description && (
            <AppText variant="caption" color="textSecondary" numberOfLines={2} style={{ marginTop: 2 }}>
              {reward.description}
            </AppText>
          )}
          <View style={styles.meta}>
            <PointsBadge points={reward.points_required} />
            {reward.ends_at && (
              <AppText variant="caption" color="textMuted">
                Hasta {formatDate(reward.ends_at)}
              </AppText>
            )}
            {reward.stock_left !== null && reward.stock_left <= 10 && (
              <AppText variant="caption" color="warning">
                Quedan {reward.stock_left}
              </AppText>
            )}
          </View>
        </View>
      </View>

      <View style={styles.bottom}>
        <View style={{ flex: 1 }}>
          <ProgressBar value={mine / reward.points_required} />
          <AppText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
            {reward.can_redeem ? `Tienes ${mine} pts · ¡Ya puedes canjearlo!` : `Tienes ${mine} pts · te faltan ${missing}`}
          </AppText>
        </View>
        <Button
          title={reward.can_redeem ? 'Canjear' : 'Bloqueado'}
          icon={reward.can_redeem ? 'gift' : 'lock-closed'}
          size="sm"
          variant={reward.can_redeem ? 'primary' : 'secondary'}
          disabled={!reward.can_redeem}
          loading={redeeming}
          onPress={onRedeem}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  top: { flexDirection: 'row', gap: spacing.md },
  image: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});
