import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AuthLayout } from '@/components/auth/auth-layout';
import { AppText, Button, TextField } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { useAlert } from '@/hooks/use-alert';
import { ApiError, authService, errorMessage } from '@/services';
import { colors, radius, spacing } from '@/theme';

const TERMS_URL = 'https://softkilla.es/winner/terms/';

type Step = 'email' | 'code' | 'password';

const STEPS: Record<Step, { title: string; subtitle: string }> = {
  email: { title: 'Crea tu cuenta', subtitle: 'Solo necesitamos tu correo para empezar' },
  code: { title: 'Revisa tu correo', subtitle: 'Ingresa el código de 6 dígitos que te enviamos' },
  password: { title: 'Crea tu contraseña', subtitle: 'La usarás para iniciar sesión' },
};

/**
 * Registro en 3 pasos: correo → código de verificación → contraseña.
 * Nombres, teléfono y los datos del negocio se piden después, en /onboarding.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const { completeSignup } = useAuth();
  const alert = useAlert();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [isBusiness, setIsBusiness] = useState(false);
  const [terms, setTerms] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const run = async (action: () => Promise<void>) => {
    setLoading(true);
    setError(undefined);
    try {
      await action();
    } catch (e) {
      setError(e instanceof ApiError ? (e.field('password') ?? e.field('email') ?? e.message) : errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error('Ingresa un correo válido.');
      if (!terms) throw new Error('Debes aceptar los términos y condiciones.');
      await authService.signupStart(normalizedEmail, isBusiness);
      setCode('');
      setStep('code');
    });

  const resendCode = () =>
    run(async () => {
      await authService.signupStart(normalizedEmail, isBusiness);
      setCode('');
      alert.success('Código reenviado', `Enviamos un código nuevo a ${normalizedEmail}.`);
    });

  const verifyCode = () =>
    run(async () => {
      await authService.signupVerify(normalizedEmail, code);
      setStep('password');
    });

  const createAccount = () =>
    run(async () => {
      if (password.length < 8) throw new Error('Mínimo 8 caracteres.');
      if (password !== confirm) throw new Error('Las contraseñas no coinciden.');
      await completeSignup(normalizedEmail, code, password);
      // El layout raíz lleva a /onboarding para completar el perfil.
    });

  const back = () => {
    setError(undefined);
    if (step === 'password') setStep('code');
    else if (step === 'code') setStep('email');
    else router.back();
  };

  const index = ['email', 'code', 'password'].indexOf(step);

  return (
    <AuthLayout
      title={STEPS[step].title}
      subtitle={STEPS[step].subtitle}
      onBack={back}
      footer={
        step === 'email' ? (
          <View style={styles.inline}>
            <AppText color="textSecondary">¿Ya tienes cuenta?</AppText>
            <Pressable onPress={() => router.replace('/auth/login')} hitSlop={8}>
              <AppText variant="bodyStrong" color="primary">
                Inicia sesión
              </AppText>
            </Pressable>
          </View>
        ) : undefined
      }
    >
      <View style={styles.progress}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.bar, i <= index && styles.barActive]} />
        ))}
      </View>

      {step === 'email' && (
        <>
          <TextField
            label="Correo electrónico"
            icon="mail-outline"
            placeholder="correo@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={error}
          />

          <Pressable
            onPress={() => setIsBusiness((v) => !v)}
            style={[styles.business, isBusiness && styles.businessActive]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isBusiness }}
          >
            <Ionicons name="storefront" size={22} color={isBusiness ? colors.primary : colors.textMuted} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">Quiero registrar mi negocio</AppText>
              <AppText variant="caption" color="textSecondary">
                Después te pediremos el RUC, la categoría y la ubicación del local.
              </AppText>
            </View>
            <Ionicons name={isBusiness ? 'checkbox' : 'square-outline'} size={22} color={isBusiness ? colors.primary : colors.textMuted} />
          </Pressable>

          <Pressable onPress={() => setTerms((t) => !t)} style={styles.terms} accessibilityRole="checkbox" accessibilityState={{ checked: terms }}>
            <Ionicons name={terms ? 'checkbox' : 'square-outline'} size={22} color={terms ? colors.primary : colors.textMuted} />
            <AppText variant="caption" color="textSecondary" style={{ flex: 1 }}>
              Acepto los{' '}
              <AppText variant="caption" color="primary" onPress={() => Linking.openURL(TERMS_URL)} style={{ fontWeight: '700' }}>
                términos y condiciones
              </AppText>
            </AppText>
          </Pressable>

          <Button title="Enviar código" size="lg" fullWidth loading={loading} onPress={sendCode} />
        </>
      )}

      {step === 'code' && (
        <>
          <AppText color="textSecondary" style={{ marginBottom: spacing.md }}>
            Enviamos un código a <AppText variant="bodyStrong">{normalizedEmail}</AppText>. Revisa también la carpeta de spam.
          </AppText>
          <TextField
            label="Código"
            icon="keypad-outline"
            placeholder="000000"
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.code}
            error={error}
          />
          <Button title="Verificar código" size="lg" fullWidth loading={loading} disabled={code.length !== 6} onPress={verifyCode} />
          <Button title="Reenviar código" variant="ghost" fullWidth onPress={resendCode} style={{ marginTop: spacing.xs }} />
        </>
      )}

      {step === 'password' && (
        <>
          <TextField label="Contraseña" icon="lock-closed-outline" secure value={password} onChangeText={setPassword} hint="Mínimo 8 caracteres, no solo números." />
          <TextField label="Confirmar contraseña" icon="lock-closed-outline" secure value={confirm} onChangeText={setConfirm} error={error} />
          <Button
            title={isBusiness ? 'Crear cuenta de negocio' : 'Crear mi cuenta'}
            size="lg"
            fullWidth
            loading={loading}
            disabled={!password || !confirm}
            onPress={createAccount}
          />
        </>
      )}
      <Alert visible={alert.visibleConfig} config={alert.config} onDismiss={alert.hide} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  progress: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xl },
  bar: { flex: 1, height: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  barActive: { backgroundColor: colors.primary },
  code: { fontSize: 22, letterSpacing: 8, fontWeight: '700' },
  business: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  businessActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  terms: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
});
