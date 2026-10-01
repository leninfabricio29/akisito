import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AuthLayout } from '@/components/auth/auth-layout';
import { LocationField } from '@/components/business/location-picker';
import type { Coords } from '@/components/business/location-picker';
import { AppText, Button, Chip, TextField } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { useBusiness } from '@/context/business-context';
import { useAlert } from '@/hooks/use-alert';
import { ApiError, authService, businessService, errorMessage, portalService } from '@/services';
import type { Category } from '@/services';
import { colors, radius, spacing } from '@/theme';
import { categoryIcon } from '@/utils/category-icon';

type Errors = Record<string, string | undefined>;

function fieldErrors(error: unknown): Errors {
  const next: Errors = {};
  if (error instanceof ApiError) for (const key of Object.keys(error.fields)) next[key] = error.field(key);
  return next;
}

/**
 * Completar la cuenta tras el registro (solo correo). El layout raíz no deja salir de aquí
 * mientras user.pending_steps tenga pasos: primero los datos personales y, si es negocio, el negocio.
 */
export default function OnboardingScreen() {
  const { user, signOut } = useAuth();
  const step = user?.pending_steps?.[0] ?? 'profile';
  const isBusiness = user?.role === 'business';
  const total = isBusiness ? 2 : 1;
  const current = step === 'business' ? 2 : 1;

  return (
    <AuthLayout
      title={step === 'business' ? 'Datos de tu negocio' : 'Completa tu perfil'}
      subtitle={
        step === 'business'
          ? 'Los revisaremos para aprobar tu negocio'
          : isBusiness
            ? 'Datos del propietario del negocio'
            : 'Así te reconocerán los negocios que visites'
      }
      footer={
        <Pressable onPress={() => void signOut()} hitSlop={8}>
          <AppText variant="bodyStrong" color="textSecondary">
            Cerrar sesión
          </AppText>
        </Pressable>
      }
    >
      {total > 1 && (
        <View style={styles.progress}>
          {Array.from({ length: total }, (_, i) => (
            <View key={i} style={[styles.bar, i < current && styles.barActive]} />
          ))}
        </View>
      )}
      {step === 'business' ? <BusinessStep /> : <ProfileStep askCi={!isBusiness} />}
    </AuthLayout>
  );
}

function ProfileStep({ askCi }: { askCi: boolean }) {
  const { user, setUser } = useAuth();
  const alert = useAlert();
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [ci, setCi] = useState(user?.ci ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e: Errors = {};
    if (!firstName.trim()) e.first_name = 'Ingresa tus nombres.';
    if (!lastName.trim()) e.last_name = 'Ingresa tus apellidos.';
    if (!phone.trim()) e.phone = 'Ingresa tu teléfono.';
    if (askCi && ci.trim() && !/^\d{10}$/.test(ci.trim())) e.ci = 'La cédula tiene 10 dígitos.';
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    setLoading(true);
    try {
      setUser(
        await authService.updateMe({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          ...(askCi && ci.trim() && !user?.ci ? { ci: ci.trim() } : {}),
        }),
      );
      // Con pending_steps actualizado, el layout pasa al siguiente paso o a la app.
    } catch (error) {
      setErrors(fieldErrors(error));
      alert.error('No pudimos guardar tus datos', errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TextField label="Nombres" placeholder="Ana" value={firstName} onChangeText={setFirstName} error={errors.first_name} autoCapitalize="words" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Apellidos" placeholder="Pérez" value={lastName} onChangeText={setLastName} error={errors.last_name} autoCapitalize="words" />
        </View>
      </View>
      <TextField label="Teléfono" icon="call-outline" placeholder="0991234567" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} />
      {askCi && (
        <TextField
          label="Cédula (opcional)"
          icon="card-outline"
          placeholder="1712345678"
          value={ci}
          onChangeText={setCi}
          keyboardType="number-pad"
          maxLength={10}
          editable={!user?.ci}
          error={errors.ci}
        />
      )}
      <Button title="Continuar" size="lg" fullWidth loading={loading} onPress={submit} style={{ marginTop: spacing.md }} />
      <Alert visible={alert.visibleConfig} config={alert.config} onDismiss={alert.hide} />
    </>
  );
}

function BusinessStep() {
  const { refreshUser } = useAuth();
  const { setBusiness } = useBusiness();
  const alert = useAlert();

  const [name, setName] = useState('');
  const [ruc, setRuc] = useState('');
  const [category, setCategory] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    businessService.categories().then(setCategories).catch(() => undefined);
  }, []);

  const submit = async () => {
    const e: Errors = {};
    if (!name.trim()) e.name = 'Ingresa el nombre del negocio.';
    if (!/^\d{13}$/.test(ruc.trim())) e.ruc = 'El RUC tiene 13 dígitos.';
    if (!category) e.category = 'Elige una categoría.';
    if (!address.trim()) e.address = 'Ingresa la dirección.';
    if (!coords) e.location = 'Elige en el mapa la ubicación del local.';
    setErrors(e);
    if (Object.values(e).some(Boolean) || !coords || !category) return;

    setLoading(true);
    try {
      setBusiness(
        await portalService.create({
          name: name.trim(),
          ruc: ruc.trim(),
          category,
          address: address.trim(),
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        }),
      );
      await refreshUser();
      // Sin pasos pendientes, el layout lleva al portal del negocio (pendiente de aprobación).
    } catch (error) {
      const found = fieldErrors(error);
      if (found.latitude || found.longitude) found.location = found.latitude ?? found.longitude;
      setErrors(found);
      alert.error('No pudimos registrar tu negocio', errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TextField label="Nombre comercial" icon="storefront-outline" placeholder="Café Central" value={name} onChangeText={setName} error={errors.name} />
      <TextField
        label="RUC"
        icon="document-text-outline"
        placeholder="1790012345001"
        value={ruc}
        onChangeText={setRuc}
        keyboardType="number-pad"
        maxLength={13}
        error={errors.ruc}
        hint="Lo validamos antes de aprobar tu negocio. No se puede cambiar después."
      />

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

      <AppText variant="caption" color="textSecondary" style={[styles.label, { marginTop: spacing.md }]}>
        Ubicación del local
      </AppText>
      <LocationField
        value={coords}
        error={errors.location}
        onChange={(picked) => {
          setCoords({ latitude: picked.latitude, longitude: picked.longitude });
          if (picked.address) setAddress(picked.address);
          setErrors((e) => ({ ...e, location: undefined, address: picked.address ? undefined : e.address }));
        }}
      />
      <View style={{ height: spacing.md }} />
      <TextField
        label="Dirección"
        icon="location-outline"
        placeholder="Se llena al elegir el punto en el mapa"
        value={address}
        onChangeText={setAddress}
        error={errors.address}
        hint="Puedes corregirla o agregar una referencia."
      />

      <Button title="Enviar a revisión" size="lg" fullWidth loading={loading} onPress={submit} style={{ marginTop: spacing.lg }} />
      <Alert visible={alert.visibleConfig} config={alert.config} onDismiss={alert.hide} />
    </>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xl },
  bar: { flex: 1, height: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  barActive: { backgroundColor: colors.primary },
  row: { flexDirection: 'row', gap: spacing.sm },
  label: { marginBottom: spacing.xs, marginLeft: spacing.xxs },
  chips: { gap: spacing.sm, paddingBottom: spacing.xs },
  error: { marginTop: spacing.xs, marginLeft: spacing.xxs },
});
