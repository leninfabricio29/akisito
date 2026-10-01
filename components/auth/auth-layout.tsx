import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, IconButton } from '@/components/ui';
import { colors, gradients, radius, SCREEN_PADDING, spacing } from '@/theme';

type Props = {
  title: string;
  subtitle: string;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/** Marco común de login, registro y recuperación. */
export function AuthLayout({ title, subtitle, onBack, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + spacing.xl }}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
        >
          {onBack && (
            <IconButton
              icon="chevron-back"
              accessibilityLabel="Regresar"
              onPress={onBack}
              color={colors.onPrimary}
              background={colors.glass}
              style={styles.back}
            />
          )}
          <View >
            <Image
  source={require('../../assets/images/icon.png')}
  style={styles.logo}
/>
          </View>
          <AppText variant="h1" color="textInverse" align="center">
            {title}
          </AppText>
          <AppText align="center" style={styles.subtitle}>
            {subtitle}
          </AppText>
        </LinearGradient>
        <View style={styles.card}>{children}</View>
        {footer && <View style={styles.footer}>{footer}</View>}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: {
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.xxxl + spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  back: { alignSelf: 'flex-start', marginBottom: spacing.sm },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  subtitle: { color: colors.onPrimaryMuted, marginTop: spacing.xs },
  card: {
    marginHorizontal: SCREEN_PADDING,
    marginTop: -spacing.xxxl,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  footer: { alignItems: 'center', marginTop: spacing.xl, paddingHorizontal: SCREEN_PADDING },
});
