import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { useBusiness } from '@/context/business-context';
import { errorMessage, portalService } from '@/services';
import type { BusinessStatus } from '@/services';
import { colors, radius, spacing } from '@/theme';

const COPY: Record<Exclude<BusinessStatus, 'approved'>, { title: string; message: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  pending: {
    title: 'Tu negocio está en revisión',
    message: 'Validamos tu RUC y te avisaremos por correo. Mientras tanto completa tu perfil y prepara tus recompensas.',
    icon: 'hourglass-outline',
    color: colors.warning,
    bg: colors.warningSoft,
  },
  rejected: {
    title: 'Tu negocio no fue aprobado',
    message: 'Corrige los datos de tu perfil y vuelve a enviarlo a revisión.',
    icon: 'close-circle-outline',
    color: colors.danger,
    bg: colors.dangerSoft,
  },
  suspended: {
    title: 'Tu negocio está suspendido',
    message: 'Tus clientes no pueden sumar puntos ni canjear. Contacta a soporte.',
    icon: 'alert-circle-outline',
    color: colors.danger,
    bg: colors.dangerSoft,
  },
};

/** Aviso cuando el negocio aún no está aprobado; no muestra nada si lo está. */
export function StatusBanner() {
  const { business, setBusiness } = useBusiness();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();

  if (!business || business.status === 'approved') return null;
  const copy = COPY[business.status];

  const resubmit = async () => {
    setSending(true);
    setError(undefined);
    try {
      setBusiness(await portalService.resubmit());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.box, { backgroundColor: copy.bg }]}>
      <View style={styles.row}>
        <Ionicons name={copy.icon} size={22} color={copy.color} />
        <AppText variant="title" style={{ color: copy.color, flex: 1 }}>
          {copy.title}
        </AppText>
      </View>
      <AppText color="textSecondary" style={{ marginTop: spacing.xs }}>
        {business.status_reason || copy.message}
      </AppText>
      {business.status === 'rejected' && (
        <Button title="Enviar de nuevo a revisión" size="sm" onPress={resubmit} loading={sending} style={{ marginTop: spacing.md, alignSelf: 'flex-start' }} />
      )}
      {error && (
        <AppText variant="caption" color="danger" style={{ marginTop: spacing.xs }}>
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: spacing.lg, borderRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
