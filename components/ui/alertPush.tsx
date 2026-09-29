import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadows, spacing } from '@/theme';

import { AppText } from './text';

type Props = { visible: boolean; title: string; body: string; onClose: () => void; onPress?: () => void };

const AUTO_HIDE_MS = 5000;

/** Aviso tipo banner para notificaciones push recibidas con la app abierta. */
export default function PushBanner({ visible, title, body, onClose, onPress }: Props) {
  const insets = useSafeAreaInsets();
  const translate = useRef(new Animated.Value(-160)).current;

  useEffect(() => {
    Animated.spring(translate, { toValue: visible ? 0 : -160, useNativeDriver: true, bounciness: 6 }).start();
    if (!visible) return;
    const timer = setTimeout(onClose, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [onClose, translate, visible]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.wrap, { top: insets.top + spacing.sm, transform: [{ translateY: translate }] }]}
    >
      <Pressable
        style={[styles.card, shadows.lg]}
        onPress={() => {
          onClose();
          onPress?.();
        }}
      >
        <View style={styles.icon}>
          <Ionicons name="notifications" size={18} color={colors.onPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {title}
          </AppText>
          {!!body && (
            <AppText variant="caption" color="textSecondary" numberOfLines={2}>
              {body}
            </AppText>
          )}
        </View>
        <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Cerrar">
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 1000 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
