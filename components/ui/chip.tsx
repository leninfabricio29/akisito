import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './text';

type Props = {
  label: string;
  selected?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

export function Chip({ label, selected, icon, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [styles.chip, selected ? styles.selected : styles.idle, pressed && { opacity: 0.8 }]}
    >
      {icon && <Ionicons name={icon} size={14} color={selected ? colors.onPrimary : colors.primary} />}
      <AppText variant="caption" style={{ color: selected ? colors.onPrimary : colors.textSecondary }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  idle: { backgroundColor: colors.surface, borderColor: colors.border },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
