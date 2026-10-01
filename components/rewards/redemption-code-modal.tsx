import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import type { Redemption } from '@/services';
import { colors, radius, shadows, spacing } from '@/theme';
import { formatDateTime } from '@/utils/format';

type Props = { redemption: Redemption | null; onClose: () => void; onSeeAll?: () => void };

/** Muestra el código que el cliente enseña en caja para validar su canje. */
export function RedemptionCodeModal({ redemption, onClose, onSeeAll }: Props) {
  return (
    <Modal visible={!!redemption} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, shadows.lg]}>
          <View style={styles.icon}>
            <Ionicons name="gift" size={30} color={colors.accent} />
          </View>
          <AppText variant="h2" align="center">
            ¡Canje listo!
          </AppText>
          <AppText color="textSecondary" align="center" style={{ marginTop: spacing.xs }}>
            Muestra este código en {redemption?.business.name} para recibir:
          </AppText>
          <AppText variant="title" align="center" style={{ marginTop: spacing.xs }}>
            {redemption?.reward.title}
          </AppText>

          <View style={styles.code}>
            <AppText style={styles.codeText} selectable>
              {redemption?.code}
            </AppText>
          </View>

          <View style={styles.expiry}>
            <Ionicons name="time-outline" size={16} color={colors.warning} />
            <AppText variant="caption" color="textSecondary">
              Válido hasta {redemption ? formatDateTime(redemption.expires_at) : ''}. Si no lo usas, te devolvemos los puntos.
            </AppText>
          </View>

          <Button title="Entendido" onPress={onClose} fullWidth size="lg" />
          {onSeeAll && <Button title="Ver mis canjes" variant="ghost" onPress={onSeeAll} fullWidth style={{ marginTop: spacing.xs }} />}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  icon: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  code: {
    marginVertical: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
  },
  codeText: { fontSize: 24, fontWeight: '800', letterSpacing: 6, color: colors.primaryDark },
  expiry: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginBottom: spacing.xl },
});
