import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { Button } from './button';
import { AppText } from './text';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

export function EmptyState({ icon, title, message, actionLabel, onAction, compact }: Props) {
  return (
    <View style={[styles.wrap, compact && { paddingVertical: spacing.xl }]}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <AppText variant="h3" align="center">
        {title}
      </AppText>
      {message && (
        <AppText color="textSecondary" align="center" style={styles.message}>
          {message}
        </AppText>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="secondary" size="sm" style={{ marginTop: spacing.md }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xxxl * 1.5, paddingHorizontal: spacing.xxl },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  message: { marginTop: spacing.xs },
});
