import AlertComponent from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { useAlert } from '@/hooks/use-alert';
import {
  changePasswordRequest,
  getUserProfileRequest,
  updateUserProfileRequest,
} from '@/services/user-service';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { HeaderModal } from './headerModal';

type ModalSettingsProps = {
  visible: boolean;
  onClose: () => void;
  onDeleteAccount: () => void;
};

type SettingAction = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  danger?: boolean;
  onPress?: () => void;
};

const C = {
  brand: '#b82a5e',
  brandLight: '#d4547e',
  brandDark: '#8a1f46',
  brandFaint: 'rgba(184,42,94,0.08)',
  brandBorder: 'rgba(184,42,94,0.18)',
  bg: '#ffffff',
  white: '#ffffff',
  muted: '#9b8492',
  text: '#1a0f15',
  textSub: '#6b5560',
  danger: '#dc2626',
  dangerFaint: 'rgba(220,38,38,0.08)',
  dangerBorder: 'rgba(220,38,38,0.18)',
};

export default function ModalSettings({
  visible,
  onClose,
  onDeleteAccount,
}: ModalSettingsProps) {
  const { authToken, refreshSession } = useAuth();

  const [expanded, setExpanded] = useState<'profile' | 'password' | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const { visibleConfig, config, hide, success, error , info} = useAlert();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!visible || !authToken) return;
    loadProfile();
  }, [visible, authToken]);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const profile = await getUserProfileRequest(authToken ?? '');
      setFirstName(profile.first_name ?? '');
      setLastName(profile.last_name ?? '');
      setEmail(profile.email ?? '');
      setPhone(profile.phone ?? '');
      setAvatarUrl(profile.avatar_url ?? '');
    } catch {
      error('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoadingProfile(false);
    }
  };

  const generateAvatarUrl = () => {
    const seed = `${firstName || 'user'}-${Date.now()}`;
    const url = `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(seed)}`;
    setAvatarUrl(url);
  };

  const saveProfile = async () => {
    if (!authToken) return;

    try {
      setSavingProfile(true);
      await updateUserProfileRequest(authToken, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl.trim(),
      });
      await refreshSession();
      setExpanded(null);
      success('Operación exitosa', 'Perfil actualizado correctamente');
    } catch (error: any) {
      error('Error', error?.message || 'No se pudo actualizar el perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!authToken) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      error("Error",'Completa todos los campos de contraseña');
      return;
    }

    if (newPassword !== confirmPassword) {
      error('Error', 'La nueva contraseña y su confirmación no coinciden');
      return;
    }

    try {
      setSavingPassword(true);
      await changePasswordRequest(authToken, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setExpanded(null);
      success('Operación exitosa', 'Contraseña actualizada correctamente');
    } catch (error: any) {
      error('Error', error?.message || 'No se pudo actualizar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  const actions: SettingAction[] = useMemo(
    () => [
      {
        id: 'edit-profile',
        title: 'Editar perfil',
        subtitle: 'Actualizar correo, teléfono y avatar',
        icon: 'create-outline',
        onPress: () => setExpanded((prev) => (prev === 'profile' ? null : 'profile')),
      },
      {
        id: 'change-password',
        title: 'Cambiar contraseña',
        subtitle: 'Actualizar credenciales de acceso',
        icon: 'lock-closed-outline',
        onPress: () => setExpanded((prev) => (prev === 'password' ? null : 'password')),
      },
      {
        id: 'delete-account',
        title: 'Eliminar cuenta',
        subtitle: 'Accion permanente e irreversible',
        icon: 'trash-outline',
        danger: true,
        onPress: onDeleteAccount,
      },
    ],
    [onDeleteAccount],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.root}>
        <StatusBar barStyle="light-content" />
        <HeaderModal title="Configuración" subtitle="Administra tu cuenta y preferencias" onClose={onClose} />

        <ScrollView style={s.body} contentContainerStyle={s.bodyContent}>
          {actions.map((action) => {
            const isProfileExpanded = expanded === 'profile' && action.id === 'edit-profile';
            const isPasswordExpanded = expanded === 'password' && action.id === 'change-password';

            return (
              <View key={action.id} style={[s.card, action.danger && s.cardDanger]}>
                <TouchableOpacity
                  style={s.cardRow}
                  activeOpacity={0.85}
                  onPress={action.onPress}
                >
                  <View style={[s.iconWrap, action.danger && s.iconWrapDanger]}>
                    <Ionicons
                      name={action.icon}
                      size={18}
                      color={action.danger ? C.danger : C.brand}
                    />
                  </View>

                  <View style={s.info}>
                    <Text style={[s.title, action.danger && s.titleDanger]}>{action.title}</Text>
                    <Text style={s.subtitle}>{action.subtitle}</Text>
                  </View>

                  <Ionicons
                    name={isProfileExpanded || isPasswordExpanded ? 'caret-up-outline' : 'caret-down-outline'}
                    size={16}
                    color={action.danger ? C.danger : C.muted}
                  />
                </TouchableOpacity>

                {action.id === 'edit-profile' && isProfileExpanded && (
                  <View style={s.formWrap}>
                    {loadingProfile ? (
                      <ActivityIndicator color={C.brand} />
                    ) : (
                      <>
                        <View style={s.avatarSection}>
                          {avatarUrl ? (
                            <Image
                              source={{ uri: avatarUrl }}
                              style={s.avatarPreview}
                              onError={() => setAvatarUrl('')}
                            />
                          ) : (
                            <View style={s.avatarPlaceholder}>
                              <Text style={s.avatarPlaceholderText}>Sin foto</Text>
                            </View>
                          )}

                          <TouchableOpacity style={s.secondaryBtn} onPress={generateAvatarUrl}>
                            <Text style={s.secondaryBtnText}>Generar avatar</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={s.grid}>
                          <View style={s.gridItemFull}>
                            <Text style={s.label}>Correo electrónico</Text>
                            <TextInput
                              style={s.input}
                              placeholder="correo@ejemplo.com"
                              autoCapitalize="none"
                              keyboardType="email-address"
                              value={email}
                              onChangeText={setEmail}
                            />
                          </View>

                          <View style={s.gridItemFull}>
                            <Text style={s.label}>Teléfono</Text>
                            <TextInput
                              style={s.input}
                              placeholder="+593 000 000 000"
                              keyboardType="phone-pad"
                              value={phone}
                              onChangeText={setPhone}
                            />
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[s.primaryBtn, savingProfile && s.primaryBtnDisabled]}
                          onPress={saveProfile}
                          disabled={savingProfile}
                        >
                          <Text style={s.primaryBtnText}>
                            {savingProfile ? 'Actualizando...' : 'Actualizar perfil'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}

                {action.id === 'change-password' && isPasswordExpanded && (
                  <View style={s.formWrap}>
                    <View style={s.fieldBlock}>
                      <Text style={s.label}>Contrasena actual</Text>
                      <View style={s.inputWithIcon}>
                        <TextInput
                          style={s.inputPassword}
                          placeholder="Contrasena actual"
                          secureTextEntry={!showCurrentPassword}
                          value={currentPassword}
                          onChangeText={setCurrentPassword}
                        />
                        <TouchableOpacity
                          onPress={() => setShowCurrentPassword((prev) => !prev)}
                          style={s.eyeBtn}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={C.muted}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={s.fieldBlock}>
                      <Text style={s.label}>Nueva contrasena</Text>
                      <View style={s.inputWithIcon}>
                        <TextInput
                          style={s.inputPassword}
                          placeholder="Nueva contrasena"
                          secureTextEntry={!showNewPassword}
                          value={newPassword}
                          onChangeText={setNewPassword}
                        />
                        <TouchableOpacity
                          onPress={() => setShowNewPassword((prev) => !prev)}
                          style={s.eyeBtn}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={C.muted}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={s.fieldBlock}>
                      <Text style={s.label}>Confirmar nueva contrasena</Text>
                      <View style={s.inputWithIcon}>
                        <TextInput
                          style={s.inputPassword}
                          placeholder="Confirmar nueva contrasena"
                          secureTextEntry={!showConfirmPassword}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword((prev) => !prev)}
                          style={s.eyeBtn}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={C.muted}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[s.primaryBtn, savingPassword && s.primaryBtnDisabled]}
                      onPress={savePassword}
                      disabled={savingPassword}
                    >
                      <Text style={s.primaryBtnText}>
                        {savingPassword ? 'Guardando...' : 'Cambiar contrasena'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
          <AlertComponent visible={visibleConfig} config={config} onDismiss={hide} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f2f5' },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.brandBorder,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  cardDanger: {
    borderColor: C.dangerBorder,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.brandFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDanger: {
    backgroundColor: C.dangerFaint,
  },
  info: {
    flex: 1,
  },
  title: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  titleDanger: {
    color: C.danger,
  },
  subtitle: {
    color: C.textSub,
    fontSize: 12,
  },
  formWrap: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    paddingTop: 6,
    gap: 14,
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
    marginBottom: 6,
  },
  avatarPreview: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: C.brand,
  },
  avatarPlaceholder: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  gridItem: {
    width: '48%',
    gap: 6,
  },
  gridItemFull: {
    width: '100%',
    gap: 6,
  },
  fieldBlock: {
    gap: 6,
  },
  label: {
    color: C.textSub,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: C.brandBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: C.text,
    backgroundColor: C.white,
  },
  inputWithIcon: {
    width: '100%',
    borderWidth: 1,
    borderColor: C.brandBorder,
    borderRadius: 10,
    backgroundColor: C.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  inputPassword: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: C.text,
  },
  eyeBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: C.brand,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: C.brandFaint,
    borderWidth: 1,
    borderColor: C.brandBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 170,
  },
  secondaryBtnText: {
    color: C.brand,
    fontSize: 12,
    fontWeight: '700',
  },
});
