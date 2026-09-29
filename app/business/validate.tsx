import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Avatar, Button, Card, EmptyState, IconButton, PointsBadge } from '@/components/ui';
import { useBusiness } from '@/context/business-context';
import { errorMessage, portalService } from '@/services';
import type { BusinessRedemption } from '@/services';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import { formatDateTime } from '@/utils/format';

const CODE_LENGTH = 8;
const ALLOWED = /[^A-HJ-NP-Z2-9]/g; // mismo alfabeto que genera el backend (sin 0/O/1/I)

type State =
  | { step: 'input' }
  | { step: 'preview'; redemption: BusinessRedemption }
  | { step: 'done'; redemption: BusinessRedemption };

export default function ValidateRedemptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isApproved } = useBusiness();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [state, setState] = useState<State>({ step: 'input' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(business)'));

  const lookup = async () => {
    setLoading(true);
    setError(undefined);
    try {
      setState({ step: 'preview', redemption: await portalService.lookupCode(code) });
    } catch (e) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const confirm = async (redemption: BusinessRedemption) => {
    setLoading(true);
    setError(undefined);
    try {
      const validated = await portalService.validateCode(redemption.code);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setState({ step: 'done', redemption: validated });
    } catch (e) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(errorMessage(e));
      // El estado pudo cambiar (p. ej. expiró y se reembolsó): se vuelve a consultar.
      portalService.lookupCode(redemption.code).then((r) => setState({ step: 'preview', redemption: r })).catch(() => undefined);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCode('');
    setError(undefined);
    setState({ step: 'input' });
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <IconButton icon="close" accessibilityLabel="Cerrar" onPress={close} background={colors.surfaceMuted} />
      <AppText variant="h3">Validar canje</AppText>
      <IconButton icon="time-outline" accessibilityLabel="Historial de canjes" onPress={() => router.push('/business/redemptions')} background={colors.surfaceMuted} />
    </View>
  );

  if (!isApproved) {
    return (
      <View style={styles.root}>
        {header}
        <EmptyState icon="lock-closed-outline" title="Disponible al aprobar tu negocio" message="Podrás validar los canjes de tus clientes cuando tu negocio esté aprobado." />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {header}
      <KeyboardAwareScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" enableOnAndroid>
        {state.step === 'input' && (
          <>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Ionicons name="ticket" size={34} color={colors.primary} />
              </View>
              <AppText variant="h2" align="center">
                Código del cliente
              </AppText>
              <AppText color="textSecondary" align="center" style={{ marginTop: spacing.xs }}>
                Pide al cliente el código de {CODE_LENGTH} caracteres que aparece en su app.
              </AppText>
            </View>
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={(v) => {
                setCode(v.toUpperCase().replace(ALLOWED, '').slice(0, CODE_LENGTH));
                setError(undefined);
              }}
              autoFocus
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={CODE_LENGTH}
              placeholder="ABCD2345"
              placeholderTextColor={colors.border}
              style={[styles.code, error && { borderColor: colors.danger }]}
              returnKeyType="search"
              onSubmitEditing={() => code.length === CODE_LENGTH && lookup()}
              accessibilityLabel="Código de canje"
            />
            {error && (
              <AppText color="danger" align="center" style={{ marginTop: spacing.sm }}>
                {error}
              </AppText>
            )}
            <Button title="Buscar canje" icon="search" size="lg" fullWidth loading={loading} disabled={code.length !== CODE_LENGTH} onPress={lookup} style={{ marginTop: spacing.xl }} />
          </>
        )}

        {state.step === 'preview' && <Preview redemption={state.redemption} loading={loading} error={error} onConfirm={() => confirm(state.redemption)} onCancel={reset} />}

        {state.step === 'done' && (
          <View style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="checkmark-circle" size={40} color={colors.success} />
            </View>
            <AppText variant="h2" align="center">
              ¡Canje validado!
            </AppText>
            <AppText color="textSecondary" align="center" style={{ marginTop: spacing.xs }}>
              Entrega <AppText variant="bodyStrong">{state.redemption.reward.title}</AppText> a {state.redemption.client.name}.
            </AppText>
            <Button title="Validar otro código" icon="ticket-outline" size="lg" fullWidth onPress={reset} style={{ marginTop: spacing.xxl }} />
            <Button title="Listo" variant="ghost" fullWidth onPress={close} style={{ marginTop: spacing.xs }} />
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

function Preview({
  redemption,
  loading,
  error,
  onConfirm,
  onCancel,
}: {
  redemption: BusinessRedemption;
  loading: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const expired = new Date(redemption.expires_at) < new Date();
  const pending = redemption.status === 'pending' && !expired;
  const statusText = pending
    ? `Vence ${formatDateTime(redemption.expires_at)}`
    : redemption.status === 'validated' && redemption.validated_at
      ? `Ya se entregó el ${formatDateTime(redemption.validated_at)}`
      : expired && redemption.status === 'pending'
        ? 'El código venció'
        : redemption.status_label;

  return (
    <View>
      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.client}>
          <Avatar name={redemption.client.name} size={48} />
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color="textMuted">
              Cliente
            </AppText>
            <AppText variant="h3">{redemption.client.name}</AppText>
          </View>
        </View>
        <View style={styles.reward}>
          <AppText variant="caption" color="textMuted">
            Recompensa
          </AppText>
          <AppText variant="h2">{redemption.reward.title}</AppText>
          <View style={styles.meta}>
            <PointsBadge points={redemption.points_spent} />
            <AppText variant="caption" color="textSecondary">
              Código {redemption.code}
            </AppText>
          </View>
        </View>
        <View style={[styles.status, { backgroundColor: pending ? colors.warningSoft : colors.surfaceMuted }]}>
          <Ionicons name={pending ? 'time' : 'information-circle'} size={16} color={pending ? colors.warning : colors.textSecondary} />
          <AppText variant="caption" style={{ color: pending ? colors.warning : colors.textSecondary, flex: 1 }}>
            {statusText}
          </AppText>
        </View>
      </Card>
      {error && (
        <AppText color="danger" align="center" style={{ marginTop: spacing.md }}>
          {error}
        </AppText>
      )}
      {pending ? (
        <Button title="Confirmar entrega" icon="checkmark-done" size="lg" fullWidth loading={loading} onPress={onConfirm} style={{ marginTop: spacing.xl }} />
      ) : null}
      <Button title={pending ? 'Cancelar' : 'Buscar otro código'} variant="ghost" fullWidth onPress={onCancel} style={{ marginTop: spacing.xs }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  content: { padding: SCREEN_PADDING, paddingBottom: spacing.xxxl },
  hero: { alignItems: 'center', marginTop: spacing.xl },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  code: {
    marginTop: spacing.xxl,
    height: 72,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 6,
    color: colors.primaryDark,
  },
  client: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reward: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.divider },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md },
});
