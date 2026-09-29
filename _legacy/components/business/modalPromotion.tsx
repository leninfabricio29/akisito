import { PlaceItem } from '@/services/place-service';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = {
  brand: '#b82a5e',
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
  green: '#2da06e',
  greenFaint: 'rgba(45,160,110,0.08)',
  greenBorder: 'rgba(45,160,110,0.25)',
  error: '#e53e3e',
};

const WIZARD_STEPS = ['Informacion', 'Condiciones', 'Imagen'];

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDateLabel(date?: Date | null): string {
  if (!date) {
    return '--/--/----';
  }
  return date.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function Field({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  multiline,
  maxLength,
  keyboardType,
  hint,
}: {
  icon: string;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'url';
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={f.container}>
      <View style={f.labelRow}>
        <Text style={f.label}>{label}</Text>
        {maxLength ? <Text style={f.counter}>{value.length}/{maxLength}</Text> : null}
      </View>
      <View style={[f.wrap, focused && f.wrapFocused, multiline && f.wrapMulti]}>
        <View style={[f.iconWrap, multiline && f.iconWrapTop, focused && f.iconFocused]}>
          <Ionicons name={icon as never} size={16} color={focused ? C.brand : C.mutedLight} />
        </View>
        <TextInput
          style={[f.input, multiline && f.inputMulti]}
          placeholder={placeholder}
          placeholderTextColor={C.mutedLight}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType ?? 'default'}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="sentences"
        />
      </View>
      {hint ? (
        <View style={f.hintRow}>
          <Ionicons name="information-circle-outline" size={11} color={C.mutedLight} />
          <Text style={f.hint}>{hint}</Text>
        </View>
      ) : null}
    </View>
  );
}

function DateField({
  icon,
  label,
  value,
  minimumDate,
  onChange,
}: {
  icon: string;
  label: string;
  value: Date | null;
  minimumDate?: Date;
  onChange: (date: Date) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (_: unknown, selectedDate?: Date) => {
    setShowPicker(false);
    if (!selectedDate) {
      return;
    }

    if (minimumDate && selectedDate < minimumDate) {
      onChange(minimumDate);
      return;
    }

    onChange(selectedDate);
  };

  return (
    <View style={f.container}>
      <View style={f.labelRow}>
        <Text style={f.label}>{label}</Text>
      </View>

      <TouchableOpacity style={f.wrap} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
        <View style={f.iconWrap}>
          <Ionicons name={icon as never} size={16} color={C.mutedLight} />
        </View>
        <Text style={[f.input, { color: value ? C.text : C.mutedLight }]}>{formatDateLabel(value)}</Text>
        <View style={f.rightSlot}>
          <Ionicons name="calendar-outline" size={16} color={C.mutedLight} />
        </View>
      </TouchableOpacity>

      {showPicker ? (
        <DateTimePicker
          value={value || minimumDate || new Date()}
          mode="date"
          minimumDate={minimumDate}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

function Section({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <View style={s.numberBadge}>
          <Text style={s.numberBadgeText}>{number}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitle}>{title}</Text>
          <Text style={s.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

interface ModalPromotionProps {
  visible: boolean;
  onClose: () => void;
  isEditing: boolean;
  places: PlaceItem[];
  isLoadingPlaces: boolean;
  isSubmitting: boolean;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  pointsRequired: string;
  setPointsRequired: (v: string) => void;
  placeId: string;
  setPlaceId: (v: string) => void;
  startDate: Date | null;
  setStartDate: (v: Date) => void;
  endDate: Date | null;
  setEndDate: (v: Date) => void;
  maxClaimsPerUser: string;
  setMaxClaimsPerUser: (v: string) => void;
  totalMaxClaims: string;
  setTotalMaxClaims: (v: string) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
  onValidateStep: (step: number) => boolean;
  onSubmit: () => Promise<void>;
}

export default function ModalPromotion({
  visible,
  onClose,
  isEditing,
  places,
  isLoadingPlaces,
  isSubmitting,
  title,
  setTitle,
  description,
  setDescription,
  pointsRequired,
  setPointsRequired,
  placeId,
  setPlaceId,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  maxClaimsPerUser,
  setMaxClaimsPerUser,
  totalMaxClaims,
  setTotalMaxClaims,
  imageUrl,
  setImageUrl,
  onValidateStep,
  onSubmit,
}: ModalPromotionProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const minStartDate = startOfToday();

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita permiso para acceder a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUrl(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleNextStep = () => {
    if (!onValidateStep(currentStep)) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const handleSubmit = async () => {
    await onSubmit();
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={s.modalContainer}>
        <ScrollView contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled">
          <View style={s.headerRow}>
            <Text style={s.modalTitle}>{isEditing ? 'Editar promoción' : 'Nueva promoción'}</Text>
            <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={24} color={C.text} />
            </TouchableOpacity>
          </View>

          <View style={s.wizardHeader}>
            <Text style={s.wizardTitle}>Paso {currentStep + 1} de {WIZARD_STEPS.length}</Text>
            <Text style={s.wizardSubtitle}>{WIZARD_STEPS[currentStep]}</Text>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }]} />
            </View>
          </View>

          {currentStep === 0 ? (
            <Section number="1" title="Información básica" subtitle="Título, lugar y puntos">
              <Field
                icon="pricetag-outline"
                label="Título"
                placeholder="Ej. 2x1 en bebidas"
                value={title}
                onChangeText={setTitle}
                maxLength={60}
              />

              <Field
                icon="document-text-outline"
                label="Descripción"
                placeholder="Describe los detalles de la promoción"
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={220}
              />

              <Field
                icon="star-outline"
                label="Puntos requeridos"
                placeholder="Ej. 100"
                value={pointsRequired}
                onChangeText={setPointsRequired}
                keyboardType="numeric"
              />

              <View style={s.placeSection}>
                <Text style={s.placeLabel}>Lugar</Text>
                {isLoadingPlaces ? <ActivityIndicator size="small" color={C.brand} /> : null}
                <View style={s.placeGrid}>
                  {places.map((place) => (
                    <TouchableOpacity
                      key={place._id}
                      style={[s.placeChip, placeId === place._id && s.placeChipActive]}
                      onPress={() => setPlaceId(place._id)}
                    >
                      <Text style={[s.placeChipText, placeId === place._id && s.placeChipTextActive]}>{place.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Section>
          ) : null}

          {currentStep === 1 ? (
            <Section number="2" title="Condiciones" subtitle="Vigencia y límites">
              <DateField
                icon="calendar-outline"
                label="Fecha de inicio"
                value={startDate}
                minimumDate={minStartDate}
                onChange={setStartDate}
              />

              <DateField
                icon="calendar-outline"
                label="Fecha de fin"
                value={endDate}
                minimumDate={startDate || minStartDate}
                onChange={setEndDate}
              />

              <Field
                icon="repeat-outline"
                label="Máximo por usuario"
                placeholder="Ej. 1"
                value={maxClaimsPerUser}
                onChangeText={setMaxClaimsPerUser}
                keyboardType="numeric"
              />

              <Field
                icon="layers-outline"
                label="Máximo total"
                placeholder="Opcional"
                value={totalMaxClaims}
                onChangeText={setTotalMaxClaims}
                keyboardType="numeric"
                hint="Opcional: si lo dejas vacío no tendrá límite total"
              />
            </Section>
          ) : null}

          {currentStep === 2 ? (
            <Section number="3" title="Imagen" subtitle="Sube una imagen de la promoción">
              <View style={s.imagePickerSection}>
                <TouchableOpacity style={s.imagePickerBtn} onPress={handlePickImage}>
                  <Ionicons name="image-outline" size={32} color={C.brand} />
                  <Text style={s.imagePickerBtnText}>Seleccionar imagen</Text>
                  <Text style={s.imagePickerBtnHint}>de la galería</Text>
                </TouchableOpacity>
              </View>

              {imageUrl.trim() ? (
                <View style={s.imagePreviewContainer}>
                  <Image source={{ uri: imageUrl.trim() }} style={s.previewImage} contentFit="cover" />
                  <TouchableOpacity style={s.removeImageBtn} onPress={() => setImageUrl('')}>
                    <Ionicons name="close-circle" size={24} color={C.error} />
                  </TouchableOpacity>
                </View>
              ) : null}
            </Section>
          ) : null}

          <View style={s.wizardActions}>
            <TouchableOpacity
              style={[s.stepBtn, currentStep === 0 && s.stepBtnDisabled]}
              onPress={handlePreviousStep}
              disabled={currentStep === 0 || isSubmitting}
            >
              <Text style={s.stepBtnText}>Anterior</Text>
            </TouchableOpacity>

            {currentStep < WIZARD_STEPS.length - 1 ? (
              <TouchableOpacity style={s.stepBtnPrimary} onPress={handleNextStep}>
                <Text style={s.stepBtnPrimaryText}>Siguiente</Text>
                <Ionicons name="arrow-forward" size={14} color={C.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[s.saveBtn, isSubmitting && s.saveBtnDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
                <LinearGradient colors={[C.brand, C.brandDark]} style={s.saveGradient}>
                  {isSubmitting ? <ActivityIndicator size="small" color={C.white} /> : <Ionicons name="checkmark-circle" size={18} color={C.white} />}
                  <Text style={s.saveText}>{isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar promoción' : 'Crear promoción'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const f = StyleSheet.create({
  container: { marginBottom: 18 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { color: C.text, fontSize: 13, fontWeight: '700' },
  counter: { color: C.mutedLight, fontSize: 11 },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.borderLight,
    minHeight: 54,
  },
  wrapFocused: { borderColor: C.brand },
  wrapMulti: { alignItems: 'flex-start', minHeight: 110 },
  iconWrap: {
    width: 48,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: C.borderLight,
    marginRight: 12,
  },
  iconWrapTop: { justifyContent: 'flex-start', paddingTop: 16 },
  iconFocused: { borderRightColor: C.brandBorder },
  input: { flex: 1, color: C.text, fontSize: 15, paddingRight: 14 },
  inputMulti: { paddingTop: 14, paddingBottom: 14, minHeight: 90 },
  hintRow: { flexDirection: 'row', gap: 4, marginTop: 6, alignItems: 'center' },
  hint: { color: C.mutedLight, fontSize: 11 },
  rightSlot: { paddingRight: 14, marginLeft: 12 },
});

const s = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: C.bg,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
    color: C.text,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surfaceGray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },
  wizardHeader: { marginBottom: 18 },
  wizardTitle: { color: C.muted, fontSize: 12, fontWeight: '700' },
  wizardSubtitle: { color: C.text, fontSize: 20, fontWeight: '900', marginTop: 2 },
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
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  numberBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.brandFaint, alignItems: 'center', justifyContent: 'center' },
  numberBadgeText: { color: C.brand, fontSize: 14, fontWeight: '900' },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '900', marginBottom: 2 },
  sectionSubtitle: { color: C.textSub, fontSize: 12, fontWeight: '500' },
  placeSection: { marginBottom: 8 },
  placeLabel: { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  placeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  placeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  placeChipActive: { backgroundColor: C.brand, borderColor: C.brand },
  placeChipText: { color: C.muted, fontSize: 12, fontWeight: '700' },
  placeChipTextActive: { color: C.white },
  imagePickerSection: {
    marginBottom: 20,
  },
  imagePickerBtn: {
    backgroundColor: C.brandFaint,
    borderWidth: 2,
    borderColor: C.brandBorder,
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.brand,
    marginTop: 12,
    textAlign: 'center',
  },
  imagePickerBtnHint: {
    fontSize: 12,
    color: C.muted,
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 16,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1.6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: C.white,
    borderRadius: 999,
    padding: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  wizardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  stepBtn: {
    height: 48,
    flex: 1,
    borderRadius: 12,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { backgroundColor: C.surfaceGray, borderColor: C.surfaceBorder },
  stepBtnText: { color: C.brand, fontSize: 14, fontWeight: '700' },
  stepBtnTextDisabled: { color: C.mutedLight },
  stepBtnPrimary: {
    height: 48,
    flex: 1,
    borderRadius: 12,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  stepBtnPrimaryText: { color: C.white, fontSize: 14, fontWeight: '700' },
  saveBtn: {
    height: 48,
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveGradient: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  saveText: { color: C.white, fontSize: 14, fontWeight: '700' },
});
