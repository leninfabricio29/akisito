import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

type Props = {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  tint?: string;
  /** Variación porcentual contra el periodo anterior (null = sin comparación). */
  change?: number | null;
  hint?: string;
};

export function KpiCard({ label, value, icon, tint = colors.primary, change, hint }: Props) {
  const hasChange = change !== undefined && change !== null;
  const up = (change ?? 0) >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: `${tint}1A` }]}>
          <Ionicons name={icon} size={16} color={tint} />
        </View>
        {hasChange && (
          <View style={[styles.change, { backgroundColor: up ? colors.successSoft : colors.dangerSoft }]}>
            <Ionicons name={up ? 'arrow-up' : 'arrow-down'} size={11} color={up ? colors.success : colors.danger} />
            <AppText variant="caption" style={{ color: up ? colors.success : colors.danger, fontSize: 11 }}>
              {Math.abs(change ?? 0)}%
            </AppText>
          </View>
        )}
      </View>
      <AppText variant="h2" style={{ marginTop: spacing.sm }}>
        {value}
      </AppText>
      <AppText variant="caption" color="textSecondary" numberOfLines={1}>
        {label}
      </AppText>
      {hint && (
        <AppText variant="caption" color="textMuted" numberOfLines={1} style={{ fontSize: 11 }}>
          {hint}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icon: { width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  change: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill },
});
