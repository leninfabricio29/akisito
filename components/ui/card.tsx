import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '@/theme';

type Props = {
  padded?: boolean;
  elevated?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  accessibilityLabel?: string;
};

export function Card({ padded = true, elevated = true, onPress, style, children, accessibilityLabel }: Props) {
  const content = [styles.card, padded && styles.padded, elevated && shadows.sm, style];
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [content, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={content}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.divider },
  padded: { padding: spacing.lg },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
});
