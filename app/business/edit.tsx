import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { AppText, Button, Card, Chip, StackHeader, TextField } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { useBusiness } from '@/context/business-context';
import { useAlert } from '@/hooks/use-alert';
import { getCurrentLocation } from '@/hooks/use-current-location';
import { ApiError, businessService, errorMessage, portalService } from '@/services';
import type { Category, OwnBusinessInput } from '@/services';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import { categoryIcon } from '@/utils/category-icon';

const MAX_IMAGES = 4;

function toNullableInt(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function EditBusinessScreen() {
  const router = useRouter();
  const alert = useAlert();
  const { business, setBusiness } = useBusiness();
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState(business?.name ?? '');
  const [legalName, setLegalName] = useState(business?.legal_name ?? '');
  const [description, setDescription] = useState(business?.description ?? '');
  const [category, setCategory] = useState<number | null>(business?.category ?? null);
  const [phone, setPhone] = useState(business?.phone ?? '');
  const [website, setWebsite] = useState(business?.website ?? '');
  const [schedule, setSchedule] = useState(business?.schedule ?? '');
  const [address, setAddress] = useState(business?.address ?? '');
  const [coords, setCoords] = useState({ latitude: business?.latitude ?? '', longitude: business?.longitude ?? '' });
  const [checkinPoints, setCheckinPoints] = useState(business?.checkin_points ? String(business.checkin_points) : '');
  const [reviewPoints, setReviewPoints] = useState(business?.review_points !== null && business?.review_points !== undefined ? String(business.review_points) : '');
  const [radiusM, setRadiusM] = useState(business?.checkin_radius_m ? String(business.checkin_radius_m) : '');

  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    businessService.categories().then(setCategories).catch(() => undefined);
  }, []);

  if (!business) {
    return (
      <View style={styles.root}>
        <StackHeader title="Perfil del negocio" />
        <ActivityIndicator color={colors.primary} style={{ margin: spacing.xxl }} />
      </View>
    );
  }

  const defaults = business.effective_rules;

  const locate = async () => {
    setLocating(true);
    try {
      const location = await getCurrentLocation();
      setCoords({ latitude: location.latitude.toFixed(6), longitude: location.longitude.toFixed(6) });
    } catch (error) {
      alert.error('No pudimos obtener la ubicación', errorMessage(error));
    } finally {
      setLocating(false);
    }
  };

  const addImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const image = await portalService.addImage(result.assets[0].uri);
      setBusiness({ ...business, images: [...business.images, image] });
    } catch (error) {
      alert.error('No se pudo subir la foto', errorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (imageId: number) =>
    alert.show({
      type: 'confirm',
      title: 'Eliminar foto',
      message: 'La foto dejará de verse en tu página.',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await portalService.removeImage(imageId);
              setBusiness({ ...business, images: business.images.filter((i) => i.id !== imageId) });
            } catch (error) {
              alert.error('No se pudo eliminar', errorMessage(error));
            }
          },
        },
      ],
    });

  const save = async () => {
    const site = website.trim();
    const input: OwnBusinessInput = {
      name: name.trim(),
      legal_name: legalName.trim(),
      description: description.trim(),
      category: category ?? business.category,
      phone: phone.trim(),
      website: site && !/^https?:\/\//i.test(site) ? `https://${site}` : site,
      schedule: schedule.trim(),
      address: address.trim(),
      latitude: coords.latitude,
      longitude: coords.longitude,
      checkin_points: toNullableInt(checkinPoints),
      review_points: reviewPoints === '' ? null : Math.max(0, parseInt(reviewPoints, 10) || 0),
      checkin_radius_m: toNullableInt(radiusM),
    };
    setSaving(true);
    setErrors({});
    try {
      setBusiness(await portalService.update(input));
      router.back();
    } catch (error) {
      if (error instanceof ApiError) {
        const next: Record<string, string | undefined> = {};
        for (const key of Object.keys(error.fields)) next[key] = error.field(key);
        setErrors(next);
      }
      alert.error('No se pudo guardar', errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <StackHeader title="Perfil del negocio" subtitle={`RUC ${business.ruc}`} />
      <KeyboardAwareScrollView contentContainerStyle={styles.content} enableOnAndroid extraScrollHeight={24} keyboardShouldPersistTaps="handled">
        <Card>
          <AppText variant="h3" style={styles.title}>
            Información
          </AppText>
          <TextField label="Nombre comercial" value={name} onChangeText={setName} error={errors.name} />
          <TextField label="Razón social (opcional)" value={legalName} onChangeText={setLegalName} error={errors.legal_name} />
          <TextField
            label="Descripción"
            placeholder="Cuéntales a tus clientes qué te hace especial"
            value={description}
            onChangeText={setDescription}
            multiline
            style={{ minHeight: 60, textAlignVertical: 'top', paddingTop: spacing.sm }}
            error={errors.description}
          />
          <AppText variant="caption" color="textSecondary" style={styles.label}>
            Categoría
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {categories.map((c) => (
              <Chip key={c.id} label={c.name} icon={categoryIcon(c.icon)} selected={category === c.id} onPress={() => setCategory(c.id)} />
            ))}
          </ScrollView>
          <View style={{ height: spacing.md }} />
          <TextField label="Teléfono" icon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} />
          <TextField label="Sitio web o red social" icon="globe-outline" placeholder="instagram.com/tunegocio" value={website} onChangeText={setWebsite} autoCapitalize="none" keyboardType="url" error={errors.website} />
          <TextField label="Horario" icon="time-outline" placeholder="Lun a Sáb 8:00 - 20:00" value={schedule} onChangeText={setSchedule} error={errors.schedule} />
        </Card>

        <Card>
          <AppText variant="h3" style={styles.title}>
            Ubicación
          </AppText>
          <TextField label="Dirección" icon="location-outline" value={address} onChangeText={setAddress} error={errors.address} />
          <Pressable onPress={locate} style={styles.location} accessibilityRole="button">
            {locating ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="navigate-circle-outline" size={24} color={colors.primary} />}
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">Usar mi ubicación actual</AppText>
              <AppText variant="caption" color={errors.latitude ? 'danger' : 'textSecondary'}>
                {errors.latitude ?? `${Number(coords.latitude).toFixed(5)}, ${Number(coords.longitude).toFixed(5)} · hazlo desde el local`}
              </AppText>
            </View>
          </Pressable>
          <Button
            title="Ver en mapa"
            icon="map-outline"
            variant="ghost"
            size="sm"
            onPress={() =>
              router.push({ pathname: '/businesses/map', params: { lat: coords.latitude, lng: coords.longitude, name, address } })
            }
            style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}
          />
        </Card>

        <Card>
          <AppText variant="h3">Fotos</AppText>
          <AppText variant="caption" color="textSecondary" style={{ marginBottom: spacing.md }}>
            La primera foto es la portada de tu página. Máximo {MAX_IMAGES}.
          </AppText>
          <View style={styles.gallery}>
            {business.images.map((img, i) => (
              <View key={img.id} style={styles.photo}>
                <Image source={{ uri: img.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
                {i === 0 && (
                  <View style={styles.coverTag}>
                    <AppText variant="caption" color="textInverse" style={{ fontSize: 10 }}>
                      Portada
                    </AppText>
                  </View>
                )}
                <Pressable onPress={() => removeImage(img.id)} style={styles.photoDelete} hitSlop={6} accessibilityLabel="Eliminar foto">
                  <Ionicons name="close" size={14} color={colors.onPrimary} />
                </Pressable>
              </View>
            ))}
            {business.images.length < MAX_IMAGES && (
              <Pressable onPress={addImage} style={[styles.photo, styles.addPhoto]} accessibilityRole="button" accessibilityLabel="Agregar foto">
                {uploading ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="add" size={28} color={colors.primary} />}
              </Pressable>
            )}
          </View>
        </Card>

        <Card>
          <AppText variant="h3">Programa de puntos</AppText>
          <AppText variant="caption" color="textSecondary" style={{ marginBottom: spacing.md }}>
            Déjalo vacío para usar los valores recomendados por Akisito.
          </AppText>
          <TextField
            label="Puntos por visita"
            icon="qr-code-outline"
            placeholder={`${defaults.checkin_points} (recomendado)`}
            value={checkinPoints}
            onChangeText={(v) => setCheckinPoints(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            error={errors.checkin_points}
          />
          <TextField
            label="Puntos por reseña"
            icon="star-outline"
            placeholder={`${defaults.review_points} (recomendado)`}
            value={reviewPoints}
            onChangeText={(v) => setReviewPoints(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            error={errors.review_points}
          />
          <TextField
            label="Radio para escanear (metros)"
            icon="radio-outline"
            placeholder={`${defaults.checkin_radius_m} (recomendado)`}
            value={radiusM}
            onChangeText={(v) => setRadiusM(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            error={errors.checkin_radius_m}
            hint="Distancia máxima desde tu local para que el cliente sume puntos (30 a 1000 m)."
          />
        </Card>

        <Button title="Guardar cambios" size="lg" fullWidth loading={saving} onPress={save} />
      </KeyboardAwareScrollView>
      <Alert visible={alert.visibleConfig} config={alert.config} onDismiss={alert.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: SCREEN_PADDING, gap: spacing.md, paddingBottom: spacing.xxxl },
  title: { marginBottom: spacing.md },
  label: { marginBottom: spacing.xs, marginLeft: spacing.xxs },
  chips: { gap: spacing.sm },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: { width: '48%', aspectRatio: 16 / 10, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceMuted },
  addPhoto: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primaryLight,
    backgroundColor: colors.primarySoft,
  },
  coverTag: {
    position: 'absolute',
    left: spacing.xs,
    bottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  photoDelete: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.scrimStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
