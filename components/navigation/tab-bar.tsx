import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export type TabConfig = { label: string; icon: IconName; iconActive: IconName };
export type CenterAction = { route: string; label: string; icon: IconName; accessibilityLabel: string; onPress: () => void };

type Props = BottomTabBarProps & { tabs: Record<string, TabConfig>; center: CenterAction };

export const TAB_BAR_HEIGHT = 64;
const CENTER_SIZE = 64;

/** Barra inferior con un botón central sobresaliente (Escanear para clientes, Validar para negocios). */
export function TabBar({ state, navigation, tabs, center }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, shadows.lg, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {state.routes.map((route, index) => {
        if (route.name === center.route) {
          return (
            <View key={route.key} style={styles.item}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={center.accessibilityLabel}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  center.onPress();
                }}
                style={({ pressed }) => [styles.center, shadows.lg, pressed && { transform: [{ scale: 0.95 }] }]}
              >
                <Ionicons name={center.icon} size={30} color={colors.onPrimary} />
              </Pressable>
              <AppText variant="caption" color="primary" style={styles.centerLabel}>
                {center.label}
              </AppText>
            </View>
          );
        }

        const config = tabs[route.name];
        if (!config) return null;
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            if (Platform.OS !== 'web') void Haptics.selectionAsync();
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={config.label}
            onPress={onPress}
            style={styles.item}
          >
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? config.iconActive : config.icon}
                size={22}
                color={focused ? colors.primary : colors.textMuted}
              />
            </View>
            <AppText variant="caption" style={{ color: focused ? colors.primary : colors.textMuted, fontSize: 11 }}>
              {config.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.divider,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2, minHeight: TAB_BAR_HEIGHT - spacing.sm },
  iconWrap: { width: 44, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: colors.primarySoft },
  center: {
    position: 'absolute',
    top: -CENTER_SIZE / 2 - spacing.xs,
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: colors.surface,
  },
  centerLabel: { fontSize: 11, fontWeight: '700' },
});
