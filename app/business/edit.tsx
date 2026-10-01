import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { LocationField } from '@/components/business/location-picker';
import type { Coords } from '@/components/business/location-picker';
import { AppText, Avatar, Button, Card, Chip, StackHeader, TextField } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { useBusiness } from '@/context/business-context';
import { useAlert } from '@/hooks/use-alert';
import { ApiError, businessService, errorMessage, portalService } from '@/services';
import type { Category, OwnBusinessInput } from '@/services';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import { categoryIcon } from '@/utils/category-icon';

function toNullableInt(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

type ImageKind = 'logo' | 'cover';

export default function EditBusinessScreen() {
  const router = useRouter();
  const alert = useAlert();
  const { business, setBusiness } = useBusiness();
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState(business?.name ?? '');
  const [description, setDescription] = useState(business?.description ?? '');
  const [category, setCategory] = useState<number | null>(business?.category ?? null);
  const [address, setAddress] = useState(business?.address ?? '');
  const [coords, setCoords] = useState<Coords | null>(
    business ? { latitude: Number(business.latitude), longitude: Number(business.longitude) } : null,
  );
  const [checkinPoints, setCheckinPoints] = useState(business?.checkin_points ? String(business.checkin_points) : '');
  const [reviewPoints, setReviewPoints] = useState(business?.review_points !== null && business?.review_points !== undefined ? String(business.review_points) : '');
  const [radiusM, setRadiusM] = useState(business?.checkin_radius_m ? String(business.checkin_radius_m) : '');

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<ImageKind | null>(null);
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

  const pickImage = async (kind: ImageKind) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: kind === 'logo' ? [1, 1] : [16, 9],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploading(kind);
    try {
      const uri = result.assets[0].uri;
      setBusiness(await (kind === 'logo' ? portalService.updateLogo(uri) : portalService.updateCover(uri)));
    } catch (error) {
      alert.error(kind === 'logo' ? 'No se pudo actualizar el logo' : 'No se pudo actualizar la portada', errorMessage(error));
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    const input: OwnBusinessInput = {
      name: name.trim(),
      description: description.trim(),
      category: category ?? business.category,
      address: address.trim(),
      checkin_points: toNullableInt(checkinPoints),
      review_points: reviewPoints === '' ? null : Math.max(0, parseInt(reviewPoints, 10) || 0),
      checkin_radius_m: toNullableInt(radiusM),
      ...(!business.location_locked && coords
        ? { latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) }
        : {}),
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
          <AppText variant="h3">Imágenes</AppText>
          <AppText variant="caption" color="textSecondary" style={{ marginBottom: spacing.md }}>
            La portada es la imagen grande de tu página; el logo te identifica en listas y tarjetas.
          </AppText>

          <Pressable onPress={() => pickImage('cover')} style={styles.cover} accessibilityRole="button" accessibilityLabel="Cambiar portada">
            {business.cover ? (
              <Image source={{ uri: business.cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
            ) : (
              <View style={styles.coverEmpty}>
                <Ionicons name="image-outline" size={28} color={colors.primary} />
                <AppText variant="caption" color="primary">
                  Agregar portada (horizontal)
                </AppText>
              </View>
            )}
            <View style={styles.imageBadge}>
              {uploading === 'cover' ? <ActivityIndicator size="small" color={colors.onPrimary} /> : <Ionicons name="camera" size={16} color={colors.onPrimary} />}
            </View>
          </Pressable>

          <View style={styles.logoRow}>
            <Pressable onPress={() => pickImage('logo')} accessibilityRole="button" accessibilityLabel="Cambiar logo">
              <Avatar uri={business.logo} name={business.name} size={72} rounded="md" />
              <View style={[styles.imageBadge, styles.logoBadge]}>
                {uploading === 'logo' ? <ActivityIndicator size="small" color={colors.onPrimary} /> : <Ionicons name="camera" size={14} color={colors.onPrimary} />}
              </View>
            </Pressable>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">Logo</AppText>
              <AppText variant="caption" color="textSecondary">
                Imagen cuadrada. Toca para cambiarlo.
              </AppText>
            </View>
          </View>
        </Card>

        <Card>
          <AppText variant="h3" style={styles.title}>
            Información
          </AppText>
          <TextField label="Nombre comercial" value={name} onChangeText={setName} error={errors.name} />
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
        </Card>

        <Card>
          <AppText variant="h3" style={styles.title}>
            Ubicación
          </AppText>
          <LocationField
            value={coords}
            locked={business.location_locked}
            error={errors.latitude ?? errors.longitude}
            onChange={(picked) => {
              setCoords({ latitude: picked.latitude, longitude: picked.longitude });
              if (picked.address) setAddress(picked.address);
            }}
          />
          <View style={{ height: spacing.md }} />
          <TextField
            label="Dirección"
            icon="location-outline"
            value={address}
            onChangeText={setAddress}
            error={errors.address}
            hint="Se llena desde el mapa. Puedes corregirla o agregar una referencia."
          />
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
  cover: {
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
  },
  coverEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primaryLight,
  },
  imageBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.scrimStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  logoBadge: { right: -6, bottom: -6, width: 26, height: 26, borderRadius: 13 },
});
