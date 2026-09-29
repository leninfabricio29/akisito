import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './text';

type Props = { points: number; prefix?: string; size?: 'sm' | 'md'; inverted?: boolean };

export function PointsBadge({ points, prefix = '', size = 'sm', inverted }: Props) {
  return (
    <View style={[styles.badge, size === 'md' && styles.md, inverted && styles.inverted]}>
      <Ionicons name="star" size={size === 'sm' ? 12 : 16} color={colors.accent} />
      <AppText
        variant={size === 'sm' ? 'caption' : 'bodyStrong'}
        style={{ color: inverted ? colors.onPrimary : colors.primaryDark }}
      >
        {prefix}
        {points} pts
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignSelf: 'flex-start',
  },
  md: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 1 },
  inverted: { backgroundColor: colors.glass },
});
