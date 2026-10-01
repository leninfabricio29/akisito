/**
 * Escáner de QR (tab central).
 *
 * El cliente apunta al QR del negocio; en la misma acción se obtiene su ubicación y se envía a la API,
 * que valida que esté en el local y otorga los puntos. No hay botón "Estoy aquí".
 */

import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReviewForm } from '@/components/reviews/review-form';
import { AppText, Avatar, Button, IconButton } from '@/components/ui';
import { getCurrentLocation, LocationPermissionError } from '@/hooks/use-current-location';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { ApiError, errorMessage, loyaltyService } from '@/services';
import type { MyReview, ScanResult } from '@/services';
import { colors, radius, shadows, spacing } from '@/theme';
import { formatTime } from '@/utils/format';

const QR_PREFIX = 'akisito://checkin/';
const FRAME = 250;

type State =
  | { step: 'scanning' }
  | { step: 'processing'; message: string }
  | { step: 'success'; result: ScanResult; review?: MyReview; reviewing: boolean }
  | { step: 'error'; title: string; message: string; openSettings?: boolean };

function describeError(error: unknown): Extract<State, { step: 'error' }> {
  if (error instanceof LocationPermissionError) {
    return { step: 'error', title: 'Activa tu ubicación', message: error.message, openSettings: true };
  }
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'checkin_cooldown': {
        const next = typeof error.data.next_checkin_at === 'string' ? formatTime(error.data.next_checkin_at) : null;
        return {
          step: 'error',
          title: 'Ya registraste tu visita',
          message: next ? `Podrás sumar puntos aquí de nuevo desde las ${next}.` : error.message,
        };
      }
      case 'checkin_out_of_range':
        return { step: 'error', title: 'Estás lejos del negocio', message: error.message };
      case 'checkin_low_accuracy':
        return { step: 'error', title: 'Señal GPS débil', message: error.message };
      case 'invalid_qr':
        return { step: 'error', title: 'QR no válido', message: error.message };
      case 'checkin_daily_limit':
        return { step: 'error', title: 'Límite diario alcanzado', message: error.message };
      default:
        return { step: 'error', title: 'No se pudo registrar tu visita', message: error.message };
    }
  }
  return { step: 'error', title: 'Algo salió mal', message: errorMessage(error) };
}

export default function ScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Edge-to-edge: la hoja se levanta a mano sobre el teclado al escribir la reseña.
  const keyboard = useKeyboardHeight();
  const { height: screenHeight } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [state, setState] = useState<State>({ step: 'scanning' });
  const busy = useRef(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const onScanned = async ({ data }: { data: string }) => {
    if (busy.current) return;
    busy.current = true;

    if (!data.startsWith(QR_PREFIX)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setState({ step: 'error', title: 'Este QR no es de Akisito', message: 'Escanea el código QR del negocio aliado.' });
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setState({ step: 'processing', message: 'Confirmando que estás en el negocio…' });
      const location = await getCurrentLocation();
      setState({ step: 'processing', message: 'Registrando tu visita…' });
      const result = await loyaltyService.scan({
        qr: data,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        is_mocked: location.isMocked,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setState({ step: 'success', result, reviewing: false });
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setState(describeError(error));
    }
  };

  const scanAgain = () => {
    busy.current = false;
    setState({ step: 'scanning' });
  };

  if (!permission) return <View style={styles.dark} />;

  if (!permission.granted) {
    return (
      <View style={[styles.permission, { paddingTop: insets.top + spacing.xl }]}>
        <IconButton icon="close" accessibilityLabel="Cerrar" onPress={close} background={colors.surfaceMuted} style={styles.permissionClose} />
        <View style={styles.permissionIcon}>
          <Ionicons name="camera" size={36} color={colors.primary} />
        </View>
        <AppText variant="h2" align="center">
          Permite el acceso a la cámara
        </AppText>
        <AppText color="textSecondary" align="center" style={{ marginVertical: spacing.md }}>
          La usamos solo para leer el código QR del negocio y registrar tu visita.
        </AppText>
        <Button
          title={permission.canAskAgain ? 'Permitir cámara' : 'Abrir ajustes'}
          size="lg"
          fullWidth
          onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
        />
      </View>
    );
  }

  const showResult = state.step === 'success' || state.step === 'error';

  return (
    <View style={styles.dark}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={state.step === 'scanning' ? onScanned : undefined}
      />

      {/* Marco de escaneo */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame}>
          {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
            <View key={corner} style={[styles.corner, styles[corner]]} />
          ))}
        </View>
        <AppText variant="bodyStrong" color="textInverse" align="center" style={styles.hint}>
          Apunta al código QR del negocio
        </AppText>
      </View>

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton icon="close" accessibilityLabel="Cerrar escáner" onPress={close} color={colors.onPrimary} background={colors.scrimStrong} />
        <AppText variant="h3" color="textInverse">
          Escanear QR
        </AppText>
        <IconButton
          icon={torch ? 'flash' : 'flash-outline'}
          accessibilityLabel={torch ? 'Apagar linterna' : 'Encender linterna'}
          onPress={() => setTorch((t) => !t)}
          color={colors.onPrimary}
          background={colors.scrimStrong}
        />
      </View>

      {state.step === 'processing' && (
        <View style={styles.processing}>
          <View style={[styles.processingCard, shadows.lg]}>
            <ActivityIndicator color={colors.primary} size="large" />
            <AppText variant="bodyStrong" style={{ marginTop: spacing.md }}>
              {state.message}
            </AppText>
          </View>
        </View>
      )}

      {showResult && (
        <View style={[styles.sheetWrap, { bottom: keyboard, maxHeight: (screenHeight - keyboard) * 0.88 }]}>
          <ScrollView
            style={[styles.sheet, shadows.lg]}
            contentContainerStyle={{ padding: spacing.xxl, paddingBottom: (keyboard ? 0 : insets.bottom) + spacing.xxl }}
            keyboardShouldPersistTaps="handled"
          >
            {state.step === 'error' && (
              <View>
                <View style={[styles.resultIcon, { backgroundColor: colors.dangerSoft }]}>
                  <Ionicons name="alert-circle" size={36} color={colors.danger} />
                </View>
                <AppText variant="h2" align="center">
                  {state.title}
                </AppText>
                <AppText color="textSecondary" align="center" style={{ marginVertical: spacing.md }}>
                  {state.message}
                </AppText>
                {state.openSettings ? (
                  <Button title="Abrir ajustes" size="lg" fullWidth onPress={() => Linking.openSettings()} />
                ) : (
                  <Button title="Escanear de nuevo" icon="scan" size="lg" fullWidth onPress={scanAgain} />
                )}
                <Button title="Cerrar" variant="ghost" fullWidth onPress={close} style={{ marginTop: spacing.xs }} />
              </View>
            )}

            {state.step === 'success' && !state.reviewing && (
              <SuccessContent
                state={state}
                onReview={() => setState({ ...state, reviewing: true })}
                onClose={close}
                onOpenBusiness={() =>
                  router.replace({ pathname: '/businesses/[id]', params: { id: String(state.result.business.id) } })
                }
              />
            )}

            {state.step === 'success' && state.reviewing && (
              <ReviewForm
                checkinId={state.result.checkin.id}
                businessName={state.result.business.name}
                points={state.result.review.points}
                onDone={(review) => setState({ ...state, review, reviewing: false })}
                onSkip={() => setState({ ...state, reviewing: false })}
              />
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function SuccessContent({
  state,
  onReview,
  onClose,
  onOpenBusiness,
}: {
  state: Extract<State, { step: 'success' }>;
  onReview: () => void;
  onClose: () => void;
  onOpenBusiness: () => void;
}) {
  const { result, review } = state;
  const balance = result.balance + (review?.points_awarded ?? 0);

  return (
    <View>
      <View style={styles.successHeader}>
        <Avatar uri={result.business.logo} name={result.business.name} size={64} rounded="md" />
        <View style={styles.check}>
          <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
        </View>
      </View>
      <AppText variant="h2" align="center">
        ¡Visitaste {result.business.name}!
      </AppText>
      <View style={styles.pointsRow}>
        <AppText style={styles.pointsBig}>+{result.points_earned}</AppText>
        <AppText variant="h3" color="accent">
          pts
        </AppText>
      </View>
      <AppText color="textSecondary" align="center">
        Saldo en {result.business.name}: <AppText variant="bodyStrong">{balance} pts</AppText> · {result.visits}{' '}
        {result.visits === 1 ? 'visita' : 'visitas'}
      </AppText>

      {review ? (
        <View style={[styles.reviewBox, { backgroundColor: colors.successSoft }]}>
          <Ionicons name="heart" size={20} color={colors.success} />
          <AppText variant="bodyStrong" style={{ flex: 1, color: colors.success }}>
            {review.points_awarded ? `¡Gracias por tu reseña! +${review.points_awarded} pts` : '¡Gracias por tu reseña!'}
          </AppText>
        </View>
      ) : (
        <View style={styles.reviewBox}>
          <Ionicons name="star" size={22} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">¿Deseas dejar una reseña?</AppText>
            <AppText variant="caption" color="textSecondary">
              {result.review.points > 0 ? `Son +${result.review.points} pts más para ti.` : 'Cuéntanos cómo te fue.'}
            </AppText>
          </View>
        </View>
      )}

      {review ? (
        <Button title="Listo" size="lg" fullWidth onPress={onClose} />
      ) : (
        <Button
          title={result.review.points > 0 ? `Dejar reseña (+${result.review.points} pts)` : 'Dejar reseña'}
          icon="create-outline"
          size="lg"
          fullWidth
          onPress={onReview}
        />
      )}
      <Button title="Ver el negocio" variant="ghost" fullWidth onPress={onOpenBusiness} style={{ marginTop: spacing.xs }} />
      {!review && <Button title="Ahora no" variant="ghost" fullWidth onPress={onClose} />}
    </View>
  );
}

const CORNER = 34;
const CORNER_WIDTH = 5;

const styles = StyleSheet.create({
  dark: { flex: 1, backgroundColor: colors.camera },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame: { width: FRAME, height: FRAME },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.onPrimary },
  tl: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderTopLeftRadius: radius.lg },
  tr: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderTopRightRadius: radius.lg },
  bl: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderBottomLeftRadius: radius.lg },
  br: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderBottomRightRadius: radius.lg },
  hint: {
    marginTop: spacing.xl,
    backgroundColor: colors.scrimStrong,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  processing: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center' },
  processingCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xxl, alignItems: 'center', maxWidth: 280 },
  sheetWrap: { position: 'absolute', left: 0, right: 0 },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl },
  resultIcon: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successHeader: { alignSelf: 'center', marginBottom: spacing.md },
  check: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  pointsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: spacing.xs, marginVertical: spacing.sm },
  pointsBig: { fontSize: 48, lineHeight: 54, fontWeight: '800', color: colors.accent },
  reviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    marginVertical: spacing.xl,
  },
  permission: { flex: 1, backgroundColor: colors.surface, padding: spacing.xxl, justifyContent: 'center' },
  permissionClose: { position: 'absolute', top: spacing.xxxl * 1.5, left: spacing.lg },
  permissionIcon: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
});
