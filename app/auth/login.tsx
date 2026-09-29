import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AuthLayout } from '@/components/auth/auth-layout';
import { AppText, Button, TextField } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { useAlert } from '@/hooks/use-alert';
import { errorMessage } from '@/services';
import { spacing } from '@/theme';

const TERMS_URL = 'https://softkilla.es/winner/terms/';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const alert = useAlert();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      alert.error('Faltan datos', 'Ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      // El layout raíz redirige según el rol.
    } catch (error) {
      alert.error('No pudimos iniciar sesión', errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="¡Hola de nuevo!"
      subtitle="Ingresa y sigue sumando puntos en tus lugares favoritos"
      footer={
        <>
          <View style={styles.inline}>
            <AppText color="textSecondary">¿No tienes cuenta?</AppText>
            <Pressable onPress={() => router.push('/auth/register')} hitSlop={8}>
              <AppText variant="bodyStrong" color="primary">
                Regístrate
              </AppText>
            </Pressable>
          </View>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8} style={{ marginTop: spacing.md }}>
            <AppText variant="caption" color="textMuted">
              Términos y condiciones
            </AppText>
          </Pressable>
        </>
      }
    >
      <TextField
        label="Correo electrónico"
        icon="mail-outline"
        placeholder="correo@ejemplo.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <TextField
        label="Contraseña"
        icon="lock-closed-outline"
        placeholder="Tu contraseña"
        secure
        value={password}
        onChangeText={setPassword}
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <Pressable onPress={() => router.push('/auth/recovery')} hitSlop={8} style={styles.forgot}>
        <AppText variant="caption" color="primary" style={{ fontWeight: '700' }}>
          ¿Olvidaste tu contraseña?
        </AppText>
      </Pressable>
      <Button title="Ingresar" size="lg" fullWidth loading={loading} onPress={submit} />
      <Alert visible={alert.visibleConfig} config={alert.config} onDismiss={alert.hide} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  forgot: { alignSelf: 'flex-end', marginBottom: spacing.lg },
});
