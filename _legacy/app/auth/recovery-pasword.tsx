import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import AlertComponent from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { useAlert } from '@/hooks/use-alert';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

// ── Palette ──────────────────────────────────────────────
const C = {
  brand: '#b82a5e',
  brandLight: '#d4547e',
  brandDark: '#8a1f46',
  brandFaint: 'rgba(184,42,94,0.07)',
  brandBorder: 'rgba(184,42,94,0.22)',
  borderLight: 'rgba(184,42,94,0.12)',
  bg: '#ffffff',
  surface: '#ffffff',
  surfaceGray: '#f7f2f5',
  surfaceBorder: '#ede5ea',
  white: '#ffffff',
  muted: '#9b8492',
  mutedLight: '#c5b5be',
  text: '#1a0f15',
  textSub: '#6b5560',
  green: '#2da06e',
  greenFaint: 'rgba(45,160,110,0.08)',
  greenBorder: 'rgba(45,160,110,0.25)',
  error: '#e53e3e',
  errorFaint: 'rgba(229,62,62,0.07)',
};

// ── Steps config ──────────────────────────────────────────
const STEPS = [
  { title: 'Recuperar contraseña', sub: 'Ingresa tu identificación registrada', icon: 'mail-outline'           },
  { title: 'Verifica tu identidad', sub: 'Revisa tu bandeja de entrada',     icon: 'keypad-outline'         },
  { title: 'Nueva contraseña',      sub: 'Elige una contraseña segura',      icon: 'lock-closed-outline'    },
  { title: '¡Todo listo!',          sub: 'Tu contraseña fue actualizada',    icon: 'checkmark-circle-outline'},
];

// ── Step Progress Bar ─────────────────────────────────────
function StepProgress({ step }: { step: number }) {
  const labels = ['Correo', 'Código', 'Contraseña'];
  return (
    <View style={sp.row}>
      {labels.map((label, i) => {
        const done   = step > i;
        const active = step === i;
        return (
          <View key={i} style={sp.item}>
            {/* connector line */}
            {i > 0 && <View style={[sp.line, done && sp.lineDone, active && sp.lineActive]} />}
            {/* circle */}
            <View style={[sp.circle, active && sp.circleActive, done && sp.circleDone]}>
              {done
                ? <Ionicons name="checkmark" size={12} color={C.white} />
                : <Text style={[sp.num, active && sp.numActive]}>{i + 1}</Text>
              }
            </View>
            <Text style={[sp.label, (active || done) && sp.labelOn]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const sp = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 10, marginTop: 4 },
  item: { flex: 1, alignItems: 'center', position: 'relative' },
  line: {
    position: 'absolute',
    top: 17,
    left: '-50%',
    right: '50%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    zIndex: 0,
  },
  lineActive: { backgroundColor: 'rgba(255,255,255,0.5)' },
  lineDone:   { backgroundColor: 'rgba(255,255,255,0.8)' },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    zIndex: 1,
  },
  circleActive: { backgroundColor: C.white,                 borderColor: C.white },
  circleDone:   { backgroundColor: 'rgba(255,255,255,0.35)', borderColor: 'rgba(255,255,255,0.7)' },
  num:          { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '800' },
  numActive:    { color: C.brand },
  label:        { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  labelOn:      { color: C.white },
});

// ── OTP Input ─────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<Array<TextInput | null>>([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleChange = (text: string, idx: number) => {
    const d = text.replace(/[^0-9]/g, '').slice(-1);
    const arr = digits.map((v, i) => (i === idx ? d : v));
    onChange(arr.join(''));
    if (d && idx < 5)  refs.current[idx + 1]?.focus();
    if (!d && idx > 0) refs.current[idx - 1]?.focus();
  };

  return (
    <View style={ot.row}>
      {digits.map((digit, i) => (
        <TextInput
          key={i}
          ref={(ref) => {
            refs.current[i] = ref;
          }}
          style={[ot.box, !!digit && ot.boxFilled]}
          value={digit}
          onChangeText={(t) => handleChange(t, i)}
          keyboardType="numeric"
          maxLength={1}
          selectTextOnFocus
          textAlign="center"
        />
      ))}
    </View>
  );
}

const ot = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginVertical: 4 },
  box: {
    width: 46,
    height: 56,
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.borderLight,
    color: C.text,
    fontSize: 22,
    fontWeight: '800',
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  boxFilled: {
    borderColor: C.brand,
    backgroundColor: C.brandFaint,
    color: C.brand,
  },
});

// ── Password Field ────────────────────────────────────────
function PassField({
  label,
  placeholder,
  value,
  onChangeText,
  show,
  onToggle,
  error,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={pf.label}>{label}</Text>
      <View style={[pf.wrap, focused && pf.focused, !!error && pf.errWrap]}>
        <View style={[pf.iconWrap, focused && pf.iconFocused]}>
          <Ionicons name="lock-closed-outline" size={16} color={focused ? C.brand : C.mutedLight} />
        </View>
        <TextInput
          style={pf.input}
          placeholder={placeholder}
          placeholderTextColor={C.mutedLight}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={onToggle} style={{ paddingRight: 14 }}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={17} color={C.mutedLight} />
        </TouchableOpacity>
      </View>
      {error && (
        <View style={pf.errorRow}>
          <Ionicons name="alert-circle" size={12} color={C.error} />
          <Text style={pf.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const pf = StyleSheet.create({
  label: { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.borderLight,
    height: 54,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  focused:  { borderColor: C.brand, shadowOpacity: 0.12 },
  errWrap:  { borderColor: C.error },
  iconWrap: {
    width: 48,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: C.borderLight,
    marginRight: 12,
  },
  iconFocused: { borderRightColor: C.brandBorder },
  input:    { flex: 1, color: C.text, fontSize: 15 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  errorText:{ color: C.error, fontSize: 11, fontWeight: '600' },
});

// ── Strength helper ───────────────────────────────────────
function getStrength(pw: string) {
  if (!pw) return null;
  if (pw.length < 6) return { label: 'Muy débil', color: C.error,   w: '20%' };
  if (pw.length < 8) return { label: 'Débil',     color: '#f97316', w: '45%' };
  if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw))
    return { label: 'Moderada', color: '#eab308', w: '70%' };
  return { label: 'Fuerte', color: C.green, w: '100%' };
}

// ── Main Screen ───────────────────────────────────────────
export default function RecoveryScreen() {
  const router = useRouter();
  const { requestPasswordRecovery, validateRecoveryCode, resetPassword } = useAuth();
  const { visibleConfig, config, hide, error, success } = useAlert();

  const [step, setStep]               = useState(0);
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [idFocused, setIdFocused] = useState(false);
  const [otp, setOtp]                 = useState('');
  const [otpError, setOtpError]       = useState('');
  const [newPass, setNewPass]         = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const identifierDigits = identifier.replace(/\D/g, '');
  const identifierType = identifierDigits.length === 13 ? 'ruc' : 'ci';
  const isIdentifierValid = identifierDigits.length === 10 || identifierDigits.length === 13;
  const isRecoveryEmailValid = email.includes('@');

  const strength = getStrength(newPass);

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '•'.repeat(Math.min(b.length, 6)) + c)
    : 'tu correo';

  useEffect(() => {
    if (resendTimer <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer]);

  const requestCode = async () => {
    if (!isIdentifierValid) {
      error('Identificación inválida', 'Ingresa una cédula de 10 dígitos o un RUC de 13 dígitos.');
      return;
    }

    setIsSubmitting(true);
    const result = await requestPasswordRecovery(
      identifierType === 'ruc'
        ? { ruc: identifierDigits }
        : { ci: identifierDigits },
    );
    setIsSubmitting(false);

    if (!result.ok) {
      error('No se pudo enviar el código', result.message || 'Intenta nuevamente.');
      return;
    }

    if (!result.email) {
      error('No se pudo continuar', 'No se recibió el correo asociado para validar el código. Intenta nuevamente.');
      return;
    }

    setEmail(result.email);

    setOtp('');
    setOtpError('');
    setResendTimer(30);
    setStep(1);
  };

  const validateOtp = async () => {
    if (otp.length < 6 || !isRecoveryEmailValid) {
      return;
    }

    setIsSubmitting(true);
    const result = await validateRecoveryCode(email, otp);
    setIsSubmitting(false);

    if (!result.ok) {
      setOtpError(result.message || 'Código inválido.');
      return;
    }

    setOtpError('');
    setStep(2);
  };

  const submitNewPassword = async () => {
    if (newPass.length < 8 || newPass !== confirmPass || !isRecoveryEmailValid) {
      return;
    }

    setIsSubmitting(true);
    const result = await resetPassword(email, otp, newPass);
    setIsSubmitting(false);

    if (!result.ok) {
      error('Error', result.message || 'Verifica los datos e intenta de nuevo.');
      return;
    }

    success(
      'Contraseña actualizada',
      result.message || 'Tu contraseña fue actualizada correctamente.',
      [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/auth/login');
          },
        },
      ],
    );
  };

  const currentStep = STEPS[step];

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        style={s.root}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraHeight={100}
      >
        <StatusBar barStyle="light-content" />

        {/* ── Gradient header ── */}
        <LinearGradient
          colors={step === 3 ? [C.green, '#1a7a52'] : [C.brandDark, C.brand, C.brandLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.header}
        >
          <View style={s.circle1} />
          <View style={s.circle2} />

          {/* Back / step counter */}
          <View style={s.headerTop}>
            {step < 3 && (
              <TouchableOpacity
                style={s.backBtn}
                onPress={() => (step > 0 ? setStep(step - 1) : router.back())}
              >
                <Ionicons name="chevron-back" size={20} color={C.white} />
              </TouchableOpacity>
            )}
            {step < 3 && (
              <View style={s.stepBadge}>
                <Text style={s.stepBadgeText}>{step + 1} / 3</Text>
              </View>
            )}
          </View>

          {/* Icon + title */}
          <View style={s.heroIcon}>
            <Ionicons name={currentStep.icon as any} size={30} color={C.white} />
          </View>
          <Text style={s.heroTitle}>{currentStep.title}</Text>
          <Text style={s.heroSub}>{currentStep.sub}</Text>

          {step < 3 && <StepProgress step={step} />}
        </LinearGradient>

        {/* ── White card ── */}
        <View style={s.card}>

          {/* ══ STEP 0: Identificacion ══ */}
          {step === 0 && (
            <View>
              <Text style={s.formTitle}>¿Cuál es tu número de Identificación?</Text>
              <Text style={s.formSub}>
                Si encontramos un registro con la identificación proporcionada, enviaremos un código de 6 dígitos a tu dirección de email registrada.
              </Text>

              {/* Identification input */}
              <View style={[s.emailWrap, idFocused && s.emailWrapFocused]}>
                <View style={[s.emailIconWrap, idFocused && s.emailIconFocused]}>
                  <Ionicons name="id-card-outline" size={17} color={idFocused ? C.brand : C.mutedLight} />
                </View>
                <TextInput
                  style={s.emailInput}
                  placeholder="Cédula o RUC"
                  placeholderTextColor={C.mutedLight}
                  value={identifier}
                  onChangeText={(v) => setIdentifier(v.replace(/\D/g, ''))}
                  keyboardType="numeric"
                  onFocus={() => setIdFocused(true)}
                  onBlur={() => setIdFocused(false)}
                  maxLength={13}
                />
              </View>

              <TouchableOpacity
                style={[s.primaryBtn, (!isIdentifierValid || isSubmitting) && s.primaryBtnDisabled]}
                onPress={requestCode}
                disabled={!isIdentifierValid || isSubmitting}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[C.brand, C.brandDark]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.primaryGradient}
                >
                  <Text style={s.primaryText}>{isSubmitting ? 'Enviando...' : 'Enviar código'}</Text>
                  <Ionicons name="send" size={16} color={C.white} />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={s.backToLogin} onPress={() => router.replace('/auth/login')}>
                <Ionicons name="arrow-back" size={13} color={C.muted} />
                <Text style={s.backToLoginText}>Volver al inicio de sesión</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══ STEP 1: OTP ══ */}
          {step === 1 && (
            <View>
              {/* Sent confirmation banner */}
              <View style={s.sentBanner}>
                <View style={s.sentBannerIcon}>
                  <Ionicons name="mail" size={20} color={C.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.sentBannerTitle}>Código enviado</Text>
                  <Text style={s.sentBannerSub}>
                    El código para restablecer tu contraseña ha sido enviado a{' '}
                    <Text style={s.sentBannerEmail}>{maskedEmail}</Text>
                  </Text>
                </View>
              </View>

              <Text style={s.otpLabel}>Ingresa el código de 6 dígitos</Text>

              <OtpInput value={otp} onChange={(v) => { setOtp(v); setOtpError(''); }} />

              {/* Error */}
              {otpError ? (
                <View style={s.otpErrorRow}>
                  <Ionicons name="alert-circle" size={14} color={C.error} />
                  <Text style={s.otpErrorText}>{otpError}</Text>
                </View>
              ) : null}

              {/* Resend */}
              <View style={s.resendRow}>
                <Text style={s.resendText}>¿No recibiste el código? </Text>
                <TouchableOpacity
                  disabled={resendTimer > 0 || isSubmitting || !isIdentifierValid}
                  onPress={requestCode}
                >
                  <Text style={[s.resendLink, resendTimer > 0 && s.resendLinkDisabled]}>
                    {resendTimer > 0 ? `Reenviar en ${resendTimer}s` : 'Reenviar'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Security note */}
              <View style={s.secNote}>
                <Ionicons name="shield-checkmark-outline" size={14} color={C.brand} />
                <Text style={s.secNoteText}>
                  Nunca compartas este código. Jamás se te  pedirá.
                </Text>
              </View>

              <TouchableOpacity
                style={[s.primaryBtn, (otp.length < 6 || !isRecoveryEmailValid || isSubmitting) && s.primaryBtnDisabled]}
                onPress={validateOtp}
                disabled={otp.length < 6 || !isRecoveryEmailValid || isSubmitting}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[C.brand, C.brandDark]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.primaryGradient}
                >
                  <Text style={s.primaryText}>{isSubmitting ? 'Validando...' : 'Verificar código'}</Text>
                  <Ionicons name="checkmark" size={18} color={C.white} />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={s.backToLogin} onPress={() => router.replace('/auth/login')}>
                <Ionicons name="arrow-back" size={13} color={C.muted} />
                <Text style={s.backToLoginText}>Volver al inicio de sesión</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══ STEP 2: New password ══ */}
          {step === 2 && (
            <View>
              <Text style={s.formTitle}>Elige una nueva contraseña</Text>
              <Text style={s.formSub}>
                Debe ser diferente a tu contraseña anterior y difícil de adivinar.
              </Text>

              <PassField
                label="Nueva contraseña"
                placeholder="Mínimo 8 caracteres"
                value={newPass}
                onChangeText={setNewPass}
                show={showNew}
                onToggle={() => setShowNew(!showNew)}
              />

              {/* Strength bar */}
              {strength && (
                <View style={s.strengthRow}>
                  <View style={s.strengthTrack}>
                    <View style={[s.strengthFill, { width: strength.w as any, backgroundColor: strength.color }]} />
                  </View>
                  <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}

              {/* Checklist */}
              <View style={s.checklistCard}>
                {[
                  { label: 'Mínimo 8 caracteres',    met: newPass.length >= 8 },
                  { label: 'Al menos una mayúscula', met: /[A-Z]/.test(newPass) },
                  { label: 'Al menos un número',     met: /[0-9]/.test(newPass) },
                  { label: 'Contraseñas coinciden',  met: newPass.length > 0 && newPass === confirmPass },
                ].map((req) => (
                  <View key={req.label} style={s.checkRow}>
                    <View style={[s.checkDot, req.met && s.checkDotMet]}>
                      <Ionicons
                        name={req.met ? 'checkmark' : 'ellipse'}
                        size={req.met ? 10 : 5}
                        color={req.met ? C.white : C.mutedLight}
                      />
                    </View>
                    <Text style={[s.checkText, req.met && s.checkTextMet]}>{req.label}</Text>
                  </View>
                ))}
              </View>

              <PassField
                label="Confirmar contraseña"
                placeholder="Repite tu contraseña"
                value={confirmPass}
                onChangeText={setConfirmPass}
                show={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
                error={
                  confirmPass.length > 0 && newPass !== confirmPass
                    ? 'Las contraseñas no coinciden'
                    : undefined
                }
              />

              <TouchableOpacity
                style={[
                  s.primaryBtn,
                  (newPass.length < 8 || newPass !== confirmPass || isSubmitting) && s.primaryBtnDisabled,
                ]}
                onPress={submitNewPassword}
                disabled={newPass.length < 8 || newPass !== confirmPass || isSubmitting}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[C.brand, C.brandDark]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.primaryGradient}
                >
                  <Ionicons name="lock-closed" size={16} color={C.white} />
                  <Text style={s.primaryText}>{isSubmitting ? 'Actualizando...' : 'Actualizar contraseña'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ══ STEP 3: Success ══ */}
          {step === 3 && (
            <View style={s.successWrap}>
              <View style={s.successRing}>
                <Ionicons name="checkmark" size={38} color={C.green} />
              </View>

              <Text style={s.successTitle}>¡Contraseña actualizada!</Text>
              <Text style={s.successSub}>
                Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión.
              </Text>

              

              <TouchableOpacity
                style={s.primaryBtn}
                onPress={() => router.replace('/auth/login')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[C.green, '#1a7a52']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.primaryGradient}
                >
                  <Text style={s.primaryText}>Iniciar sesión</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>
      <AlertComponent visible={visibleConfig} config={config} onDismiss={hide} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
 root: { flex: 1, backgroundColor: C.bg },
  content: { flexGrow: 1 },

  scrollContent: { flexGrow: 1 },

  /* Header */
  header: {
    paddingTop: Platform.select({ ios: 56, android: 42, default: 42 }),
    paddingBottom: 28,
    paddingHorizontal: 22,
    overflow: 'hidden',
    alignItems: 'center',
    gap: 10,
  },
  circle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -60,
  },
  circle2: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: -25,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    alignItems: 'center',
    minHeight: 38,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  stepBadgeText: { color: C.white, fontSize: 12, fontWeight: '700' },
  heroIcon: {
    width: 66, height: 66, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { color: C.white, fontSize: 21, fontWeight: '900', letterSpacing: -0.3 },
  heroSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center', marginBottom: 4 },

  /* Card */
  card: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -22,
    flex: 1,
    padding: 26,
    paddingTop: 30,
  },
  formTitle: { color: C.brandDark, fontSize: 20, fontWeight: '900', marginBottom: 6, letterSpacing: -0.2 },
  formSub:   { color: C.muted, fontSize: 13, lineHeight: 20, marginBottom: 24 },

  /* Email field */
  emailWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.borderLight,
    height: 54,
    marginBottom: 22,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  emailWrapFocused: { borderColor: C.brand, shadowOpacity: 0.12 },
  emailIconWrap: {
    width: 48, height: '100%',
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: C.borderLight,
    marginRight: 12,
  },
  emailIconFocused: { borderRightColor: C.brandBorder },
  emailInput: { flex: 1, color: C.text, fontSize: 15 },

  /* Sent banner */
  sentBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: C.brandFaint,
    borderWidth: 1,
    borderColor: C.brandBorder,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  sentBannerIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(184,42,94,0.1)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  sentBannerTitle: { color: C.brandDark, fontSize: 13, fontWeight: '800', marginBottom: 3 },
  sentBannerSub:   { color: C.textSub, fontSize: 13, lineHeight: 18 },
  sentBannerEmail: { color: C.brand, fontWeight: '700' },

  /* OTP */
  otpLabel:    { color: C.text, fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  otpErrorRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, marginTop: 10,
    backgroundColor: C.errorFaint, borderRadius: 10, padding: 8,
  },
  otpErrorText: { color: C.error, fontSize: 12, fontWeight: '600' },

  /* Resend */
  resendRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 18, marginBottom: 16,
  },
  resendText:         { color: C.muted, fontSize: 13 },
  resendLink:         { color: C.brand, fontSize: 13, fontWeight: '700' },
  resendLinkDisabled: { color: C.mutedLight },

  /* Security note */
  secNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: C.brandFaint, borderRadius: 12,
    borderWidth: 1, borderColor: C.brandBorder,
    padding: 12, marginBottom: 24,
  },
  secNoteText: { color: C.textSub, fontSize: 12, lineHeight: 18, flex: 1 },

  /* Strength */
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -6, marginBottom: 14 },
  strengthTrack: {
    flex: 1, height: 5,
    backgroundColor: C.surfaceGray, borderRadius: 3,
    overflow: 'hidden', borderWidth: 1, borderColor: C.borderLight,
  },
  strengthFill:  { height: '100%', borderRadius: 3 },
  strengthLabel: { fontSize: 11, fontWeight: '700', width: 72 },

  /* Checklist */
  checklistCard: {
    backgroundColor: C.surfaceGray,
    borderRadius: 14, padding: 14, gap: 10,
    marginBottom: 16, borderWidth: 1, borderColor: C.surfaceBorder,
  },
  checkRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkDot:    {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.surfaceGray,
    borderWidth: 1.5, borderColor: C.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  checkDotMet: { backgroundColor: C.green, borderColor: C.green },
  checkText:   { color: C.mutedLight, fontSize: 13 },
  checkTextMet:{ color: C.text },

  /* Primary button */
  primaryBtn: { backgroundColor: C.brand, borderRadius: 16, overflow: 'hidden', marginBottom: 26 },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  primaryText: { color: C.white, fontSize: 16, fontWeight: '800' },

  /* Back to login */
  backToLogin: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 6, marginTop: 2,
  },
  backToLoginText: { color: C.muted, fontSize: 13 },

  /* Success */
  successWrap:  { alignItems: 'center', paddingTop: 8 },
  successRing:  {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: C.greenFaint, borderWidth: 2, borderColor: C.greenBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successTitle: { color: C.brandDark, fontSize: 22, fontWeight: '900', marginBottom: 8 },
  successSub:   {
    color: C.muted, fontSize: 14, textAlign: 'center',
    lineHeight: 21, marginBottom: 24, paddingHorizontal: 8,
  },
  tipCard: {
    alignSelf: 'stretch',
    backgroundColor: C.surfaceGray,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: C.surfaceBorder,
    marginBottom: 24,
  },
  tipRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  tipRowBorder: { borderBottomWidth: 1, borderBottomColor: C.surfaceBorder },
  tipIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: C.brandFaint, borderWidth: 1, borderColor: C.brandBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  tipText: { color: C.textSub, fontSize: 13, flex: 1 },

  /* Shared border for surface */
  surfaceBorder: { borderColor: '#ede5ea' },
});