import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthLayout } from '@/components/auth/auth-layout';
import { AppText, Button, TextField } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { useAlert } from '@/hooks/use-alert';
import { ApiError, authService, errorMessage } from '@/services';
import { colors, radius, spacing } from '@/theme';

type Step = 'email' | 'code' | 'password';

const STEPS: Record<Step, { title: string; subtitle: string }> = {
  email: { title: 'Recupera tu cuenta', subtitle: 'Te enviaremos un código a tu correo' },
  code: { title: 'Revisa tu correo', subtitle: 'Ingresa el código de 6 dígitos que te enviamos' },
  password: { title: 'Nueva contraseña', subtitle: 'Elige una contraseña segura' },
};

export default function RecoveryScreen() {
  const router = useRouter();
  const alert = useAlert();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setLoading(true);
    setError(undefined);
    try {
      await action();
    } catch (e) {
      setError(e instanceof ApiError ? (e.field('new_password') ?? e.message) : errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error('Ingresa un correo válido.');
      await authService.forgotPassword(email.trim().toLowerCase());
      setStep('code');
    });

  const verifyCode = () =>
    run(async () => {
      await authService.verifyResetCode(email.trim().toLowerCase(), code.trim());
      setStep('password');
    });

  const resetPassword = () =>
    run(async () => {
      if (password !== confirm) throw new Error('Las contraseñas no coinciden.');
      await authService.resetPassword(email.trim().toLowerCase(), code.trim(), password);
      alert.success('¡Listo!', 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.', [
        { text: 'Iniciar sesión', onPress: () => router.replace('/auth/login') },
      ]);
    });

  const back = () => {
    setError(undefined);
    if (step === 'password') setStep('code');
    else if (step === 'code') setStep('email');
    else router.back();
  };

  const index = ['email', 'code', 'password'].indexOf(step);

  return (
    <AuthLayout title={STEPS[step].title} subtitle={STEPS[step].subtitle} onBack={back}>
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
            error={error}
          />
          <Button title="Enviar código" size="lg" fullWidth loading={loading} onPress={sendCode} />
        </>
      )}

      {step === 'code' && (
        <>
          <AppText color="textSecondary" style={{ marginBottom: spacing.md }}>
            Si <AppText variant="bodyStrong">{email}</AppText> está registrado, recibirás un código válido por tiempo limitado.
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
          <Button title="Reenviar código" variant="ghost" fullWidth onPress={sendCode} style={{ marginTop: spacing.xs }} />
        </>
      )}

      {step === 'password' && (
        <>
          <TextField label="Nueva contraseña" icon="lock-closed-outline" secure value={password} onChangeText={setPassword} hint="Mínimo 8 caracteres, no solo números." />
          <TextField label="Confirmar contraseña" icon="lock-closed-outline" secure value={confirm} onChangeText={setConfirm} error={error} />
          <Button title="Guardar contraseña" size="lg" fullWidth loading={loading} disabled={!password || !confirm} onPress={resetPassword} />
        </>
      )}
      <Alert visible={alert.visibleConfig} config={alert.config} onDismiss={alert.hide} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xl },
  bar: { flex: 1, height: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  barActive: { backgroundColor: colors.primary },
  code: { fontSize: 22, letterSpacing: 8, fontWeight: '700' },
});
