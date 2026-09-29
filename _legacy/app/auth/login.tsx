import AlertComponent from '@/components/ui/alert';
import { useAlert } from '@/hooks/use-alert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuth } from '../../context/auth-context';


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
  white: '#ffffff',
  muted: '#9b8492',
  mutedLight: '#c5b5be',
  text: '#1a0f15',
  textSub: '#6b5560',
  error: '#e53e3e',
};

// ── Input Field ───────────────────────────────────────────
function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  rightElement,
}: {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  rightElement?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[f.wrap, focused && f.wrapFocused]}>
      <View style={[f.iconWrap, focused && f.iconWrapFocused]}>
        <Ionicons
          name={icon as any}
          size={17}
          color={focused ? C.brand : C.mutedLight}
        />
      </View>
      <TextInput
        style={f.input}
        placeholder={placeholder}
        placeholderTextColor={C.mutedLight}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {rightElement && <View style={f.rightSlot}>{rightElement}</View>}
    </View>
  );
}

const f = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.borderLight,
    marginBottom: 14,
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
  rightSlot: { paddingRight: 14 },
});

// ── Main Screen ───────────────────────────────────────────
export default function LoginScreen() {
  const TERMS_URL = 'https://softkilla.es/winner/terms/';
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { visibleConfig, config, hide, error } = useAlert();
  const handleLogin = async () => {
    setIsSubmitting(true);
    const result = await signIn(email, password);
    setIsSubmitting(false);

    if (!result.ok) {
      error('Error', result.message || 'Error desconocido. Intenta de nuevo.');
      return;
    }

    router.replace('/(tabs)');
  };

  const handleOpenTerms = async () => {
    try {
      await Linking.openURL(TERMS_URL);
    } catch {
      error('Error', 'No se pudo abrir el enlace de términos y condiciones.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <KeyboardAwareScrollView
        style={s.root}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero gradient ── */}
        <LinearGradient
          colors={[C.brandDark, C.brand, '#c94070']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          <View style={s.circle1} />
          <View style={s.circle2} />
          <View style={s.circle3} />

          <View style={s.logoWrap}>
            <View style={s.logoIcon}>
              <Ionicons name="location" size={28} color={C.white} />
            </View>
            <Text style={s.logoText}>
              Explora y Gana con <Text style={s.logoBold}> Akisito</Text>
            </Text>
          </View>

          <Text style={s.heroTagline}>
            Descubre asociados,{'\n'}gana puntos, vive más.
          </Text>

          
        </LinearGradient>

        {/* ── White card ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Bienvenido de vuelta</Text>
          <Text style={s.cardSub}>Ingresa tus credenciales</Text>

          {/* Email */}
          <Field
            icon="mail-outline"
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          {/* Password */}
          <Field
            icon="lock-closed-outline"
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            rightElement={
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={C.mutedLight}
                />
              </TouchableOpacity>
            }
          />

          {/* Forgot */}
          <TouchableOpacity
            style={s.forgotRow}
            onPress={() => router.push('/auth/recovery-pasword')}
          >
            <Text style={s.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Terms */}

          {/* Submit */}
          <TouchableOpacity
            style={[s.submitBtn, isSubmitting && s.submitBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={[C.brand, C.brandDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.submitGradient}
            >
              <Text style={s.submitText}>
                {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={C.white} />
            </LinearGradient>
          </TouchableOpacity>

         
          {/* Register */}
          <View style={s.registerRow}>
            <Text style={s.registerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={s.registerLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
      <AlertComponent visible={visibleConfig} config={config} onDismiss={hide} />
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { flexGrow: 1 },

  /* Hero */
  hero: {
    paddingTop: Platform.select({ ios: 70, android: 54, default: 54 }),
    paddingBottom: 52,
    paddingHorizontal: 28,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -70,
    right: -70,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 0,
    left: -50,
  },
  circle3: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: 80,
    right: 90,
  },

  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 22,
  },
  logoIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 17,
    fontWeight: '400',
  },
  logoBold: { color: C.white, fontWeight: '900' },

  heroTagline: {
    color: C.white,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.5,
    marginBottom: 24,
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 12,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  statValue: { color: C.white, fontSize: 18, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },

  /* Card */
  card: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 32,
    paddingBottom: 16,
  },
  cardTitle: {
    color: C.brandDark,
    fontSize: 23,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardSub: { color: C.muted, fontSize: 14, marginBottom: 28 },

  /* Forgot */
  forgotRow: { alignSelf: 'flex-end', marginBottom: 22, marginTop: -4 },
  forgotText: { color: C.brand, fontSize: 13, fontWeight: '600' },

  /* Submit */
  submitBtn: { backgroundColor: C.brand, borderRadius: 16, overflow: 'hidden', marginBottom: 26 },
  submitBtnDisabled: { opacity: 0.65 },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  submitText: { color: '#ffff', fontSize: 16, fontWeight: '800' },

  /* Divider */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.borderLight },
  dividerText: { color: C.mutedLight, fontSize: 12 },

  /* Social */
  socialRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.surfaceGray,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: C.borderLight,
  },
  socialText: { color: C.textSub, fontSize: 12, fontWeight: '700' },

  /* Register */
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: { color: C.muted, fontSize: 14 },
  registerLink: { color: C.brand, fontSize: 14, fontWeight: '800' },
});