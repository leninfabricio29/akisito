/**
 * Paleta de Akisito.
 *
 * Color base de la marca: #233AB4 (primary.600).
 * Las pantallas NUNCA deben usar hex directos: importan `colors` (tokens semánticos)
 * o, si necesitan un tono concreto, `palette`.
 */

export const palette = {
  primary: {
    50:  '#EEF0FB',
    100: '#DDE1F6',
    200: '#BAC2EE',
    300: '#8F9BE0',
    400: '#6472CE',
    500: '#4655BC',
    600: '#2F3FA8',   // marca
    700: '#25348A',
    800: '#1E2A6E',
    900: '#182153',
    950: '#0E1436',
  },
  accent: {
    // Cobre en vez de dorado puro — más adulto, menos "medalla"
    50:  '#FBF3ED',
    100: '#F5E2D0',
    200: '#EBC4A1',
    300: '#DFA172',
    400: '#D07E4B',
    500: '#B8632F',   // fondo de badge
    600: '#9C4F22',
    700: '#7A3D1B',   // ← texto AA: 6.1:1 ✅
    800: '#5C2D14',
    900: '#3D1D0D',
  },
  neutral: {
    // Neutros CÁLIDOS (tinte marrón sutil) — contrasta con el índigo
    0:   '#FFFFFF',
    50:  '#FAF9F7',
    100: '#F3F1ED',
    200: '#E7E4DE',
    300: '#D0CCC3',
    400: '#9F9A8E',
    500: '#716C61',   // ← texto secundario: 5.0:1 ✅
    600: '#514D45',
    700: '#3A3730',
    800: '#24221D',
    900: '#141310',
    950: '#0A0907',
  },
  success: {
    50:  '#E9F7EF',
    100: '#CEEEDA',
    400: '#34C77B',
    500: '#1EA35C',
    600: '#178A4C',
    700: '#126E3D',
    900: '#063D21',
  },
  warning: {
    50:  '#FDF4E3',
    100: '#FAE6BE',
    400: '#F0B040',
    500: '#D99022',
    600: '#BC7A14',
    700: '#96610F',
    900: '#4F3307',
  },
  danger: {
    50:  '#FCEDEC',
    100: '#F8D7D5',
    400: '#EE6E68',
    500: '#D94A44',
    600: '#C03A34',
    700: '#9E2F2A',
    900: '#5A1A17',
  },
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
  primaryD: [palette.primary[600], palette.primary[900]] as const,
  accent: [palette.accent[400], palette.accent[600]] as const,
  imageFade: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)'] as const,
  imageFadeTop: ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)'] as const,
};

export type ColorToken = keyof typeof colors;
