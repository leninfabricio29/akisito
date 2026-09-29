import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, SCREEN_PADDING, spacing } from '@/theme';

import { IconButton } from './icon-button';
import { AppText } from './text';

type Props = { title: string; subtitle?: string; right?: React.ReactNode; onBack?: () => void };

/** Encabezado para pantallas apiladas, con botón regresar. */
export function StackHeader({ title, subtitle, right, onBack }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <IconButton
        icon="chevron-back"
        accessibilityLabel="Regresar"
        background={colors.surfaceMuted}
        onPress={onBack ?? goBack}
      />
      <View style={styles.titles}>
        <AppText variant="h3" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        )}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  titles: { flex: 1 },
  right: { minWidth: 40, alignItems: 'flex-end' },
});
