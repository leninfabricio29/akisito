import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Switch, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { AppText, Button, Card, Chip, StackHeader, TextField } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { useBusiness } from '@/context/business-context';
import { useAlert } from '@/hooks/use-alert';
import { ApiError, errorMessage, portalService } from '@/services';
import type { RewardInput } from '@/services';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import { formatDate } from '@/utils/format';

type LimitOption = '1' | 'unlimited' | 'custom';

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 0);
  return d;
}

export default function RewardFormScreen() {
  const router = useRouter();
  const alert = useAlert();
  const { business } = useBusiness();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = Boolean(id);

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<string>();
  const [limit, setLimit] = useState<LimitOption>('1');
  const [customLimit, setCustomLimit] = useState('2');
  const [stock, setStock] = useState('');
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [redeemedCount, setRedeemedCount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    if (!id) return;
    portalService
      .reward(Number(id))
      .then((r) => {
        setTitle(r.title);
        setDescription(r.description);
        setPoints(String(r.points_required));
        setImage(r.image);
        setLimit(r.max_per_client === null ? 'unlimited' : r.max_per_client === 1 ? '1' : 'custom');
        if (r.max_per_client && r.max_per_client > 1) setCustomLimit(String(r.max_per_client));
        setStock(r.stock === null ? '' : String(r.stock));
        setEndsAt(r.ends_at ? new Date(r.ends_at) : null);
        setIsActive(r.is_active);
        setRedeemedCount(r.redeemed_count);
      })
      .catch((e) => alert.error('No se pudo cargar', errorMessage(e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setNewImage(result.assets[0].uri);
      setImage(result.assets[0].uri);
    }
  };

  const pickDate = () => {
    const value = endsAt ?? new Date(Date.now() + 30 * 86_400_000);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        minimumDate: new Date(),
        onChange: (event, date) => event.type === 'set' && date && setEndsAt(endOfDay(date)),
      });
    } else {
      setEndsAt(endsAt ?? endOfDay(value));
      setShowIosPicker(true);
    }
  };

  const pointsValue = Number(points);
  const perVisit = business?.effective_rules.checkin_points ?? 10;
  const visitsNeeded = pointsValue > 0 ? Math.ceil(pointsValue / perVisit) : 0;

  const save = async () => {
    const found: Record<string, string> = {};
    if (title.trim().length < 3) found.title = 'Escribe un título (mínimo 3 caracteres).';
    if (!Number.isInteger(pointsValue) || pointsValue < 1) found.points_required = 'Ingresa los puntos necesarios.';
    if (limit === 'custom' && !(Number(customLimit) >= 1)) found.max_per_client = 'Ingresa un número válido.';
    if (stock && !(Number(stock) >= 1)) found.stock = 'Deja vacío para ilimitado o ingresa un número.';
    setErrors(found);
    if (Object.keys(found).length) return;

    const input: RewardInput = {
      title: title.trim(),
      description: description.trim(),
      points_required: pointsValue,
      ends_at: endsAt ? endsAt.toISOString() : null,
      max_per_client: limit === 'unlimited' ? null : limit === '1' ? 1 : Number(customLimit),
      stock: stock ? Number(stock) : null,
      is_active: isActive,
    };

    setSaving(true);
    try {
      if (editing) await portalService.updateReward(Number(id), input, newImage);
      else await portalService.createReward(input, newImage);
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

  const remove = () =>
    alert.show({
      type: 'confirm',
      title: 'Eliminar recompensa',
      message: redeemedCount
        ? 'Como ya tiene canjes, la pausaremos para conservar el historial.'
        : 'Se eliminará definitivamente.',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: redeemedCount ? 'Pausar' : 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await portalService.deleteReward(Number(id));
              router.back();
            } catch (error) {
              alert.error('No se pudo eliminar', errorMessage(error));
            }
          },
        },
      ],
    });

  if (loading) {
    return (
      <View style={styles.root}>
        <StackHeader title="Recompensa" />
        <ActivityIndicator color={colors.primary} style={{ margin: spacing.xxl }} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StackHeader title={editing ? 'Editar recompensa' : 'Nueva recompensa'} subtitle={editing ? `${redeemedCount} canjes` : undefined} />
      <KeyboardAwareScrollView contentContainerStyle={styles.content} enableOnAndroid extraScrollHeight={24} keyboardShouldPersistTaps="handled">
        <Pressable onPress={pickImage} style={styles.image} accessibilityRole="button" accessibilityLabel="Elegir imagen">
          {image ? (
            <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={{ alignItems: 'center', gap: spacing.xs }}>
              <Ionicons name="image-outline" size={32} color={colors.primary} />
              <AppText variant="caption" color="primary">
                Agregar foto (opcional)
              </AppText>
            </View>
          )}
          {image && (
            <View style={styles.imageEdit}>
              <Ionicons name="camera" size={16} color={colors.primary} />
            </View>
          )}
        </Pressable>

        <Card>
          <TextField label="Título" placeholder="Café americano gratis" value={title} onChangeText={setTitle} error={errors.title} maxLength={120} />
          <TextField label="Descripción (opcional)" placeholder="Válido en tamaño mediano" value={description} onChangeText={setDescription} multiline style={{ minHeight: 44 }} />
          <TextField
            label="Puntos necesarios"
            icon="star-outline"
            placeholder="50"
            value={points}
            onChangeText={(v) => setPoints(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            error={errors.points_required}
            hint={visitsNeeded ? `≈ ${visitsNeeded} ${visitsNeeded === 1 ? 'visita' : 'visitas'} (das ${perVisit} pts por visita)` : undefined}
          />
        </Card>

        <Card>
          <AppText variant="title">Límites</AppText>
          <AppText variant="caption" color="textSecondary" style={styles.label}>
            Canjes por cliente
          </AppText>
          <View style={styles.chips}>
            <Chip label="1 vez" selected={limit === '1'} onPress={() => setLimit('1')} />
            <Chip label="Varias veces" selected={limit === 'custom'} onPress={() => setLimit('custom')} />
            <Chip label="Sin límite" selected={limit === 'unlimited'} onPress={() => setLimit('unlimited')} />
          </View>
          {limit === 'custom' && (
            <TextField label="Máximo por cliente" value={customLimit} onChangeText={(v) => setCustomLimit(v.replace(/\D/g, ''))} keyboardType="number-pad" error={errors.max_per_client} />
          )}
          <TextField
            label="Stock total (opcional)"
            icon="cube-outline"
            placeholder="Ilimitado"
            value={stock}
            onChangeText={(v) => setStock(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            error={errors.stock}
            hint={redeemedCount ? `Ya hay ${redeemedCount} canjes reservados.` : undefined}
          />

          <AppText variant="caption" color="textSecondary" style={styles.label}>
            Disponible hasta
          </AppText>
          <View style={styles.dateRow}>
            <Pressable onPress={pickDate} style={styles.date} accessibilityRole="button">
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <AppText color={endsAt ? 'text' : 'textMuted'}>{endsAt ? formatDate(endsAt.toISOString()) : 'Sin fecha de fin'}</AppText>
            </Pressable>
            {endsAt && (
              <Button title="Quitar" variant="ghost" size="sm" onPress={() => { setEndsAt(null); setShowIosPicker(false); }} />
            )}
          </View>
          {errors.ends_at && (
            <AppText variant="caption" color="danger">
              {errors.ends_at}
            </AppText>
          )}
          {Platform.OS === 'ios' && showIosPicker && endsAt && (
            <DateTimePicker value={endsAt} mode="date" display="inline" minimumDate={new Date()} onChange={(_, d) => d && setEndsAt(endOfDay(d))} />
          )}
        </Card>

        <Card style={styles.activeRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="title">Visible para clientes</AppText>
            <AppText variant="caption" color="textSecondary">
              {isActive ? 'Aparece en Premios y avisamos a tus clientes.' : 'Pausada: nadie puede canjearla.'}
            </AppText>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: colors.primaryLight, false: colors.border }} thumbColor={isActive ? colors.primary : colors.surface} />
        </Card>

        <Button title={editing ? 'Guardar cambios' : 'Crear recompensa'} size="lg" fullWidth loading={saving} onPress={save} />
        {editing && <Button title="Eliminar" variant="danger" icon="trash-outline" fullWidth onPress={remove} />}
      </KeyboardAwareScrollView>
      <Alert visible={alert.visibleConfig} config={alert.config} onDismiss={alert.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: SCREEN_PADDING, gap: spacing.md, paddingBottom: spacing.xxxl },
  image: {
    height: 170,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageEdit: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { marginTop: spacing.md, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
