import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

type Props = { value: number; height?: number; color?: string; track?: string };

/** `value` entre 0 y 1. */
export function ProgressBar({ value, height = 6, color = colors.accent, track = colors.surfaceMuted }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={[styles.track, { height, backgroundColor: track }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.pill, overflow: 'hidden', width: '100%' },
  fill: { height: '100%', borderRadius: radius.pill },
});
