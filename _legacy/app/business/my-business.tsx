import { HeaderBusinessComponent } from '@/components/business/header';
import {
  createPlaceWithFormDataRequest,
  getMyPlacesRequest,
  getPlaceCategoriesRequest,
  PlaceCategory,
  PlaceItem,
  updatePlaceRequest,
  updatePlaceWithFormDataRequest
} from '@/services/place-service';
import { buildPlaceFormData } from '@/services/utils/file-utils';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '../../context/auth-context';

// ── Palette ──────────────────────────────────────────────
const C = {
  brand: '#b82a5e',
  brandLight: '#d4547e',
  brandDark: '#8a1f46',
  brandFaint: 'rgba(184,42,94,0.07)',
  brandBorder: 'rgba(184,42,94,0.22)',
  borderLight: 'rgba(184,42,94,0.12)',
  bg: '#ffffff',
  surfaceGray: '#f7f2f5',
  surfaceBorder: '#ede5ea',
  white: '#ffffff',
  muted: '#9b8492',
  mutedLight: '#c5b5be',
  text: '#1a0f15',
  textSub: '#6b5560',
  gold: '#f5a623',
  goldFaint: 'rgba(245,166,35,0.08)',
  goldBorder: 'rgba(245,166,35,0.28)',
  green: '#2da06e',
  greenFaint: 'rgba(45,160,110,0.08)',
  greenBorder: 'rgba(45,160,110,0.25)',
  error: '#e53e3e',
};

type Photo = { id: string; uri: string; isPrimary: boolean };

// ── Reusable field ────────────────────────────────────────
function Field({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  editable,
  multiline,
  maxLength,
  keyboardType,
  hint,
  rightElement,
}: {
  icon: string;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  editable?: boolean;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: any;
  hint?: string;
  rightElement?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={f.container}>
      <View style={f.labelRow}>
        <Text style={f.label}>{label}</Text>
        {maxLength && (
          <Text style={f.counter}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
      <View
        style={[
          f.wrap,
          focused && f.wrapFocused,
          multiline && f.wrapMulti,
        ]}
      >
        <View style={[f.iconWrap, multiline && f.iconWrapTop, focused && f.iconFocused]}>
          <Ionicons
            name={icon as any}
            size={16}
            color={focused ? C.brand : C.mutedLight}
          />
        </View>
        <TextInput
          style={[f.input, multiline && f.inputMulti]}
          placeholder={placeholder}
          placeholderTextColor={C.mutedLight}
          value={value}
          onChangeText={onChangeText}
          editable={editable ?? true}
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType ?? 'default'}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="sentences"
        />
        {rightElement && <View style={f.rightSlot}>{rightElement}</View>}
      </View>
      {hint && (
        <View style={f.hintRow}>
          <Ionicons name="information-circle-outline" size={11} color={C.mutedLight} />
          <Text style={f.hint}>{hint}</Text>
        </View>
      )}
    </View>
  );
}

const f = StyleSheet.create({
  container:    { marginBottom: 18 },
  labelRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label:        { color: C.text, fontSize: 13, fontWeight: '700' },
  counter:      { color: C.mutedLight, fontSize: 11 },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.borderLight,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    minHeight: 54,
  },
  wrapFocused:  { borderColor: C.brand, shadowOpacity: 0.1 },
  wrapMulti:    { alignItems: 'flex-start', minHeight: 110 },
  iconWrap: {
    width: 48,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: C.borderLight,
    marginRight: 12,
  },
  iconWrapTop:  { justifyContent: 'flex-start', paddingTop: 16 },
  iconFocused:  { borderRightColor: C.brandBorder },
  input:        { flex: 1, color: C.text, fontSize: 15, paddingRight: 14 },
  inputMulti:   { paddingTop: 14, paddingBottom: 14, minHeight: 90 },
  rightSlot:    { paddingRight: 14 },
  hintRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  hint:         { color: C.mutedLight, fontSize: 11 },
});

// ── Section wrapper ───────────────────────────────────────
function Section({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={sec.wrap}>
      <View style={sec.header}>
        <View style={sec.num}>
          <Text style={sec.numText}>{number}</Text>
        </View>
        <View>
          <Text style={sec.title}>{title}</Text>
          {subtitle && <Text style={sec.sub}>{subtitle}</Text>}
        </View>
      </View>
      {children}
    </View>
  );
}

const sec = StyleSheet.create({
  wrap:   { marginBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  num: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.brandFaint,
    borderWidth: 1, borderColor: C.brandBorder,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  numText: { color: C.brand, fontSize: 12, fontWeight: '800' },
  title:   { color: C.text, fontSize: 16, fontWeight: '800' },
  sub:     { color: C.muted, fontSize: 12, marginTop: 2 },
});

// ── Photo slot ────────────────────────────────────────────
function PhotoSlot({
  photo,
  index,
  onSetPrimary,
  onRemove,
  onAdd,
  isEmpty,
  disabled,
}: {
  photo?: Photo;
  index: number;
  onSetPrimary: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  isEmpty: boolean;
  disabled?: boolean;
}) {
  if (isEmpty) {
    return (
      <TouchableOpacity
        style={[ph.slot, ph.slotEmpty, disabled && ph.slotDisabled]}
        onPress={disabled ? undefined : onAdd}
        activeOpacity={disabled ? 1 : 0.75}
      >
        <Ionicons
          name="add"
          size={26}
          color={disabled ? C.mutedLight : C.brand}
        />
        <Text style={[ph.addText, disabled && ph.addTextDisabled]}>
          {disabled ? 'Máx. 4 fotos' : 'Añadir foto'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={ph.slot}>
      <Image source={{ uri: photo!.uri }} style={ph.image} contentFit="cover" />

      {/* Primary crown */}
      {photo!.isPrimary && (
        <View style={ph.primaryBadge}>
          <Ionicons name="star" size={10} color={C.gold} />
          <Text style={ph.primaryText}>Principal</Text>
        </View>
      )}

      {/* Actions overlay */}
      <View style={ph.overlay}>
        {/* Set as primary */}
        {!photo!.isPrimary && (
          <TouchableOpacity
            style={ph.actionBtn}
            onPress={() => onSetPrimary(photo!.id)}
          >
            <Ionicons name="star-outline" size={14} color={C.white} />
          </TouchableOpacity>
        )}
        {/* Remove */}
        <TouchableOpacity
          style={[ph.actionBtn, ph.actionBtnDanger]}
          onPress={() => onRemove(photo!.id)}
        >
          <Ionicons name="trash-outline" size={14} color={C.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ph = StyleSheet.create({
  slot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  slotEmpty: {
    backgroundColor: C.brandFaint,
    borderWidth: 2,
    borderColor: C.brandBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  slotDisabled: {
    backgroundColor: C.surfaceGray,
    borderColor: C.surfaceBorder,
  },
  image: { width: '100%', height: '100%' },
  addText:         { color: C.brand,      fontSize: 11, fontWeight: '700' },
  addTextDisabled: { color: C.mutedLight, fontSize: 11, fontWeight: '600' },
  primaryBadge: {
    position: 'absolute', top: 6, left: 6,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
  },
  primaryText: { color: C.gold, fontSize: 10, fontWeight: '700' },
  overlay: {
    position: 'absolute', bottom: 6, right: 6,
    flexDirection: 'row', gap: 5,
  },
  actionBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnDanger: { backgroundColor: 'rgba(229,62,62,0.75)' },
});

// ── Category chips ────────────────────────────────────────
const CATEGORIES = ['Restaurante', 'Café', 'Hotel', 'Tour', 'Tienda', 'Spa', 'Bar', 'Otro'];

const DEFAULT_LOCATION: [number, number] = [-79.20422, -3.99313];
const WIZARD_STEPS = ['Negocio', 'Contenido', 'Ubicación', 'Confirmar'];

const toMapRegion = (coordinates: [number, number]) => ({
  latitude: coordinates[1],
  longitude: coordinates[0],
  latitudeDelta: 0.008,
  longitudeDelta: 0.008,
});

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const getSelectableCategories = (serverCategories: PlaceCategory[]): string[] => {
  if (serverCategories.length > 0) {
    return serverCategories.map((item) => item.name);
  }
  return CATEGORIES;
};

const toCategoryName = (category: PlaceItem['category_id']): string => {
  if (typeof category === 'string') {
    return '';
  }
  return category.name;
};

const splitAddress = (rawAddress: string): { address: string; city: string } => {
  const parts = rawAddress
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return {
      address: rawAddress,
      city: 'Loja',
    };
  }

  const city = parts[parts.length - 1];
  const address = parts.slice(0, -1).join(', ');

  return { address, city };
};

// ── Main Screen ───────────────────────────────────────────
export default function MyBusinessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ setup?: string }>();
  const { session, authToken } = useAuth();
  const isSetupMode = params.setup === '1';

  // Form state
  const [name,        setName]        = useState('');
  const [category,    setCategory]    = useState('');
  const [description, setDescription] = useState('');
  const [phone,       setPhone]       = useState('');
  const [address,     setAddress]     = useState('');
  const [city,        setCity]        = useState('Loja');
  const [photos,      setPhotos]      = useState<Photo[]>([]);
  const [categories,  setCategories]  = useState<PlaceCategory[]>([]);
  const [isSaving,    setIsSaving]    = useState(false);
  const [isLoadingPlace, setIsLoadingPlace] = useState(false);
  const [allPlaces,   setAllPlaces]   = useState<PlaceItem[]>([]);
  const [existingPlaceId, setExistingPlaceId] = useState<string | null>(null);
  const [existingCategoryId, setExistingCategoryId] = useState<string | null>(null);
  const [placeCoordinates, setPlaceCoordinates] = useState<[number, number]>(DEFAULT_LOCATION);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState(toMapRegion(DEFAULT_LOCATION));
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [hasPickedLocation, setHasPickedLocation] = useState(false);
  const [creatingNewPlace, setCreatingNewPlace] = useState(false);
  const categoryOptions = useMemo(() => getSelectableCategories(categories), [categories]);
  const isEditMode = Boolean(existingPlaceId);
  const showListView = !isSetupMode && allPlaces.length > 0 && !creatingNewPlace && !isEditMode;

  const lockedFields = useMemo(
    () => ({
      name: Boolean(isSetupMode && !isEditMode && session?.businessName),
      category: Boolean(isSetupMode && !isEditMode && session?.businessCategory),
      phone: Boolean(isSetupMode && !isEditMode && session?.phone),
    }),
    [isEditMode, isSetupMode, session?.businessCategory, session?.businessName, session?.phone],
  );

  useEffect(() => {
    if (!isSetupMode || !session || isEditMode) {
      return;
    }

    if (session.businessName) {
      setName(session.businessName);
    }

    if (session.businessCategory) {
      setCategory(session.businessCategory);
    }

    if (session.phone) {
      setPhone(session.phone);
    }
  }, [isEditMode, isSetupMode, session]);

  useEffect(() => {
    const loadCategories = async () => {
      if (!authToken) {
        return;
      }

      try {
        const result = await getPlaceCategoriesRequest(authToken);
        setCategories(result);
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, [authToken]);

  useEffect(() => {
    if (!existingCategoryId || category) {
      return;
    }

    const matched = categories.find((item) => item._id === existingCategoryId);
    if (matched) {
      setCategory(matched.name);
    }
  }, [categories, category, existingCategoryId]);

  useEffect(() => {
    const loadMyPlace = async () => {
      if (!authToken) {
        return;
      }

      setIsLoadingPlace(true);
      try {
        const places = await getMyPlacesRequest(authToken);
        setAllPlaces(places);

        if (!places.length) {
          return;
        }

        // Cargar el primer lugar en el formulario si existe
        const place = places[0];
        setExistingPlaceId(place._id);
        setName(place.name || '');
        setDescription(place.description || '');

        const categoryName = toCategoryName(place.category_id);
        if (categoryName) {
          setCategory(categoryName);
        } else if (typeof place.category_id === 'string') {
          setExistingCategoryId(place.category_id);
        }

        const parsedAddress = splitAddress(place.address || '');
        setAddress(parsedAddress.address);
        setCity(parsedAddress.city);
        setPhone(place.phone || session?.phone || '');

        if (place.location?.coordinates?.length === 2) {
          setPlaceCoordinates(place.location.coordinates);
          setMapRegion(toMapRegion(place.location.coordinates));
          setHasPickedLocation(true);
        }

        setPhotos(
          (place.images || []).slice(0, 4).map((uri, index) => ({
            id: `${place._id}-${index}`,
            uri,
            isPrimary: index === 0,
          })),
        );
      } catch {
        // Si falla, mantenemos el flujo de creacion sin bloquear la pantalla.
      } finally {
        setIsLoadingPlace(false);
      }
    };

    loadMyPlace();
  }, [authToken, session?.phone]);

  // Photo handlers
  const handleAddPhoto = async () => {
    if (photos.length >= 4) {
      Alert.alert('Límite alcanzado', 'Solo puedes subir un máximo de 4 fotos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });

      if (!result.canceled && result.assets?.[0]) {
        const uri = result.assets[0].uri;

        const newId = String(Date.now());
        setPhotos((prev) => [
          ...prev,
          { id: newId, uri, isPrimary: prev.length === 0 },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'No pudimos acceder a tu galería. Intenta nuevamente.');
      console.error('ImagePicker error:', error);
    }
  };

  /**
   * Convierte una URI local a Data URL base64 para enviarla en JSON
   * Esto permite enviar imágenes en el payload sin necesidad de FormData
   */
  const imageUriToBase64 = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Error converting image to base64, using original URI:', error);
      return uri;
    }
  };

  const handleSetPrimary = (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => ({ ...p, isPrimary: p.id === id }))
    );
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      // If removed was primary, promote first remaining
      if (prev.find((p) => p.id === id)?.isPrimary && next.length > 0) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  };

  const resolveAddressFromCoordinates = async (coordinates: [number, number]) => {
    setIsResolvingAddress(true);
    try {
      const [lng, lat] = coordinates;
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const geo = result[0];

      if (geo) {
        const streetParts = [geo.streetNumber, geo.street, geo.district].filter(Boolean);
        const formattedAddress = streetParts.join(' ').trim();
        setAddress(formattedAddress || 'Ubicación seleccionada en mapa');
        setCity(geo.city || geo.subregion || geo.region || 'Loja');
      } else {
        setAddress('Ubicación seleccionada en mapa');
      }
    } catch {
      setAddress((prev) => prev.trim() || 'Ubicación seleccionada en mapa');
    } finally {
      setIsResolvingAddress(false);
    }
  };

  const handleOpenMapPicker = async () => {
    setIsMapModalVisible(true);

    if (hasPickedLocation) {
      setMapRegion(toMapRegion(placeCoordinates));
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setMapRegion({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      });
      setPlaceCoordinates([position.coords.longitude, position.coords.latitude]);
      setHasPickedLocation(true);
    } catch {
      // Si falla, mantenemos la ubicación por defecto.
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPlaceCoordinates([longitude, latitude]);
    setHasPickedLocation(true);
    setMapRegion({
      latitude,
      longitude,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    });
  };

  const handleConfirmMapLocation = async () => {
    if (!hasPickedLocation) {
      Alert.alert('Ubicación requerida', 'Selecciona un punto en el mapa para continuar.');
      return;
    }

    await resolveAddressFromCoordinates(placeCoordinates);
    setIsMapModalVisible(false);
  };

  const validateStep = (step: number) => {
    if (step === 0) {
      if (!name.trim()) {
        Alert.alert('Nombre requerido', 'Ingresa el nombre de tu negocio.');
        return false;
      }
      if (!category.trim()) {
        Alert.alert('Categoría requerida', 'Selecciona una categoría para tu negocio.');
        return false;
      }
    }

    if (step === 1) {
      if (!description.trim()) {
        Alert.alert('Descripción requerida', 'Agrega una descripción de tu negocio.');
        return false;
      }
      if (photos.length === 0) {
        Alert.alert('Foto requerida', 'Añade al menos una foto de tu negocio.');
        return false;
      }
      if (photos.length > 4) {
        Alert.alert('Límite de imágenes', 'Solo puedes subir un máximo de 4 imágenes.');
        return false;
      }
    }

    if (step === 2) {
      if (!hasPickedLocation) {
        Alert.alert('Ubicación requerida', 'Selecciona tu ubicación en el mapa para continuar.');
        return false;
      }

      if (!address.trim()) {
        Alert.alert('Confirmar ubicación', 'Confirma la ubicación en el mapa para generar la dirección.');
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Save
  const handleSave = async () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      return;
    }

    if (!authToken) {
      Alert.alert('Sesión inválida', 'Inicia sesión nuevamente para continuar.');
      return;
    }

    const matchedCategory = categories.find((item) => normalize(item.name) === normalize(category));
    if (!matchedCategory) {
      Alert.alert('Categoría inválida', 'No pudimos mapear la categoría del negocio. Selecciona una categoría válida.');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim(),
        category_id: matchedCategory._id,
        address: `${address.trim()}${city.trim() ? `, ${city.trim()}` : ''}`,
        phone: phone.trim() || undefined,
        location: {
          type: 'Point' as const,
          coordinates: placeCoordinates,
        },
      };

      if (isEditMode && existingPlaceId) {
        // Actualizar con FormData si hay nuevas imágenes
        const imageUris = photos.map((photo) => photo.uri);
        if (imageUris.length > 0) {
          const formData = buildPlaceFormData(data, imageUris);
          await updatePlaceWithFormDataRequest(authToken, existingPlaceId, formData);
        } else {
          // Si no hay imágenes nuevas, usar el método normal
          await updatePlaceRequest(authToken, existingPlaceId, data as any);
        }
        // Refrescar lista
        const updatedPlaces = await getMyPlacesRequest(authToken);
        setAllPlaces(updatedPlaces);
        Alert.alert('¡Actualizado!', 'Tu lugar fue actualizado correctamente.', [
          {
            text: 'Continuar',
            onPress: () => router.replace('/(tabs)'),
          },
        ]);
      } else {
        // Crear con FormData siempre que hay imágenes
        const imageUris = photos.map((photo) => photo.uri);
        if (imageUris.length === 0) {
          Alert.alert('Error', 'Debes agregar al menos una imagen para el lugar.');
          setIsSaving(false);
          return;
        }
        const formData = buildPlaceFormData(data, imageUris);
        await createPlaceWithFormDataRequest(authToken, formData);
        // Refrescar lista
        const updatedPlaces = await getMyPlacesRequest(authToken);
        setAllPlaces(updatedPlaces);
        
        // Diferente flujo para setup vs crear nuevo lugar
        if (isSetupMode) {
          Alert.alert('¡Éxito!', 'Tu primer lugar ha sido registrado correctamente.', [
            {
              text: 'Ir a Dashboard',
              onPress: () => router.replace('/(tabs)'),
            },
          ]);
        } else {
          Alert.alert('¡Lugar creado!', 'Tu lugar fue registrado correctamente.', [
            {
              text: 'Crear otro',
              onPress: () => {
                // Reset form para crear otro lugar
                setName('');
                setCategory('');
                setDescription('');
                setAddress('');
                setCity('Loja');
                setPhotos([]);
                setCurrentStep(0);
                setExistingPlaceId(null);
                setHasPickedLocation(false);
                setPlaceCoordinates(DEFAULT_LOCATION);
              },
            },
            {
              text: 'Ver todos mis lugares',
              onPress: () => {
                setCreatingNewPlace(false);
              },
            },
          ]);
        }
      }
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Slots: always show 4 (filled + empty)
  const slots = [0, 1, 2].map((i) => photos[i] ?? null);

  const handleEditPlace = (place: PlaceItem) => {
    setExistingPlaceId(place._id);
    setName(place.name || '');
    setDescription(place.description || '');

    const categoryName = toCategoryName(place.category_id);
    if (categoryName) {
      setCategory(categoryName);
    } else if (typeof place.category_id === 'string') {
      setExistingCategoryId(place.category_id);
    }

    const parsedAddress = splitAddress(place.address || '');
    setAddress(parsedAddress.address);
    setCity(parsedAddress.city);
    setPhone(place.phone || '');

    if (place.location?.coordinates?.length === 2) {
      setPlaceCoordinates(place.location.coordinates);
      setMapRegion(toMapRegion(place.location.coordinates));
      setHasPickedLocation(true);
    }

    setPhotos(
      (place.images || []).slice(0, 4).map((uri, index) => ({
        id: `${place._id}-${index}`,
        uri,
        isPrimary: index === 0,
      })),
    );

    setCurrentStep(0);
    setCreatingNewPlace(false);
  };

  const handleCreateNewPlace = () => {
    setName('');
    setCategory('');
    setDescription('');
    setAddress('');
    setCity('Loja');
    setPhotos([]);
    setCurrentStep(0);
    setExistingPlaceId(null);
    setExistingCategoryId(null);
    setHasPickedLocation(false);
    setPlaceCoordinates(DEFAULT_LOCATION);
    setMapRegion(toMapRegion(DEFAULT_LOCATION));
    setCreatingNewPlace(true);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />

      {isLoadingPlace ? (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color={C.brand} />
          <Text style={s.loadingText}>Cargando datos de tu negocio...</Text>
        </View>
      ) : null}

      <HeaderBusinessComponent title="Mi negocio" 
      subtitle={isEditMode ? 'Edita la información de tu lugar' : isSetupMode ? 'Completa el registro de tu primer lugar' : 'Administra la información de tu negocio'} 
      backButtonProps={{ onPress: () => router.back() }}
       />

      {/* ── ListView o Form ── */}
      {showListView ? (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.listHeader}>
            <Text style={s.listHeaderTitle}>Tus Lugares</Text>
            <Text style={s.listHeaderSub}>Tienes {allPlaces.length} lugar{allPlaces.length !== 1 ? 'es' : ''} registrado{allPlaces.length !== 1 ? 's' : ''}</Text>
          </View>

          <View style={s.placesList}>
            {allPlaces.map((place) => (
              <TouchableOpacity
                key={place._id}
                style={s.placeCard}
                onPress={() => handleEditPlace(place)}
                activeOpacity={0.8}
              >
                {place.images && place.images.length > 0 && (
                  <Image
                    source={{ uri: place.images[0] }}
                    style={s.placeCardImage}
                    contentFit="cover"
                  />
                )}
                <View style={s.placeCardContent}>
                  <Text style={s.placeCardName}>{place.name}</Text>
                  <Text style={s.placeCardAddress}>{place.address}</Text>
                  <View style={s.placeCardFooter}>
                    <View style={s.placeCardBadge}>
                      <Ionicons name="storefront" size={12} color={C.brand} />
                      <Text style={s.placeCardBadgeText}>{toCategoryName(place.category_id)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={C.mutedLight} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={s.createNewBtn}
            onPress={handleCreateNewPlace}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[C.brand, C.brandDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.createNewGradient}
            >
              <Ionicons name="add-circle" size={20} color={C.white} />
              <Text style={s.createNewText}>Crear Nuevo Lugar</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      ) : (
        /* ── Form ── */
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={s.wizardHeader}>
          <Text style={s.wizardTitle}>Paso {currentStep + 1} de {WIZARD_STEPS.length}</Text>
          <Text style={s.wizardSubtitle}>{WIZARD_STEPS[currentStep]}</Text>
          <View style={s.progressTrack}>
            <View
              style={[
                s.progressFill,
                { width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        {currentStep === 0 ? (
          <Section number="1" title="Información básica" subtitle="Nombre, categoría y contacto">

            <Field
              icon="storefront-outline"
              label="Nombre del negocio"
              placeholder="Ej. Restaurante El Fogón"
              value={name}
              onChangeText={lockedFields.name ? () => undefined : setName}
              editable={!lockedFields.name}
              maxLength={60}
              hint={lockedFields.name ? 'Precargado desde el registro del negocio' : 'Este nombre aparecerá en el mapa y en búsquedas'}
            />

            <View style={s.catSection}>
              <Text style={s.catLabel}>Categoría</Text>
              <View style={s.catGrid}>
                {categoryOptions.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[s.catChip, category === cat && s.catChipActive]}
                    onPress={() => {
                      if (!lockedFields.category) {
                        setCategory(cat);
                      }
                    }}
                  >
                    <Text style={[s.catChipText, category === cat && s.catChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          <Field
            icon="call-outline"
            label="Teléfono"
            placeholder="+593 99 999 9999"
            value={phone}
            onChangeText={lockedFields.phone ? () => undefined : setPhone}
            editable={!lockedFields.phone}
            keyboardType="phone-pad"
            hint={lockedFields.phone ? 'Precargado desde el registro del negocio' : 'Opcional'}
          />
          </Section>
        ) : null}

        {currentStep === 1 ? (
          <>
            <Section number="2" title="Descripción" subtitle="Cuéntales a los visitantes sobre tu negocio">
              <Field
                icon="document-text-outline"
                label="Descripción"
                placeholder="Describe tu negocio, qué ofreces, qué te hace especial..."
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={300}
              />
            </Section>

            <Section
              number="3"
              title="Fotos"
              subtitle="Máximo 4 fotos · toca ★ para elegir la principal"
            >
              <View style={s.photosRow}>
                {slots.map((photo, i) => (
                  <PhotoSlot
                    key={photo ? photo.id : `empty-${i}`}
                    photo={photo ?? undefined}
                    index={i}
                    isEmpty={!photo}
                    disabled={!photo && photos.length >= 4}
                    onAdd={handleAddPhoto}
                    onSetPrimary={handleSetPrimary}
                    onRemove={handleRemovePhoto}
                  />
                ))}
              </View>

              <View style={s.photoHint}>
                <Ionicons name="information-circle-outline" size={13} color={C.mutedLight} />
                <Text style={s.photoHintText}>
                  La foto marcada con ★ aparecerá como portada en el mapa y en búsquedas.
                </Text>
              </View>
            </Section>
          </>
        ) : null}

        {currentStep === 2 ? (
          <Section number="4" title="Ubicación" subtitle="Marca la ubicación exacta en el mapa">
            <TouchableOpacity style={s.mapBtn} activeOpacity={0.82} onPress={handleOpenMapPicker}>
              <LinearGradient
                colors={[C.brandFaint, 'rgba(184,42,94,0.04)']}
                style={s.mapBtnGradient}
              >
                <View style={s.mapBtnIcon}>
                  <Ionicons name="map" size={18} color={C.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.mapBtnTitle}>{hasPickedLocation ? 'Cambiar ubicación en mapa' : 'Marcar en el mapa'}</Text>
                  <Text style={s.mapBtnSub}>Toca el mapa para dejar el pin de tu negocio.</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.brand} />
              </LinearGradient>
            </TouchableOpacity>

            <View style={s.locationSummary}>
              <View style={s.locationSummaryRow}>
                <Ionicons name="location" size={14} color={C.brand} />
                <Text style={s.locationSummaryText}>
                  {address.trim() ? `${address}${city.trim() ? `, ${city}` : ''}` : 'Aún no has confirmado una ubicación'}
                </Text>
              </View>
              <Text style={s.locationCoordinates}>
                {hasPickedLocation ? `Lng ${placeCoordinates[0].toFixed(6)} · Lat ${placeCoordinates[1].toFixed(6)}` : 'Selecciona un punto para ver coordenadas'}
              </Text>
            </View>
          </Section>
        ) : null}

        {currentStep === 3 ? (
          <Section number="5" title="Confirmación" subtitle="Revisa antes de guardar">
            <View style={s.reviewCard}>
              <Text style={s.reviewRow}><Text style={s.reviewLabel}>Negocio:</Text> {name}</Text>
              <Text style={s.reviewRow}><Text style={s.reviewLabel}>Categoría:</Text> {category}</Text>
              <Text style={s.reviewRow}><Text style={s.reviewLabel}>Dirección:</Text> {`${address}${city.trim() ? `, ${city}` : ''}`}</Text>
              <Text style={s.reviewRow}><Text style={s.reviewLabel}>Fotos:</Text> {photos.length}</Text>
            </View>
          </Section>
        ) : null}

        <View style={s.wizardActions}>
          <TouchableOpacity
            style={[
              s.stepBtn,
              (currentStep === 0 && !isEditMode) && s.stepBtnDisabled
            ]}
            onPress={() => {
              if (isEditMode && currentStep === 0) {
                // Volver al listado
                setExistingPlaceId(null);
                setExistingCategoryId(null);
              } else {
                handlePreviousStep();
              }
            }}
            disabled={(currentStep === 0 && !isEditMode) || isSaving}
            activeOpacity={0.85}
          >
            <Text style={[
              s.stepBtnText,
              (currentStep === 0 && !isEditMode) && s.stepBtnTextDisabled
            ]}>
              {isEditMode && currentStep === 0 ? 'Ver Lugares' : 'Anterior'}
            </Text>
          </TouchableOpacity>

          {currentStep < WIZARD_STEPS.length - 1 ? (
            <TouchableOpacity style={s.stepBtnPrimary} onPress={handleNextStep} activeOpacity={0.85}>
              <Text style={s.stepBtnPrimaryText}>Siguiente</Text>
              <Ionicons name="arrow-forward" size={15} color={C.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.saveBtn, isSaving && s.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[C.brand, C.brandDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.saveGradient}
              >
                <Ionicons
                  name={isSaving ? 'hourglass-outline' : 'checkmark-circle'}
                  size={18}
                  color={C.white}
                />
                <Text style={s.saveText}>
                  {isSaving ? 'Guardando...' : isEditMode ? 'Actualizar negocio' : 'Registrar negocio'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <View style={s.saveNote}>
          <Ionicons name="shield-checkmark-outline" size={13} color={C.mutedLight} />
          <Text style={s.saveNoteText}>
            Los cambios se reflejarán en el perfil público de tu negocio.
          </Text>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
      )}

      <Modal visible={isMapModalVisible} animationType="slide" onRequestClose={() => setIsMapModalVisible(false)}>
        <View style={s.mapModalContainer}>
          <View style={s.mapModalHeader}>
            <Text style={s.mapModalTitle}>Selecciona la ubicación</Text>
            <TouchableOpacity onPress={() => setIsMapModalVisible(false)}>
              <Ionicons name="close" size={24} color={C.text} />
            </TouchableOpacity>
          </View>

          <Text style={s.mapModalHint}>Toca el mapa para mover el pin a la ubicación exacta de tu negocio.</Text>

          <MapView
            provider={PROVIDER_GOOGLE}
            style={s.mapPicker}
            initialRegion={mapRegion}
            region={mapRegion}
            onPress={handleMapPress}
            onRegionChangeComplete={setMapRegion}
          >
            {hasPickedLocation ? (
              <Marker
                coordinate={{
                  latitude: placeCoordinates[1],
                  longitude: placeCoordinates[0],
                }}
              />
            ) : null}
          </MapView>

          <TouchableOpacity
            style={[s.mapConfirmBtn, isResolvingAddress && s.mapConfirmBtnDisabled]}
            onPress={handleConfirmMapLocation}
            disabled={isResolvingAddress}
            activeOpacity={0.85}
          >
            {isResolvingAddress ? <ActivityIndicator size="small" color={C.white} /> : null}
            <Text style={s.mapConfirmBtnText}>{isResolvingAddress ? 'Confirmando ubicación...' : 'Confirmar ubicación'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: { color: C.textSub, fontSize: 13, fontWeight: '600' },

  /* Header */
  header: {
    paddingTop: Platform.select({ ios: 56, android: 42, default: 42 }),
    paddingBottom: 24,
    paddingHorizontal: 20,
    overflow: 'hidden',
    gap: 10,
  },
  circle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -60,
  },
  circle2: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: -20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: C.white, fontSize: 18, fontWeight: '900' },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 19 },

  /* Scroll */
  scroll:        { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 22, paddingTop: 28 },

  wizardHeader: { marginBottom: 18 },
  wizardTitle: { color: C.muted, fontSize: 12, fontWeight: '700' },
  wizardSubtitle: { color: C.text, fontSize: 22, fontWeight: '900', marginTop: 2 },
  progressTrack: {
    marginTop: 10,
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: C.surfaceGray,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.brand,
  },

  /* Category chips */
  catSection: { marginBottom: 4 },
  catLabel:   { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  catGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: C.white,
    borderWidth: 1.5, borderColor: C.borderLight,
  },
  catChipActive:    { backgroundColor: C.brandFaint, borderColor: C.brand },
  catChipText:      { color: C.muted,  fontSize: 13, fontWeight: '600' },
  catChipTextActive:{ color: C.brand,  fontSize: 13, fontWeight: '700' },

  /* Photos */
  photosRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  photoHint: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  photoHintText: { color: C.mutedLight, fontSize: 11, lineHeight: 16, flex: 1 },

  /* Map button */
  mapBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4, borderWidth: 1, borderColor: C.brandBorder },
  mapBtnGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },
  mapBtnIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.brandFaint, borderWidth: 1, borderColor: C.brandBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  mapBtnTitle: { color: C.brandDark, fontSize: 14, fontWeight: '800' },
  mapBtnSub:   { color: C.muted, fontSize: 11, marginTop: 2 },
  locationSummary: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    backgroundColor: C.surfaceGray,
    padding: 12,
    gap: 6,
  },
  locationSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationSummaryText: { flex: 1, color: C.textSub, fontSize: 12, lineHeight: 18 },
  locationCoordinates: { color: C.muted, fontSize: 11 },

  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    backgroundColor: C.surfaceGray,
    padding: 14,
    gap: 8,
  },
  reviewRow: { color: C.textSub, fontSize: 13, lineHeight: 18 },
  reviewLabel: { color: C.text, fontWeight: '800' },

  wizardActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  stepBtn: {
    height: 50,
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
  },
  stepBtnDisabled: { opacity: 0.5 },
  stepBtnText: { color: C.textSub, fontSize: 14, fontWeight: '700' },
  stepBtnTextDisabled: { color: C.mutedLight },
  stepBtnPrimary: {
    height: 50,
    flex: 1,
    borderRadius: 14,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  stepBtnPrimaryText: { color: C.white, fontSize: 14, fontWeight: '800' },

  /* Save */
  saveBtn:          { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  saveBtnDisabled:  { opacity: 0.6 },
  saveGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  saveText: { color: C.white, fontSize: 16, fontWeight: '800' },

  saveNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    justifyContent: 'center',
  },
  saveNoteText: { color: C.mutedLight, fontSize: 12 },

  mapModalContainer: { flex: 1, backgroundColor: C.white, paddingTop: Platform.select({ ios: 60, android: 20, default: 20 }), paddingHorizontal: 16, paddingBottom: 16 },
  mapModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mapModalTitle: { color: C.text, fontSize: 20, fontWeight: '900' },
  mapModalHint: { color: C.textSub, fontSize: 13, marginTop: 6, marginBottom: 12 },
  mapPicker: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  mapConfirmBtn: {
    marginTop: 12,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  mapConfirmBtnDisabled: { opacity: 0.65 },
  mapConfirmBtnText: { color: C.white, fontSize: 15, fontWeight: '800' },

  /* List View */
  listHeader: { marginBottom: 24 },
  listHeaderTitle: { color: C.text, fontSize: 24, fontWeight: '900', marginBottom: 4 },
  listHeaderSub: { color: C.muted, fontSize: 13 },

  placesList: { gap: 14, marginBottom: 20 },
  placeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.borderLight,
    flexDirection: 'row',
    height: 120,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  placeCardImage: { width: '35%', height: '100%' },
  placeCardContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  placeCardName: { color: C.text, fontSize: 15, fontWeight: '800', marginBottom: 4 },
  placeCardAddress: { color: C.textSub, fontSize: 12, lineHeight: 16, marginBottom: 8 },
  placeCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  placeCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.brandFaint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  placeCardBadgeText: { color: C.brand, fontSize: 11, fontWeight: '700' },

  createNewBtn: { borderRadius: 14, overflow: 'hidden' },
  createNewGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  createNewText: { color: C.white, fontSize: 16, fontWeight: '800' },
});