import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { AppText, Button, Card, StackHeader, TextField } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { useAlert } from '@/hooks/use-alert';
import { ApiError, authService, errorMessage } from '@/services';
import { colors, SCREEN_PADDING, spacing } from '@/theme';

export default function SettingsScreen() {
  const { user, setUser, signOut, isBusiness } = useAuth();
  const alert = useAlert();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string | undefined>>({});

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string | undefined>>({});

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string>();
  const [deleting, setDeleting] = useState(false);

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileErrors({});
    try {
      setUser(await authService.updateMe({ first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim() }));
      alert.success('Perfil actualizado', 'Tus datos se guardaron correctamente.');
    } catch (error) {
      if (error instanceof ApiError) {
        setProfileErrors({ first_name: error.field('first_name'), last_name: error.field('last_name'), phone: error.field('phone') });
      }
      alert.error('No se pudo guardar', errorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (next !== confirm) {
      setPasswordErrors({ confirm: 'Las contraseñas no coinciden.' });
      return;
    }
    setSavingPassword(true);
    setPasswordErrors({});
    try {
      await authService.changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      alert.success('Contraseña actualizada', 'Usa tu nueva contraseña la próxima vez que inicies sesión.');
    } catch (error) {
      if (error instanceof ApiError) {
        setPasswordErrors({ current: error.field('current_password'), next: error.field('new_password') });
      }
      alert.error('No se pudo cambiar', errorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  };

  const confirmDelete = () =>
    alert.show({
      type: 'confirm',
      title: '¿Eliminar tu cuenta?',
      message: isBusiness
        ? 'Tu negocio quedará suspendido y tus clientes dejarán de sumar puntos. Esta acción no se puede deshacer.'
        : 'Perderás tus puntos en todos los negocios. Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await authService.deleteAccount(deletePassword);
              await signOut();
            } catch (error) {
              setDeleteError(error instanceof ApiError ? error.field('password') ?? error.message : errorMessage(error));
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    });

  return (
    <View style={styles.root}>
      <StackHeader title="Configuración" subtitle="Administra tu cuenta" />
      <KeyboardAwareScrollView contentContainerStyle={styles.content} enableOnAndroid extraScrollHeight={24}>
        <Card>
          <AppText variant="h3" style={styles.title}>
            Datos personales
          </AppText>
          <TextField label="Nombres" icon="person-outline" value={firstName} onChangeText={setFirstName} error={profileErrors.first_name} />
          <TextField label="Apellidos" icon="person-outline" value={lastName} onChangeText={setLastName} error={profileErrors.last_name} />
          <TextField label="Teléfono" icon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={profileErrors.phone} />
          <TextField label="Correo" icon="mail-outline" value={user?.email ?? ''} editable={false} hint="El correo no se puede cambiar." />
          {!!user?.ci && <TextField label="Cédula" icon="card-outline" value={user.ci} editable={false} />}
          <Button title="Guardar cambios" onPress={saveProfile} loading={savingProfile} fullWidth />
        </Card>

        <Card>
          <AppText variant="h3" style={styles.title}>
            Cambiar contraseña
          </AppText>
          <TextField label="Contraseña actual" icon="lock-closed-outline" secure value={current} onChangeText={setCurrent} error={passwordErrors.current} />
          <TextField label="Nueva contraseña" icon="key-outline" secure value={next} onChangeText={setNext} hint="Mínimo 8 caracteres, no solo números." error={passwordErrors.next} />
          <TextField label="Confirmar contraseña" icon="key-outline" secure value={confirm} onChangeText={setConfirm} error={passwordErrors.confirm} />
          <Button title="Actualizar contraseña" variant="secondary" onPress={savePassword} loading={savingPassword} disabled={!current || !next} fullWidth />
        </Card>

        <Card>
          <AppText variant="h3" color="danger">
            Eliminar cuenta
          </AppText>
          <AppText color="textSecondary" style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
            {isBusiness
              ? 'Se borran tus datos personales y tu negocio deja de estar disponible.'
              : 'Se borran tus datos personales y pierdes los puntos acumulados.'}
          </AppText>
          <TextField
            label="Confirma con tu contraseña"
            icon="lock-closed-outline"
            secure
            value={deletePassword}
            onChangeText={(v) => {
              setDeletePassword(v);
              setDeleteError(undefined);
            }}
            error={deleteError}
          />
          <Button
            title="Eliminar mi cuenta"
            variant="danger"
            icon="trash-outline"
            onPress={confirmDelete}
            disabled={!deletePassword}
            loading={deleting}
            fullWidth
          />
        </Card>
      </KeyboardAwareScrollView>
      <Alert visible={alert.visibleConfig} config={alert.config} onDismiss={alert.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: SCREEN_PADDING, gap: spacing.md, paddingBottom: spacing.xxxl },
  title: { marginBottom: spacing.md },
});
