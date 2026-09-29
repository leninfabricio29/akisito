import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AuthLayout } from '@/components/auth/auth-layout';
import { AppText, Button, Chip, TextField } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { useAlert } from '@/hooks/use-alert';
import { getCurrentLocation } from '@/hooks/use-current-location';
import { ApiError, businessService, errorMessage } from '@/services';
import type { Category } from '@/services';
import { colors, radius, spacing } from '@/theme';
import { categoryIcon } from '@/utils/category-icon';

const TERMS_URL = 'https://softkilla.es/winner/terms/';

type Errors = Record<string, string | undefined>;

export default function RegisterScreen() {
  const router = useRouter();
  const { registerClient, registerBusiness } = useAuth();
  const alert = useAlert();

  const [isBusiness, setIsBusiness] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [ci, setCi] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [ruc, setRuc] = useState('');
  const [category, setCategory] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [schedule, setSchedule] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    businessService.categories().then(setCategories).catch(() => undefined);
  }, []);

  const locate = async () => {
    setLocating(true);
    try {
      const location = await getCurrentLocation();
      setCoords({ latitude: location.latitude, longitude: location.longitude });
      setErrors((e) => ({ ...e, location: undefined }));
    } catch (error) {
      alert.error('No pudimos obtener la ubicación', errorMessage(error));
    } finally {
      setLocating(false);
    }
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!firstName.trim()) e.first_name = 'Ingresa tus nombres.';
    if (!lastName.trim()) e.last_name = 'Ingresa tus apellidos.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Ingresa un correo válido.';
    if (!phone.trim()) e.phone = 'Ingresa tu teléfono.';
    if (password.length < 8) e.password = 'Mínimo 8 caracteres.';
    if (password !== confirm) e.confirm = 'Las contraseñas no coinciden.';
    if (isBusiness) {
      if (!businessName.trim()) e.business_name = 'Ingresa el nombre del negocio.';
      if (!/^\d{13}$/.test(ruc.trim())) e.ruc = 'El RUC tiene 13 dígitos.';
      if (!category) e.category = 'Elige una categoría.';
      if (!address.trim()) e.address = 'Ingresa la dirección.';
      if (!coords) e.location = 'Registra la ubicación del local.';
    } else if (!/^\d{10}$/.test(ci.trim())) {
      e.ci = 'La cédula tiene 10 dígitos.';
    }
    return e;
  };

  const submit = async () => {
    const found = validate();
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    if (!terms) {
      alert.error('Términos y condiciones', 'Debes aceptar los términos para crear tu cuenta.');
      return;
    }

    setLoading(true);
    const base = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone.trim(),
    };
    try {
      if (isBusiness && coords && category) {
        await registerBusiness({
          ...base,
          business_name: businessName.trim(),
          ruc: ruc.trim(),
          category,
          address: address.trim(),
          schedule: schedule.trim() || undefined,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        });
      } else {
        await registerClient({ ...base, ci: ci.trim() });
      }
      // El layout raíz redirige según el rol.
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fields).length) {
        const next: Errors = {};
        for (const key of Object.keys(error.fields)) next[key] = error.field(key);
        setErrors(next);
      }
      alert.error('No pudimos crear tu cuenta', errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle={isBusiness ? 'Fideliza a tus clientes con Akisito' : 'Gana puntos en cada visita'}
      onBack={() => router.back()}
      footer={
        <View style={styles.inline}>
          <AppText color="textSecondary">¿Ya tienes cuenta?</AppText>
          <Pressable onPress={() => router.replace('/auth/login')} hitSlop={8}>
            <AppText variant="bodyStrong" color="primary">
              Inicia sesión
            </AppText>
          </Pressable>
        </View>
      }
    >
      <View style={styles.segment} accessibilityRole="tablist">
        {[
          { key: false, label: 'Soy cliente', icon: 'person' as const },
          { key: true, label: 'Tengo un negocio', icon: 'storefront' as const },
        ].map((opt) => {
          const active = isBusiness === opt.key;
          return (
            <Pressable
              key={opt.label}
              onPress={() => {
                setIsBusiness(opt.key);
                setErrors({});
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.segmentItem, active && styles.segmentActive]}
            >
              <Ionicons name={opt.icon} size={16} color={active ? colors.primary : colors.textMuted} />
              <AppText variant="bodyStrong" style={{ color: active ? colors.primary : colors.textMuted }}>
                {opt.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <AppText variant="overline" color="textMuted" style={styles.section}>
        {isBusiness ? 'Datos del propietario' : 'Tus datos'}
      </AppText>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TextField label="Nombres" placeholder="Ana" value={firstName} onChangeText={setFirstName} error={errors.first_name} autoCapitalize="words" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Apellidos" placeholder="Pérez" value={lastName} onChangeText={setLastName} error={errors.last_name} autoCapitalize="words" />
        </View>
      </View>
      {!isBusiness && (
        <TextField label="Cédula" icon="card-outline" placeholder="1712345678" value={ci} onChangeText={setCi} keyboardType="number-pad" maxLength={10} error={errors.ci} />
      )}
      <TextField label="Correo electrónico" icon="mail-outline" placeholder="correo@ejemplo.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
      <TextField label="Teléfono" icon="call-outline" placeholder="0991234567" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} />
      <TextField label="Contraseña" icon="lock-closed-outline" placeholder="Mínimo 8 caracteres" secure value={password} onChangeText={setPassword} error={errors.password} />
      <TextField label="Confirmar contraseña" icon="lock-closed-outline" placeholder="Repite tu contraseña" secure value={confirm} onChangeText={setConfirm} error={errors.confirm} />

      {isBusiness && (
        <>
          <AppText variant="overline" color="textMuted" style={styles.section}>
            Datos del negocio
          </AppText>
          <TextField label="Nombre comercial" icon="storefront-outline" placeholder="Café Central" value={businessName} onChangeText={setBusinessName} error={errors.business_name} />
          <TextField label="RUC" icon="document-text-outline" placeholder="1790012345001" value={ruc} onChangeText={setRuc} keyboardType="number-pad" maxLength={13} error={errors.ruc} hint="Lo validamos con el SRI antes de aprobar tu negocio." />

          <AppText variant="caption" color="textSecondary" style={styles.label}>
            Categoría
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {categories.map((c) => (
              <Chip key={c.id} label={c.name} icon={categoryIcon(c.icon)} selected={category === c.id} onPress={() => setCategory(c.id)} />
            ))}
          </ScrollView>
          {errors.category && (
            <AppText variant="caption" color="danger" style={styles.error}>
              {errors.category}
            </AppText>
          )}

          <TextField label="Dirección" icon="location-outline" placeholder="Av. Amazonas y Colón" value={address} onChangeText={setAddress} error={errors.address} />
          <TextField label="Horario (opcional)" icon="time-outline" placeholder="Lun a Sáb 8:00 - 20:00" value={schedule} onChangeText={setSchedule} />

          <Pressable onPress={locate} style={[styles.location, coords && styles.locationDone, errors.location && styles.locationError]}>
            {locating ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name={coords ? 'checkmark-circle' : 'navigate-circle-outline'} size={24} color={coords ? colors.success : colors.primary} />
            )}
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{coords ? 'Ubicación registrada' : 'Usar mi ubicación actual'}</AppText>
              <AppText variant="caption" color={errors.location ? 'danger' : 'textSecondary'}>
                {errors.location ??
                  (coords
                    ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)} · toca para actualizar`
                    : 'Hazlo desde el local: tus clientes solo sumarán puntos cerca de aquí.')}
              </AppText>
            </View>
          </Pressable>
        </>
      )}

      <Pressable onPress={() => setTerms((t) => !t)} style={styles.terms} accessibilityRole="checkbox" accessibilityState={{ checked: terms }}>
        <Ionicons name={terms ? 'checkbox' : 'square-outline'} size={22} color={terms ? colors.primary : colors.textMuted} />
        <AppText variant="caption" color="textSecondary" style={{ flex: 1 }}>
          Acepto los{' '}
          <AppText variant="caption" color="primary" onPress={() => Linking.openURL(TERMS_URL)} style={{ fontWeight: '700' }}>
            términos y condiciones
          </AppText>
        </AppText>
      </Pressable>

      <Button title={isBusiness ? 'Registrar negocio' : 'Crear mi cuenta'} size="lg" fullWidth loading={loading} onPress={submit} />
      <Alert visible={alert.visibleConfig} config={alert.config} onDismiss={alert.hide} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  segment: { flexDirection: 'row', padding: spacing.xs, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, marginBottom: spacing.md },
  segmentItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm + 2, borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.surface },
  section: { marginTop: spacing.sm, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  label: { marginBottom: spacing.xs, marginLeft: spacing.xxs },
  chips: { gap: spacing.sm, paddingBottom: spacing.xs },
  error: { marginTop: spacing.xs, marginLeft: spacing.xxs },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  locationDone: { borderStyle: 'solid', borderColor: colors.success, backgroundColor: colors.successSoft },
  locationError: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  terms: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
});
