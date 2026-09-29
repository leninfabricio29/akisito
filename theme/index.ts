import { Platform, TextStyle, ViewStyle } from 'react-native';

import { colors, gradients, palette } from './colors';

export { colors, gradients, palette };
export type { ColorToken } from './colors';

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Margen horizontal estándar de las pantallas. */
export const SCREEN_PADDING = spacing.lg;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '800' },
  h1: { fontSize: 24, lineHeight: 30, fontWeight: '800' },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  h3: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  title: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  bodyStrong: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

const shadow = (elevation: number, opacity: number, radiusValue: number, offsetY: number): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: palette.primary[900],
      shadowOpacity: opacity,
      shadowRadius: radiusValue,
      shadowOffset: { width: 0, height: offsetY },
    },
    default: { elevation, shadowColor: palette.primary[900] },
  })!;

export const shadows = {
  none: {} as ViewStyle,
  sm: shadow(2, 0.06, 6, 2),
  md: shadow(5, 0.1, 12, 4),
  lg: shadow(10, 0.16, 20, 8),
} as const;

export const theme = { colors, palette, gradients, spacing, radius, typography, shadows } as const;
export type Theme = typeof theme;
