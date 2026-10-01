import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/theme';

type Props = { onPress: () => void; onNearby: () => void };

export function SearchCard({ onPress, onNearby }: Props) {
  return (
    <View style={[styles.card, shadows.md]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="search"
        accessibilityLabel="Buscar negocios"
        style={({ pressed }) => [styles.search, pressed && { opacity: 0.8 }]}
      >
        <Ionicons name="search" size={20} color={colors.primary} />
        <AppText color="textMuted" style={{ flex: 1 }} numberOfLines={1}>
          Busca cafés, restaurantes, gimnasios…
        </AppText>
      </Pressable>
     
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  nearby: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
