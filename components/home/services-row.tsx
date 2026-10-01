import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, SectionHeader, Skeleton } from '@/components/ui';
import { colors, gradients, radius, shadows, spacing } from '@/theme';

type Props = {
  points: number;
  loading: boolean;
  onFavorites: () => void;
  onPoints: () => void;
  onVisits: () => void;
};

function SideButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.side, shadows.sm, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.sideIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <AppText variant="caption" color="textSecondary" numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Accesos rápidos del inicio: favoritos, total de puntos (al centro) y visitas. */
export function ServicesRow({ points, loading, onFavorites, onPoints, onVisits }: Props) {
  return (
    <View>
      <SectionHeader title="Accesos rápidos" />
      <View style={styles.row}>
        <SideButton icon="heart" label="Mis favoritos" onPress={onFavorites} />
        <SideButton icon="wallet" label="Mis puntos" onPress={onPoints} />
        <SideButton icon="time" label="Mis visitas" onPress={onVisits} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  side: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  sideIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrap: { flex: 1.2, borderRadius: radius.lg },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
  },
});
