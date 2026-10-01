import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, StackHeader } from '@/components/ui';
import { getApproximateLocation } from '@/hooks/use-current-location';
import { colors, radius, shadows, spacing, typography } from '@/theme';

export type Coords = { latitude: number; longitude: number };
export type PickedLocation = Coords & { address: string };

// Plaza Grande, Quito: punto de partida si no hay ubicación guardada ni permiso.
const FALLBACK: Coords = { latitude: -0.2201, longitude: -78.5123 };
const DELTA = { latitudeDelta: 0.004, longitudeDelta: 0.004 };
const PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;

/** "Av. Amazonas N24, La Mariscal, Quito" a partir de la geocodificación inversa del dispositivo. */
function formatAddress(place: Location.LocationGeocodedAddress | undefined): string {
  if (!place) return '';
  const street = place.street ? [place.street, place.streetNumber].filter(Boolean).join(' ') : place.name;
  const parts = [street, place.district, place.city ?? place.subregion].filter((p): p is string => Boolean(p));
  return [...new Set(parts)].join(', ');
}

async function addressFor(coords: Coords): Promise<string> {
  try {
    return formatAddress((await Location.reverseGeocodeAsync(coords))[0]);
  } catch {
    return '';
  }
}

type FieldProps = {
  value: Coords | null;
  onChange: (location: PickedLocation) => void;
  /** Negocio aprobado: solo se muestra la ubicación, sin poder cambiarla. */
  locked?: boolean;
  error?: string;
};

/** Vista previa de la ubicación del local y acceso al selector en mapa. */
export function LocationField({ value, onChange, locked, error }: FieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => !locked && setOpen(true)}
        disabled={locked}
        accessibilityRole="button"
        accessibilityLabel={value ? 'Cambiar ubicación en el mapa' : 'Elegir ubicación en el mapa'}
        style={[styles.preview, error && styles.previewError]}
      >
        {value ? (
          <MapView
            key={`${value.latitude},${value.longitude}`}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER}
            initialRegion={{ ...value, ...DELTA }}
            liteMode
            pointerEvents="none"
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}
          >
            <Marker coordinate={value} pinColor={colors.primary} />
          </MapView>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={32} color={colors.primary} />
            <AppText variant="bodyStrong" color="primary">
              Elegir en el mapa
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
              Mueve el mapa hasta que el pin quede sobre la entrada de tu local.
            </AppText>
          </View>
        )}
      </Pressable>

      {error ? (
        <AppText variant="caption" color="danger" style={styles.note}>
          {error}
        </AppText>
      ) : locked ? (
        <View style={styles.lockedNote}>
          <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
          <AppText variant="caption" color="textSecondary" style={{ flex: 1 }}>
            La ubicación quedó fija al aprobarse tu negocio. Para cambiarla, contacta a soporte.
          </AppText>
        </View>
      ) : (
        value && (
          <Button title="Cambiar ubicación" icon="map-outline" variant="ghost" size="sm" onPress={() => setOpen(true)} style={styles.change} />
        )
      )}

      <LocationPickerModal
        visible={open}
        initial={value}
        onClose={() => setOpen(false)}
        onConfirm={(picked) => {
          setOpen(false);
          onChange(picked);
        }}
      />
    </View>
  );
}

type ModalProps = {
  visible: boolean;
  initial: Coords | null;
  onClose: () => void;
  onConfirm: (location: PickedLocation) => void;
};

/** Mapa a pantalla completa con un pin fijo al centro: el negocio mueve el mapa, no el pin. */
function LocationPickerModal({ visible, initial, onClose, onConfirm }: ModalProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [center, setCenter] = useState<Coords | null>(null);
  const [address, setAddress] = useState('');
  const [resolving, setResolving] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const lookup = useRef(0);

  // Al abrir: centra en la ubicación guardada o, si no hay, en la zona aproximada del teléfono.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setQuery('');
    setNotFound(false);
    (async () => {
      const start = initial ?? (await getApproximateLocation()) ?? FALLBACK;
      if (cancelled) return;
      setRegion({ ...start, ...DELTA });
      void resolve(start);
    })();
    return () => {
      cancelled = true;
      setRegion(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const resolve = async (coords: Coords) => {
    const id = ++lookup.current;
    setCenter(coords);
    setResolving(true);
    const text = await addressFor(coords);
    if (id !== lookup.current) return; // llegó una búsqueda más reciente
    setAddress(text);
    setResolving(false);
  };

  const search = async () => {
    const text = query.trim();
    if (!text) return;
    setSearching(true);
    setNotFound(false);
    try {
      const [match] = await Location.geocodeAsync(text);
      if (!match) {
        setNotFound(true);
        return;
      }
      const coords = { latitude: match.latitude, longitude: match.longitude };
      mapRef.current?.animateToRegion({ ...coords, ...DELTA }, 400);
      void resolve(coords);
    } catch {
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <StackHeader title="Ubicación del local" subtitle="Mueve el mapa para ubicar el pin" onBack={onClose} />

        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={search}
              placeholder="Buscar dirección o lugar"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searching && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
          {notFound && (
            <AppText variant="caption" color="danger" style={{ marginTop: spacing.xs }}>
              No encontramos esa dirección. Prueba con calle y ciudad, o mueve el mapa.
            </AppText>
          )}
        </View>

        <View style={{ flex: 1 }}>
          {region ? (
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              provider={PROVIDER}
              initialRegion={region}
              showsUserLocation
              showsMyLocationButton={false}
              toolbarEnabled={false}
              onRegionChangeComplete={(r) => void resolve({ latitude: r.latitude, longitude: r.longitude })}
            />
          ) : (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxxl }} />
          )}
          {/* Pin fijo: su punta marca el centro del mapa. */}
          <View pointerEvents="none" style={styles.centerPin}>
            <Ionicons name="location" size={44} color={colors.primary} />
          </View>
        </View>

        <View style={[styles.panel, shadows.lg, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.addressRow}>
            <View style={styles.addressIcon}>
              <Ionicons name="storefront" size={20} color={colors.onPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color="textMuted">
                Dirección aproximada
              </AppText>
              {resolving ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start' }} />
              ) : (
                <AppText variant="bodyStrong" numberOfLines={2}>
                  {address || 'Sin dirección: podrás escribirla después'}
                </AppText>
              )}
            </View>
          </View>
          <Button
            title="Confirmar ubicación"
            icon="checkmark"
            size="lg"
            fullWidth
            disabled={!center || resolving}
            onPress={() => center && onConfirm({ ...center, address })}
          />
        </View>
      </View>
    </Modal>
  );
}

const PIN = 44;

const styles = StyleSheet.create({
  preview: {
    height: 160,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.primarySoft,
  },
  previewError: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.lg },
  note: { marginTop: spacing.xs, marginLeft: spacing.xxs },
  lockedNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  change: { alignSelf: 'flex-start', marginTop: spacing.xs },
  root: { flex: 1, backgroundColor: colors.background },
  searchRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm + 2, color: colors.text, fontSize: typography.body.fontSize },
  centerPin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -PIN / 2,
    marginTop: -PIN,
  },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
