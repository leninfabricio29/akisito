import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { useEffect } from 'react';

import AlertComponent from '@/components/ui/alert';
import { useAlert } from '@/hooks/use-alert';
import { getPlaceCategoriesRequest } from '@/services/place-service';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuth } from '../../context/auth-context';

const { width } = Dimensions.get('window');

// ── Palette ──────────────────────────────────────────────
const C = {
  brand: '#b82a5e',
  brandLight: '#d4547e',
  brandDark: '#8a1f46',
  brandFaint: 'rgba(184,42,94,0.07)',
  brandBorder: 'rgba(184,42,94,0.25)',
  bg: '#ffffff',
  surface: '#ffffff',
  surfaceGray: '#f7f2f5',
  border: 'rgba(184,42,94,0.22)',
  borderLight: 'rgba(184,42,94,0.12)',
  white: '#ffffff',
  muted: '#9b8492',
  mutedLight: '#c5b5be',
  text: '#1a0f15',
  textSub: '#6b5560',
  gold: '#f5a623',
  goldFaint: 'rgba(245,166,35,0.08)',
  goldBorder: 'rgba(245,166,35,0.3)',
  green: '#2da06e',
  greenFaint: 'rgba(45,160,110,0.08)',
  greenBorder: 'rgba(45,160,110,0.3)',
  error: '#e53e3e',
};

// ── Wizard steps config ───────────────────────────────────
const STEPS_PERSONAL = [
  { id: 0, label: 'Información personal', icon: 'person-circle-outline' },
  { id: 1, label: 'Seguridad', icon: 'lock-closed-outline' },
  { id: 2, label: 'Código de referido', icon: 'gift-outline' },
];

const STEPS_BUSINESS = [
  { id: 0, label: 'Tipo',      icon: 'business-outline' },
  { id: 1, label: 'Negocio',   icon: 'storefront-outline' },
  { id: 2, label: 'Seguridad', icon: 'lock-closed-outline' },
];

// ── Input Field ───────────────────────────────────────────
function Field({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  rightElement,
  hint,
  error,
  optional,
  maxLength,
}: {
  icon: string;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  rightElement?: React.ReactNode;
  hint?: string;
  error?: string;
  optional?: boolean;
  maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  return (
    <View style={f.container}>
      <View style={f.labelRow}>
        <Text style={f.label}>{label}</Text>
        {optional && (
          <View style={f.optionalBadge}>
            <Text style={f.optionalText}>Opcional</Text>
          </View>
        )}
      </View>
      <View style={[f.wrap, focused && f.wrapFocused, hasError && f.wrapError]}>
        <View style={[f.iconWrap, focused && f.iconWrapFocused]}>
          <Ionicons
            name={icon as any}
            size={16}
            color={hasError ? C.error : focused ? C.brand : C.mutedLight}
          />
        </View>
        <TextInput
          style={f.input}
          placeholder={placeholder}
          placeholderTextColor={C.mutedLight}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={maxLength}
        />
        {rightElement}
      </View>
      {hint && !error && (
        <View style={f.hintRow}>
          <Ionicons name="information-circle-outline" size={11} color={C.mutedLight} />
          <Text style={f.hint}>{hint}</Text>
        </View>
      )}
      {error && (
        <View style={f.errorRow}>
          <Ionicons name="alert-circle" size={12} color={C.error} />
          <Text style={f.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const f = StyleSheet.create({
  container: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { color: C.text, fontSize: 13, fontWeight: '700' },
  optionalBadge: {
    backgroundColor: C.brandFaint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  optionalText: { color: C.brand, fontSize: 10, fontWeight: '600' },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.borderLight,
    paddingRight: 14,
    height: 54,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  wrapFocused: {
    borderColor: C.brand,
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  wrapError: { borderColor: C.error },
  iconWrap: {
    width: 48,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: C.borderLight,
    marginRight: 12,
  },
  iconWrapFocused: { borderRightColor: C.brandBorder },
  input: { flex: 1, color: C.text, fontSize: 15 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, paddingHorizontal: 2 },
  hint: { color: C.mutedLight, fontSize: 11 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  errorText: { color: C.error, fontSize: 11, fontWeight: '600' },
});

// ── Wizard Progress Bar ───────────────────────────────────
function WizardProgress({
  step,
  steps,
}: {
  step: number;
  steps: { id: number; label: string; icon: string }[];
}) {
  return (
    <View style={wp.row}>
      {steps.map((s, i) => {
        const done = step > i;
        const active = step === i;
        const last = i === steps.length - 1;
        return (
          <View key={s.id} style={wp.item}>
            {/* Connector line before */}
            {i > 0 && (
              <View style={[wp.line, (done || active) && wp.lineActive]} />
            )}
            {/* Circle */}
            <View style={[wp.circle, active && wp.circleActive, done && wp.circleDone]}>
              {done ? (
                <Ionicons name="checkmark" size={13} color={C.white} />
              ) : (
                <Ionicons
                  name={s.icon as any}
                  size={14}
                  color={active ? C.white : C.mutedLight}
                />
              )}
            </View>
            <Text style={[wp.label, (active || done) && wp.labelActive]}>{s.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const wp = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginTop: 4,
  },
  item: { alignItems: 'center', flex: 1, position: 'relative' },
  line: {
    position: 'absolute',
    top: 17,
    right: '50%',
    left: '-50%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    zIndex: 0,
  },
  lineActive: { backgroundColor: 'rgba(255,255,255,0.7)' },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    zIndex: 1,
  },
  circleActive: {
    backgroundColor: C.white,
    borderColor: C.white,
  },
  circleDone: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  labelActive: { color: C.white },
});

// ── Business Type Chips (deprecated - now loaded from API) ───────────────────────────────────
// const BIZ_TYPES = ['Restaurante', 'Hotel', 'Tour', 'Tienda', 'Spa', 'Otro'];

// ── Password Strength ─────────────────────────────────────
function getStrength(pw: string) {
  if (pw.length === 0) return null;
  if (pw.length < 6) return { label: 'Muy débil', color: C.error, w: '20%' };
  if (pw.length < 8) return { label: 'Débil', color: '#f97316', w: '45%' };
  if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { label: 'Moderada', color: C.gold, w: '70%' };
  return { label: 'Fuerte', color: C.green, w: '100%' };
}

// ── Nav Buttons ───────────────────────────────────────────
function NavRow({
  step,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  canNext,
  isSubmitting,
  isBusiness,
}: {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  canNext: boolean;
  isSubmitting: boolean;
  isBusiness: boolean;
}) {
  const isLast = step === totalSteps - 1;
  return (
    <View style={nr.row}>
      {step > 0 && (
        <TouchableOpacity style={nr.backBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={18} color={C.brand} />
          <Text style={nr.backText}>Atrás</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[nr.nextBtn, !canNext && nr.nextBtnDisabled, step === 0 && nr.nextBtnFull]}
        onPress={isLast ? onSubmit : onNext}
        disabled={!canNext || isSubmitting}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[C.brand, C.brandDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={nr.nextGradient}
        >
          {isLast ? (
            <>
              <Ionicons name={isBusiness ? 'business' : 'person-add'} size={17} color={C.white} />
              <Text style={nr.nextText}>
                {isSubmitting ? 'Creando...' : isBusiness ? 'Registrar negocio' : 'Crear mi cuenta'}
              </Text>
            </>
          ) : (
            <>
              <Text style={nr.nextText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={17} color={C.white} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const nr = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.brandBorder,
    backgroundColor: C.brandFaint,
  },
  backText: { color: C.brand, fontSize: 15, fontWeight: '700' },
  nextBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  nextBtnFull: { flex: 1 },
  nextBtnDisabled: { opacity: 0.45 },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  nextText: { color: C.white, fontSize: 15, fontWeight: '800' },
});

// ── Main Screen ───────────────────────────────────────────
export default function RegisterScreen() {
  const TERMS_URL = 'https://softkilla.es/winner/privacy/';
  const router = useRouter();
  const { registerUser } = useAuth();

  const [step, setStep] = useState(0);
  const [isBusiness, setIsBusiness] = useState(false);
  const [bizType, setBizType] = useState('');
  const { visibleConfig, config, hide, error, success } = useAlert();
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);


  // Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cedula, setCedula] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [ruc, setRuc] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [referral, setReferral] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const STEPS = STEPS_PERSONAL;
  const strength = getStrength(password);



  // ── Validation per step ──────────────────────────────────
  const canProceed = () => {
    // Step 0: personal info
    if (step === 0) {
      return firstName.trim().length > 0 && lastName.trim().length > 0 && cedula.length === 10 && email.includes('@') && phone.trim().length > 6;
    }
    // Step 1: security
    if (step === 1) return password.length >= 8 && password === confirmPass && termsAccepted;
    // Step 2: referral (optional)
    if (step === 2) return true;
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleRegister = async () => {
    setIsSubmitting(true);
    const result = await registerUser({
      isBusiness,
      firstName,
      lastName,
      email,
      password,
      phone,
      cedula,
      ruc,
      businessName,
      businessCategory: bizType,
      referralCode: referral,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      error('Error', result.message || 'Error desconocido. Intenta de nuevo.');
      return;
    }

    // Si hay URL de redirección (auto-login para business)
    if (result.redirectUrl) {
      success('Negocio registrado', '¡Bienvenido! Ahora crea tu primer lugar.', [
        {
          text: 'Continuar',
          onPress: () => router.replace(result.redirectUrl as any),
        },
      ]);
      return;
    }

    // Flujo normal: ir a login
    success('Registro exitoso', '¡Bienvenido! Tu cuenta ha sido creada.', [
      {
        text: 'OK',
        onPress: () => router.replace('/auth/login'),
      },
    ]);
  };

  const handleOpenTerms = async () => {
    try {
      await Linking.openURL(TERMS_URL);
    } catch {
      error('Error', 'No se pudo abrir el enlace de términos y condiciones.');
    }
  };

  // ── Step labels ──────────────────────────────────────────
  const stepTitles = ['Información personal', 'Seguridad', 'Código de referido'];
  const stepSubtitles = ['Completa tus datos personales', 'Elige una contraseña segura', '¡Gana 50 puntos extra!'];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <KeyboardAwareScrollView
            style={s.root}
            contentContainerStyle={s.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
      
      <StatusBar barStyle="light-content" />

      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={[C.brandDark, C.brand, C.brandLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        {/* Decorative circles */}
        <View style={s.circle1} />
        <View style={s.circle2} />
        <View style={s.circle3} />

        {/* Top bar */}
        <View style={s.headerTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => step > 0 ? handleBack() : router.back()}>
            <Ionicons name="chevron-back" size={20} color={C.white} />
          </TouchableOpacity>
          <View style={s.stepCounter}>
            <Text style={s.stepCounterText}>
              {step + 1} / {STEPS.length}
            </Text>
          </View>
        </View>

        {/* Title */}
        <View style={s.headerContent}>
          <Text style={s.headerTitle}>{stepTitles[step]}</Text>
          <Text style={s.headerSub}>{stepSubtitles[step]}</Text>
        </View>

        {/* Wizard progress */}
        <WizardProgress step={step} steps={STEPS} />
      </LinearGradient>

      {/* ── Scrollable Form ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* NOTE: Removed account type selection — flow is personal-only */}

        {/* ══ STEP 0: Información personal ══ */}
        {step === 0 && (
          <View style={s.stepWrap}>
            <View style={s.nameRow}>
              <View style={{ flex: 1 }}>
                <Field
                  icon="person-outline"
                  label="Nombres"
                  placeholder="Juan"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  icon="person-outline"
                  label="Apellidos"
                  placeholder="Pérez"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <Field
              icon="card-outline"
              label="Cédula"
              placeholder="1234567890"
              value={cedula}
              onChangeText={(v) => setCedula(v.replace(/\D/g, ''))}
              keyboardType="numeric"
              maxLength={10}
              hint="Ingresa los 10 dígitos de tu cédula"
              error={cedula.length > 0 && cedula.length !== 10 ? 'La cédula debe tener exactamente 10 dígitos' : undefined}
            />

            <Field
              icon="mail-outline"
              label="Correo electrónico"
              placeholder="correo@ejemplo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <Field
              icon="call-outline"
              label="Teléfono celular"
              placeholder="+593 99 999 9999"
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/[^0-9+]/g, ''))}
              keyboardType="phone-pad"
              hint="Usaremos este número para verificar tu cuenta"
            />

            <NavRow
              step={step}
              totalSteps={STEPS.length}
              onBack={handleBack}
              onNext={handleNext}
              onSubmit={handleRegister}
              canNext={canProceed()}
              isSubmitting={isSubmitting}
              isBusiness={false}
            />
          </View>
        )}

        {/* ══ STEP 1: Seguridad ══ */}
        {step === 1 && (
          <View style={s.stepWrap}>
            <Field
              icon="lock-closed-outline"
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              rightElement={
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={17} color={C.mutedLight} />
                </TouchableOpacity>
              }
            />

            {/* Strength bar */}
            {strength && (
              <View style={s.strengthWrap}>
                <View style={s.strengthTrack}>
                  <View style={[s.strengthFill, { width: strength.w as any, backgroundColor: strength.color }]} />
                </View>
                <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}

            {/* Requirements checklist */}
            <View style={s.requirementsCard}>
              {[
                { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
                { label: 'Al menos una mayúscula', met: /[A-Z]/.test(password) },
                { label: 'Al menos un número', met: /[0-9]/.test(password) },
                { label: 'Las contraseñas coinciden', met: password.length > 0 && password === confirmPass },
              ].map((req) => (
                <View key={req.label} style={s.reqRow}>
                  <View style={[s.reqDot, req.met && s.reqDotMet]}>
                    <Ionicons
                      name={req.met ? 'checkmark' : 'ellipse'}
                      size={req.met ? 10 : 5}
                      color={req.met ? C.white : C.mutedLight}
                    />
                  </View>
                  <Text style={[s.reqText, req.met && s.reqTextMet]}>{req.label}</Text>
                </View>
              ))}
            </View>

            <Field
              icon="shield-checkmark-outline"
              label="Confirmar contraseña"
              placeholder="Repite tu contraseña"
              value={confirmPass}
              onChangeText={setConfirmPass}
              secureTextEntry={!showConfirm}
              error={confirmPass.length > 0 && password !== confirmPass ? 'Las contraseñas no coinciden' : undefined}
              rightElement={
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={{ padding: 4 }}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={17} color={C.mutedLight} />
                </TouchableOpacity>
              }
            />

            {/* Terms */}
            <TouchableOpacity
              style={s.termsRow}
              onPress={() => setTermsAccepted(!termsAccepted)}
              activeOpacity={0.8}
            >
              <View style={[s.checkbox, termsAccepted && s.checkboxChecked]}>
                {termsAccepted && <Ionicons name="checkmark" size={12} color={C.white} />}
              </View>
              <Text style={s.termsText}>
                Acepto los{' '}
                <Text style={s.termsLink} onPress={handleOpenTerms}>Términos de uso</Text>
                {' '}y la{' '}
                <Text style={s.termsLink} onPress={handleOpenTerms}>Política de privacidad</Text>
              </Text>
            </TouchableOpacity>

            <NavRow
              step={step}
              totalSteps={STEPS.length}
              onBack={handleBack}
              onNext={handleNext}
              onSubmit={handleRegister}
              canNext={canProceed()}
              isSubmitting={isSubmitting}
              isBusiness={false}
            />
          </View>
        )}

        {/* ══ STEP 2: Referido (solo personal) ══ */}
        {step === 2 && !isBusiness && (
          <View style={s.stepWrap}>
            {/* Gift hero */}
            <View style={s.referralHero}>
              <LinearGradient
                colors={[C.goldFaint, 'rgba(245,166,35,0.15)']}
                style={s.referralHeroGradient}
              >
                <Text style={s.referralEmoji}>🎁</Text>
                <Text style={s.referralHeroTitle}>¿Tienes un código?</Text>
                <Text style={s.referralHeroSub}>
                  Ingresa el código de quien te recomendó y ambos ganan <Text style={{ color: C.gold, fontWeight: '800' }}>puntos</Text> al completar el registro.
                </Text>
              </LinearGradient>
            </View>

            {/* Referral input */}
            <View style={s.referralCard}>
              <View style={s.referralInputRow}>
                <View style={s.referralIconWrap}>
                  <Ionicons name="ticket-outline" size={20} color={referral ? C.gold : C.mutedLight} />
                </View>
                <TextInput
                  style={[s.referralInput, referral.length > 0 && s.referralInputActive]}
                  placeholder="Ej. AMIGO2024"
                  placeholderTextColor={C.mutedLight}
                  value={referral}
                  onChangeText={(v) => setReferral(v.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={12}
                />
                {referral.length > 0 && (
                  <TouchableOpacity onPress={() => setReferral('')} style={{ padding: 4 }}>
                    <Ionicons name="close-circle" size={18} color={C.mutedLight} />
                  </TouchableOpacity>
                )}
              </View>
              {referral.length > 0 && (
                <View style={s.referralBonusBanner}>
                  <Ionicons name="star" size={13} color={C.gold} />
                  <Text style={s.referralBonusText}>+50 puntos se añadirán a tu cuenta</Text>
                  <Ionicons name="checkmark-circle" size={14} color={C.green} />
                </View>
              )}
            </View>

            {/* Skip note */}
            <View style={s.skipNote}>
              <Ionicons name="information-circle-outline" size={14} color={C.mutedLight} />
              <Text style={s.skipNoteText}>Este campo es opcional. Puedes omitirlo y continuar.</Text>
            </View>

            <NavRow
              step={step}
              totalSteps={STEPS.length}
              onBack={handleBack}
              onNext={handleNext}
              onSubmit={handleRegister}
              canNext={canProceed()}
              isSubmitting={isSubmitting}
              isBusiness={false}
            />

            {/* Login */}
            <View style={s.loginRow}>
              <Text style={s.loginText}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={s.loginLink}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Login link for non-last steps */}
        {!(step === STEPS.length - 1 && !isBusiness) && step === STEPS.length - 1 && (
          <View style={[s.loginRow, { marginTop: 8, paddingHorizontal: 24 }]}>
            <Text style={s.loginText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={s.loginLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      <AlertComponent visible={visibleConfig} config={config} onDismiss={hide} />
      </ScrollView>
    </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────
const s = StyleSheet.create({

  root: { flex: 1, backgroundColor: C.bg },
  content: { flexGrow: 1 },
  
  scroll: { flex: 1, backgroundColor: C.bg },
  scrollContent: { flexGrow: 1 },

  /* Header */
  header: {
    paddingTop: Platform.select({ ios: 56, android: 42, default: 42 }),
    paddingBottom: 24,
    paddingHorizontal: 20,
    overflow: 'hidden',
    gap: 14,
  },
  circle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -80,
    right: -60,
  },
  circle2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -50,
    left: -30,
  },
  circle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: 60,
    right: 80,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCounter: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  stepCounterText: { color: C.white, fontSize: 12, fontWeight: '700' },
  headerContent: { gap: 3 },
  headerTitle: { color: C.white, fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },

  /* Step content */
  stepWrap: { padding: 22, paddingTop: 26 },

  /* Account type cards */
  accountTypeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  accountTypeCard: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.borderLight,
    position: 'relative',
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  accountTypeCardActive: {
    borderColor: C.brand,
    shadowOpacity: 0.12,
  },
  accountTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: C.surfaceGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  accountTypeIconActive: { backgroundColor: 'rgba(184,42,94,0.12)' },
  accountTypeTitle: { color: C.muted, fontSize: 15, fontWeight: '800', marginBottom: 4 },
  accountTypeTitleActive: { color: C.brand },
  accountTypeSub: { color: C.mutedLight, fontSize: 11, textAlign: 'center', lineHeight: 16 },
  accountTypeCheck: { position: 'absolute', top: 10, right: 10 },

  selectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.brandFaint,
    borderWidth: 1,
    borderColor: C.brandBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 22,
  },
  selectionSummaryText: { color: C.textSub, fontSize: 13, flex: 1 },

  /* Name row */
  nameRow: { flexDirection: 'row', gap: 10 },

  /* Biz type */
  bizTypeSection: { marginBottom: 16 },
  bizTypeLabel: { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  bizTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bizTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.borderLight,
  },
  bizTypeChipActive: { backgroundColor: C.brandFaint, borderColor: C.brand },
  bizTypeChipText: { color: C.muted, fontSize: 13, fontWeight: '600' },
  bizTypeChipTextActive: { color: C.brand },

  /* Divider */
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.borderLight },
  dividerText: { color: C.muted, fontSize: 11, fontWeight: '600' },

  /* Password strength */
  strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -8, marginBottom: 16 },
  strengthTrack: {
    flex: 1,
    height: 5,
    backgroundColor: C.surfaceGray,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  strengthFill: { height: '100%', borderRadius: 3 },
  strengthLabel: { fontSize: 11, fontWeight: '700', width: 72 },

  /* Requirements */
  requirementsCard: {
    backgroundColor: C.surfaceGray,
    borderRadius: 14,
    padding: 14,
    gap: 9,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  reqDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.surfaceGray,
    borderWidth: 1.5,
    borderColor: C.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqDotMet: { backgroundColor: C.green, borderColor: C.green },
  reqText: { color: C.mutedLight, fontSize: 13 },
  reqTextMet: { color: C.text },

  /* Terms */
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 22, marginTop: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: C.brandBorder,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: C.brand, borderColor: C.brand },
  termsText: { flex: 1, color: C.muted, fontSize: 13, lineHeight: 20 },
  termsLink: { color: C.brand, fontWeight: '700' },

  /* Referral */
  referralHero: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: C.goldBorder,
  },
  referralHeroGradient: { padding: 20, alignItems: 'center' },
  referralEmoji: { fontSize: 44, marginBottom: 10 },
  referralHeroTitle: { color: C.text, fontSize: 18, fontWeight: '900', marginBottom: 6 },
  referralHeroSub: { color: C.textSub, fontSize: 13, textAlign: 'center', lineHeight: 19 },

  referralCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: C.goldBorder,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  referralInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 4,
    height: 56,
  },
  referralIconWrap: {
    width: 36,
    alignItems: 'center',
    marginRight: 8,
  },
  referralInput: {
    flex: 1,
    color: C.muted,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
  },
  referralInputActive: { color: C.gold },
  referralBonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.goldFaint,
    borderTopWidth: 1,
    borderTopColor: C.goldBorder,
  },
  referralBonusText: { flex: 1, color: C.textSub, fontSize: 12, fontWeight: '600' },

  skipNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 22,
  },
  skipNoteText: { color: C.mutedLight, fontSize: 12 },

  /* Login link */
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  loginText: { color: C.muted, fontSize: 14 },
  loginLink: { color: C.brand, fontSize: 14, fontWeight: '800' },
});