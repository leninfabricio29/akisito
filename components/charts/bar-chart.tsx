import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export type BarDatum = { label: string; value: number; detail?: string };

type Props = {
  data: BarDatum[];
  height?: number;
  color?: string;
  /** Cada cuántas barras se muestra la etiqueta del eje (para series largas). */
  labelEvery?: number;
  emptyMessage?: string;
};

/** Gráfico de barras dibujado con Views; tocar una barra muestra su valor. */
export function BarChart({ data, height = 140, color = colors.primary, labelEvery = 1, emptyMessage = 'Sin datos en este periodo' }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const active = selected !== null ? data[selected] : null;

  if (!data.length || total === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <AppText variant="caption" color="textMuted">
          {emptyMessage}
        </AppText>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.tooltip}>
        {active ? (
          <AppText variant="caption" color="textSecondary">
            <AppText variant="caption" style={{ fontWeight: '700', color: colors.text }}>
              {active.detail ?? active.label}
            </AppText>
            {`  ·  ${active.value}`}
          </AppText>
        ) : (
          <AppText variant="caption" color="textMuted">
            Toca una barra para ver el detalle
          </AppText>
        )}
      </View>
      <View style={[styles.bars, { height }]}>
        {data.map((d, i) => {
          const isActive = selected === i;
          return (
            <Pressable
              key={`${d.label}-${i}`}
              style={styles.column}
              onPress={() => setSelected(isActive ? null : i)}
              accessibilityLabel={`${d.detail ?? d.label}: ${d.value}`}
            >
              <View
                style={[
                  styles.bar,
                  {
                    height: `${Math.max((d.value / max) * 100, d.value ? 4 : 1.5)}%`,
                    backgroundColor: isActive ? colors.accent : d.value ? color : colors.surfaceMuted,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <View key={`${d.label}-l-${i}`} style={styles.column}>
            {i % labelEvery === 0 && (
              <AppText variant="caption" color="textMuted" style={styles.label} numberOfLines={1}>
                {d.label}
              </AppText>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  tooltip: { minHeight: 18, marginBottom: spacing.sm },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: { width: '100%', maxWidth: 26, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  labels: { flexDirection: 'row', gap: 3, marginTop: spacing.xs },
  label: { fontSize: 10 },
});
