import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

type Props = { value: number; size?: number; onChange?: (value: number) => void };

export function RatingStars({ value, size = 14, onChange }: Props) {
  return (
    <View style={[styles.row, onChange && { gap: spacing.sm }]} accessibilityLabel={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const name = value >= star ? 'star' : value >= star - 0.5 ? 'star-half' : 'star-outline';
        const color = value >= star - 0.5 ? colors.star : colors.textMuted;
        const icon = <Ionicons name={name} size={size} color={color} />;
        return onChange ? (
          <Pressable key={star} onPress={() => onChange(star)} hitSlop={6} accessibilityLabel={`${star} estrellas`}>
            {icon}
          </Pressable>
        ) : (
          <View key={star}>{icon}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: spacing.xxs } });
