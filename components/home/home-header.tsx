import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Avatar, IconButton } from '@/components/ui';
import { colors, gradients, SCREEN_PADDING, spacing } from '@/theme';
import { firstName, greeting } from '@/utils/format';

type Props = {
  name: string;
  avatar: string | null;
  unread: number;
  onNotifications: () => void;
  onProfile: () => void;
};

export function HomeHeader({ name, avatar, unread, onNotifications, onProfile }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing.md }]}
    >
      <View style={styles.row}>
        <View style={styles.greeting}>
          <Pressable onPress={onProfile} accessibilityRole="button" accessibilityLabel="Ir a mi perfil">
            <Avatar uri={avatar} name={name} size={46} borderColor={colors.onPrimaryFaint} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" style={styles.soft}>
              {greeting()},
            </AppText>
            <AppText variant="h2" color="textInverse" numberOfLines={1}>
              {firstName(name) || 'bienvenido'} 👋
            </AppText>
          </View>
        </View>
        <IconButton
          icon="notifications-outline"
          accessibilityLabel={unread ? `Notificaciones, ${unread} sin leer` : 'Notificaciones'}
          badge={unread}
          onPress={onNotifications}
          color={colors.onPrimary}
          background={colors.glass}
          size={44}
        />
      </View>
      <AppText variant="body" style={[styles.soft, styles.tagline]}>
        Visita tus lugares favoritos, escanea y gana puntos.
      </AppText>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  soft: { color: colors.onPrimaryMuted, fontSize: 12, lineHeight: 20 },
  tagline: { marginTop: spacing.sm },
});
