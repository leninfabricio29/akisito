import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius, shadows } from '@/theme';

import { AppText } from './text';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  color?: string;
  background?: string;
  badge?: number;
  elevated?: boolean;
  accessibilityLabel: string;
  style?: ViewStyle;
};

export function IconButton({
  icon,
  onPress,
  size = 40,
  color = colors.text,
  background = colors.surface,
  badge,
  elevated,
  accessibilityLabel,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, backgroundColor: background, opacity: pressed ? 0.7 : 1 },
        elevated && shadows.md,
        style,
      ]}
    >
      <Ionicons name={icon} size={size * 0.5} color={color} />
      {!!badge && badge > 0 && (
        <View style={styles.badge}>
          <AppText variant="caption" color="textInverse" style={styles.badgeText}>
            {badge > 99 ? '99+' : badge}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: { fontSize: 10, lineHeight: 12, fontWeight: '700' },
});
