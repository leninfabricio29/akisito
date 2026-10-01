import { Ionicons } from '@expo/vector-icons';
import { Linking, Modal, StyleSheet, View } from 'react-native';

import { useAppUpdate } from '@/hooks/use-app-update';
import { colors, radius, shadows, spacing } from '@/theme';

import { Button } from './button';
import { AppText } from './text';

/**
 * Modal centrado que invita (u obliga, si la versión es menor a la mínima) a actualizar desde la tienda.
 * Se monta una sola vez en el layout raíz.
 */
export function UpdateModal() {
  const { update, dismiss } = useAppUpdate();

  const openStore = () => {
    if (update) void Linking.openURL(update.storeUrl);
  };

  return (
    <Modal
      visible={!!update}
      transparent
      animationType="fade"
      statusBarTranslucent
      // Obligatoria: el botón atrás de Android no la cierra.
      onRequestClose={() => !update?.required && dismiss()}
    >
      <View style={styles.overlay}>
        <View style={[styles.box, shadows.lg]}>
          <View style={styles.icon}>
            <Ionicons name="cloud-download" size={32} color={colors.primary} />
          </View>
          <AppText variant="h3" align="center">
            {update?.required ? 'Actualización necesaria' : 'Nueva versión disponible'}
          </AppText>
          <AppText color="textSecondary" align="center" style={styles.message}>
            {update?.message}
          </AppText>
          {update?.required && (
            <AppText variant="caption" color="textMuted" align="center" style={{ marginBottom: spacing.md }}>
              Esta versión ya no es compatible. Actualiza para seguir usando Akisito.
            </AppText>
          )}
          <Button title="Actualizar ahora" icon="arrow-up-circle" size="lg" fullWidth onPress={openStore} />
          {!update?.required && (
            <Button title="Más tarde" variant="ghost" fullWidth onPress={dismiss} style={{ marginTop: spacing.xs }} />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  box: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'stretch',
  },
  icon: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  message: { marginTop: spacing.sm, marginBottom: spacing.lg },
});
