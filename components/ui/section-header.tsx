import { Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from './text';

type Props = { title: string; subtitle?: string; actionLabel?: string; onAction?: () => void };

export function SectionHeader({ title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <AppText variant="h3">{title}</AppText>
        {subtitle && (
          <AppText variant="caption" color="textSecondary">
            {subtitle}
          </AppText>
        )}
      </View>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <AppText variant="bodyStrong" color="primary">
            {actionLabel}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
});
