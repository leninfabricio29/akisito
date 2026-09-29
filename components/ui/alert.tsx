import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '@/theme';

import { AppText } from './text';

export type AlertType = 'success' | 'error' | 'info' | 'confirm';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'destructive' | 'cancel';
}

export interface AlertConfig {
  type: AlertType;
  title: string;
  message: string;
  buttons: AlertButton[];
  onDismiss?: () => void;
}

type Props = { visible: boolean; config: AlertConfig; onDismiss: () => void };

const ICONS: Record<AlertType, { name: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  success: { name: 'checkmark-circle', color: colors.success, bg: colors.successSoft },
  error: { name: 'alert-circle', color: colors.danger, bg: colors.dangerSoft },
  info: { name: 'information-circle', color: colors.primary, bg: colors.primarySoft },
  confirm: { name: 'help-circle', color: colors.warning, bg: colors.warningSoft },
};

export default function Alert({ visible, config, onDismiss }: Props) {
  const icon = ICONS[config.type] ?? ICONS.info;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.box, shadows.lg]}>
          <View style={[styles.icon, { backgroundColor: icon.bg }]}>
            <Ionicons name={icon.name} size={30} color={icon.color} />
          </View>
          <AppText variant="h3" align="center">
            {config.title}
          </AppText>
          {!!config.message && (
            <AppText color="textSecondary" align="center" style={styles.message}>
              {config.message}
            </AppText>
          )}
          <View style={styles.buttons}>
            {config.buttons.map((button, index) => {
              const primary = button.style !== 'cancel';
              const destructive = button.style === 'destructive';
              return (
                <Pressable
                  key={`${button.text}-${index}`}
                  onPress={() => {
                    onDismiss();
                    button.onPress?.();
                  }}
                  style={({ pressed }) => [
                    styles.button,
                    primary ? { backgroundColor: destructive ? colors.danger : colors.primary } : styles.cancel,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <AppText variant="bodyStrong" style={{ color: primary ? colors.onPrimary : colors.textSecondary }}>
                    {button.text}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  box: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  message: { marginTop: spacing.sm },
  buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, alignSelf: 'stretch' },
  button: { flex: 1, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.surfaceMuted },
});
