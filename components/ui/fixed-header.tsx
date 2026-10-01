import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, SCREEN_PADDING, spacing } from '@/theme';

type Props = { children: React.ReactNode; style?: StyleProp<ViewStyle> };

/**
 * Encabezado fijo de las pantallas principales: queda arriba y solo scrollea el contenido
 * que va debajo (colócalo antes del ScrollView/FlatList, no dentro).
 */
export function FixedHeader({ children, style }: Props) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.header, { paddingTop: insets.top + spacing.md }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    zIndex: 1,
  },
});
