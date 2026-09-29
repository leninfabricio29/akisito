import { Text as RNText, TextProps } from 'react-native';

import { colors, ColorToken, typography, TypographyVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
};

export function AppText({ variant = 'body', color = 'text', align, style, ...rest }: Props) {
  return <RNText {...rest} style={[typography[variant], { color: colors[color], textAlign: align }, style]} />;
}
