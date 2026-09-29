import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, ProgressBar } from '@/components/ui';
import type { Wallet } from '@/services';
import { colors, gradients, radius, spacing } from '@/theme';

type Props = { wallet: Wallet; width: number; onPress: () => void };

export function WalletCard({ wallet, width, onPress }: Props) {
  const next = wallet.next_reward;
  const progress = next ? wallet.points_balance / next.points_required : 1;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Puntos en ${wallet.business.name}`}>
      <LinearGradient colors={gradients.primaryDeep} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, { width }]}>
        <View style={styles.row}>
          <Avatar uri={wallet.business.logo} name={wallet.business.name} size={36} rounded="md" />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong" color="textInverse" numberOfLines={1}>
              {wallet.business.name}
            </AppText>
            <AppText variant="caption" style={styles.soft} numberOfLines={1}>
              {wallet.checkins_count} {wallet.checkins_count === 1 ? 'visita' : 'visitas'}
            </AppText>
          </View>
        </View>
        <View style={styles.balance}>
          <AppText variant="display" color="textInverse">
            {wallet.points_balance}
          </AppText>
          <AppText variant="bodyStrong" style={styles.soft}>
            pts
          </AppText>
        </View>
        <ProgressBar value={progress} track={colors.glass} />
        <AppText variant="caption" style={[styles.soft, { marginTop: spacing.xs + 2 }]} numberOfLines={1}>
          {next
            ? `Te faltan ${next.points_missing} pts para ${next.title}`
            : wallet.redeemable_rewards
              ? `¡Tienes ${wallet.redeemable_rewards} ${wallet.redeemable_rewards === 1 ? 'premio disponible' : 'premios disponibles'}!`
              : 'Sigue sumando en tus visitas'}
        </AppText>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, padding: spacing.lg, height: 168 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  balance: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.sm },
  soft: { color: colors.onPrimaryMuted },
});
