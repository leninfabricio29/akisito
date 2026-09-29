/**
 * Paleta de Akisito.
 *
 * Color base de la marca: #233AB4 (primary.600).
 * Las pantallas NUNCA deben usar hex directos: importan `colors` (tokens semánticos)
 * o, si necesitan un tono concreto, `palette`.
 */

export const palette = {
  primary: {
    50: '#EEF1FC',
    100: '#DDE3F8',
    200: '#B9C4F1',
    300: '#8E9FE6',
    400: '#5F76D6',
    500: '#3D55C4',
    600: '#233AB4',
    700: '#1C2F94',
    800: '#172674',
    900: '#111C56',
    950: '#0B1238',
  },
  accent: {
    // Dorado para puntos y recompensas
    50: '#FFF8EB',
    100: '#FDEBC8',
    400: '#F7B53D',
    500: '#F29F0D',
    600: '#D98300',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F6F8FC',
    100: '#EEF1F7',
    200: '#E2E7F0',
    300: '#CBD2DF',
    400: '#98A2B8',
    500: '#6B7690',
    600: '#4B5570',
    700: '#333C54',
    800: '#1F263B',
    900: '#111627',
  },
  success: { 50: '#E8F8EE', 500: '#1FA35B', 700: '#157A43' },
  warning: { 50: '#FFF5E5', 500: '#E68A00', 700: '#B36B00' },
  danger: { 50: '#FDECEC', 500: '#E0393E', 700: '#B3262B' },
} as const;

export const colors = {
  // Marca
  primary: palette.primary[600],
  primaryDark: palette.primary[800],
  primaryLight: palette.primary[400],
  primarySoft: palette.primary[50],
  primaryBorder: palette.primary[100],
  onPrimary: palette.neutral[0],

  accent: palette.accent[500],
  accentSoft: palette.accent[50],
  onAccent: palette.neutral[900],

  // Superficies
  background: palette.neutral[50],
  surface: palette.neutral[0],
  surfaceMuted: palette.neutral[100],
  border: palette.neutral[200],
  divider: palette.neutral[100],
  overlay: 'rgba(17, 22, 39, 0.55)',
  scrim: 'rgba(0, 0, 0, 0.35)',
  scrimStrong: 'rgba(0, 0, 0, 0.45)',
  camera: '#000000',

  // Sobre fondos de marca (degradados azules)
  onPrimaryMuted: 'rgba(255, 255, 255, 0.8)',
  onPrimaryFaint: 'rgba(255, 255, 255, 0.3)',
  glass: 'rgba(255, 255, 255, 0.18)',
  glassStrong: 'rgba(255, 255, 255, 0.92)',

  // Texto
  text: palette.neutral[900],
  textSecondary: palette.neutral[600],
  textMuted: palette.neutral[400],
  textInverse: palette.neutral[0],

  // Estados
  success: palette.success[500],
  successSoft: palette.success[50],
  warning: palette.warning[500],
  warningSoft: palette.warning[50],
  danger: palette.danger[500],
  dangerSoft: palette.danger[50],
  info: palette.primary[500],
  infoSoft: palette.primary[50],

  star: palette.accent[400],
  heart: palette.danger[500],
} as const;

export const gradients = {
  primary: [palette.primary[500], palette.primary[700]] as const,
  primaryDeep: [palette.primary[600], palette.primary[900]] as const,
  accent: [palette.accent[400], palette.accent[600]] as const,
  imageFade: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)'] as const,
  imageFadeTop: ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)'] as const,
};

export type ColorToken = keyof typeof colors;
