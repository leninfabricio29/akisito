import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Card, SectionHeader, Skeleton } from '@/components/ui';
import type { Category } from '@/services';
import { colors, radius, spacing } from '@/theme';
import { categoryIcon } from '@/utils/category-icon';

type Props = { categories: Category[]; loading: boolean; onSelect: (category: Category) => void };

export function CategoriesCard({ categories, loading, onSelect }: Props) {
  return (
    <Card>
      <SectionHeader title="Categorías" subtitle="¿Qué se te antoja hoy?" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={styles.item}>
                <Skeleton width={56} height={56} rounded={radius.lg} />
                <Skeleton width={48} height={10} style={{ marginTop: spacing.sm }} />
              </View>
            ))
          : categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => onSelect(category)}
                accessibilityRole="button"
                accessibilityLabel={category.name}
                style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
              >
                <View style={styles.icon}>
                  <Ionicons name={categoryIcon(category.icon)} size={24} color={colors.primary} />
                </View>
                <AppText variant="caption" color="textSecondary" numberOfLines={1} style={styles.label}>
                  {category.name}
                </AppText>
              </Pressable>
            ))}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.md, paddingRight: spacing.xs },
  item: { width: 68, alignItems: 'center' },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { marginTop: spacing.xs + 2, textAlign: 'center' },
});
