import { CompactPromotionRow } from '@/components/business/compactPromotionRow';
import { HeaderBusinessComponent } from '@/components/business/header';
import ModalPromotion from '@/components/business/modalPromotion';
import { useAuth } from '@/context/auth-context';
import { PlaceItem, getMyPlacesRequest } from '@/services/place-service';
import {
  PromotionItem,
  createPromotionRequest,
  createPromotionWithFormDataRequest,
  deactivatePromotionRequest,
  getMyPromotionsRequest,
  updatePromotionRequest,
  updatePromotionWithFormDataRequest,
} from '@/services/promotion-service';
import { buildPromotionFormData } from '@/services/utils/file-utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

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

function parseServerDate(raw?: string): Date | null {
  if (!raw) {
    return null;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toApiDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function statusLabel(status: PromotionItem['status']): string {
  if (status === 'inactive') {
    return 'Inactiva';
  }
  if (status === 'expired') {
    return 'Expirada';
  }
  return 'Activa';
}

function statusStyle(status: PromotionItem['status']) {
  if (status === 'inactive') {
    return {
      backgroundColor: 'rgba(107,85,96,0.12)',
      borderColor: 'rgba(107,85,96,0.3)',
      color: C.textSub,
    };
  }
  if (status === 'expired') {
    return {
      backgroundColor: 'rgba(229,62,62,0.08)',
      borderColor: 'rgba(229,62,62,0.25)',
      color: C.error,
    };
  }
  return {
    backgroundColor: C.greenFaint,
    borderColor: C.greenBorder,
    color: C.green,
  };
}

export default function MyPromosScreen() {
  const router = useRouter();
  const { authToken } = useAuth();

  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [places, setPlaces] = useState<PlaceItem[]>([]);

  const [isLoadingPromotions, setIsLoadingPromotions] = useState(true);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [pointsRequired, setPointsRequired] = useState('');
  const [maxClaimsPerUser, setMaxClaimsPerUser] = useState('1');
  const [totalMaxClaims, setTotalMaxClaims] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [statusUpdatingIds, setStatusUpdatingIds] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');

  const minStartDate = useMemo(() => startOfToday(), []);
  const isEditing = Boolean(editingPromotionId);

  const filteredPromotions = useMemo(() => {
    return promotions.filter((promo) => {
      const matchesSearch = promo.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || promo.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [promotions, searchTerm, filterStatus]);

  const loadPromotions = async () => {
    if (!authToken) {
      setPromotions([]);
      return;
    }

    setIsLoadingPromotions(true);
    try {
      const result = await getMyPromotionsRequest(authToken);
      setPromotions(result);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudieron cargar las promociones.');
      setPromotions([]);
    } finally {
      setIsLoadingPromotions(false);
    }
  };

  const loadPlaces = async () => {
    if (!authToken) {
      setPlaces([]);
      return;
    }

    setIsLoadingPlaces(true);
    try {
      const result = await getMyPlacesRequest(authToken);
      setPlaces(result);
      if (!placeId && result.length > 0) {
        setPlaceId(result[0]._id);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudieron cargar tus lugares.');
      setPlaces([]);
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, [authToken]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPointsRequired('');
    setMaxClaimsPerUser('1');
    setTotalMaxClaims('');
    setStartDate(null);
    setEndDate(null);
    setImageUrl('');
    setEditingPromotionId(null);
  };

  const openCreateModal = async () => {
    resetForm();
    if (!places.length) {
      await loadPlaces();
    }
    setModalVisible(true);
  };

  const openEditModal = async (promo: PromotionItem) => {
    if (!places.length) {
      await loadPlaces();
    }

    setEditingPromotionId(promo._id);
    setTitle(promo.title || '');
    setDescription(promo.description || '');
    setPlaceId(typeof promo.place_id === 'string' ? promo.place_id : promo.place_id._id);
    setPointsRequired(String(promo.points_required || ''));
    setMaxClaimsPerUser(String(promo.max_claims_per_user || 1));
    setTotalMaxClaims(promo.total_max_claims ? String(promo.total_max_claims) : '');
    setStartDate(parseServerDate(promo.start_date));
    setEndDate(parseServerDate(promo.end_date));
    setImageUrl(promo.image || '');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const validateStep = (step: number): boolean => {
    if (step === 0) {
      if (!title.trim()) {
        Alert.alert('Campo requerido', 'Ingresa el tÃ­tulo de la promociÃ³n.');
        return false;
      }
      if (!pointsRequired.trim() || Number(pointsRequired) < 1) {
        Alert.alert('Campo requerido', 'Los puntos requeridos deben ser mayor a 0.');
        return false;
      }
      if (!placeId) {
        Alert.alert('Campo requerido', 'Selecciona un lugar para la promociÃ³n.');
        return false;
      }
    }

    if (step === 1) {
      if (!startDate || !endDate) {
        Alert.alert('Campo requerido', 'Selecciona fecha de inicio y fin.');
        return false;
      }
      if (startDate < minStartDate) {
        Alert.alert('Fecha inválida', 'La fecha de inicio no puede ser anterior a hoy.');
        return false;
      }
      if (endDate < startDate) {
        Alert.alert('Fecha inválida', 'La fecha de fin no puede ser menor a la fecha de inicio.');
        return false;
      }
      if (!maxClaimsPerUser.trim() || Number(maxClaimsPerUser) < 1) {
        Alert.alert('Campo requerido', 'El máximo por usuario debe ser mayor a 0.');
        return false;
      }
      if (totalMaxClaims.trim() && Number(totalMaxClaims) < 1) {
        Alert.alert('Dato inválido', 'El máximo total debe ser mayor a 0.');
        return false;
      }
    }

    if (step === 2) {
      if (!imageUrl.trim()) {
        Alert.alert('Campo requerido', 'Ingresa la URL de imagen de la promoción.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!authToken) {
      Alert.alert('Sesión inválida', 'Inicia sesión nuevamente para continuar.');
      return;
    }

    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (!startDate || !endDate) {
        throw new Error('Fechas inválidas.');
      }

      const data = {
        title: title.trim(),
        description: description.trim() || undefined,
        points_required: Number(pointsRequired),
        start_date: toApiDate(startDate),
        end_date: toApiDate(endDate),
        max_claims_per_user: Number(maxClaimsPerUser),
        total_max_claims: totalMaxClaims.trim() ? Number(totalMaxClaims) : undefined,
      };

      // Detectar si es una URI local (file://) o remota (http)
      const isLocalImage = imageUrl.trim().startsWith('file://');

      if (isEditing && editingPromotionId) {
        if (isLocalImage) {
          // Actualizar con FormData si la imagen es local
          const formData = buildPromotionFormData(data, imageUrl.trim());
          await updatePromotionWithFormDataRequest(authToken, editingPromotionId, formData);
        } else {
          // Actualizar con JSON si la imagen es remota
          await updatePromotionRequest(authToken, editingPromotionId, {
            ...data,
            image: imageUrl.trim(),
          });
        }
      } else {
        if (isLocalImage) {
          // Crear con FormData si la imagen es local
          const formData = buildPromotionFormData(data, imageUrl.trim());
          formData.append('place_id', placeId);
          await createPromotionWithFormDataRequest(authToken, formData);
        } else {
          // Crear con JSON si la imagen es remota
          await createPromotionRequest(authToken, {
            ...data,
            image: imageUrl.trim(),
            place_id: placeId,
          });
        }
      }

      closeModal();
      await loadPromotions();
      Alert.alert('Listo', isEditing ? 'Promoción actualizada correctamente.' : 'Promoción creada correctamente.');
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (promotionId: string) => {
    if (!authToken) {
      Alert.alert('Sesión inválida', 'Inicia sesión nuevamente para continuar.');
      return;
    }

    Alert.alert('Desactivar promoción', '¿Deseas desactivar esta promoción?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desactivar',
        style: 'destructive',
        onPress: async () => {
          const previousPromotions = promotions;
          setStatusUpdatingIds((prev) => ({ ...prev, [promotionId]: true }));
          setPromotions((prev) =>
            prev.map((item) =>
              item._id === promotionId ? { ...item, status: 'inactive' } : item,
            ),
          );

          try {
            await deactivatePromotionRequest(authToken, promotionId);
            Alert.alert('Promoción desactivada', 'La promoción se desactivó correctamente.');
          } catch (error) {
            setPromotions(previousPromotions);
            Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo desactivar la promoción.');
          } finally {
            setStatusUpdatingIds((prev) => ({ ...prev, [promotionId]: false }));
          }
        },
      },
    ]);
  };

  const handleReactivate = async (promotionId: string) => {
    if (!authToken) {
      Alert.alert('Sesión inválida', 'Inicia sesión nuevamente para continuar.');
      return;
    }

    const previousPromotions = promotions;
    setStatusUpdatingIds((prev) => ({ ...prev, [promotionId]: true }));
    setPromotions((prev) =>
      prev.map((item) =>
        item._id === promotionId ? { ...item, status: 'active' } : item,
      ),
    );

    try {
      await updatePromotionRequest(authToken, promotionId, { status: 'active' });
      Alert.alert('Promoción activada', 'La promoción se activó correctamente.');
    } catch (error) {
      setPromotions(previousPromotions);
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo activar la promoción.');
    } finally {
      setStatusUpdatingIds((prev) => ({ ...prev, [promotionId]: false }));
    }
  };

  

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <HeaderBusinessComponent
        title="Mis promociones"
        subtitle="Crea y administra las promociones de tu negocio"
        backButtonProps={{ onPress: () => router.back() }}
      />

      <View style={s.filterContainer}>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={18} color={C.muted} />
          <TextInput
            placeholder="Buscar promoción..."
            placeholderTextColor={C.mutedLight}
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={s.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterTabs}>
          {['all', 'active', 'inactive', 'expired'].map((status) => {
            const isActive = filterStatus === status;
            const labels: Record<string, string> = {
              all: 'Todas',
              active: 'Activas',
              inactive: 'Inactivas',
              expired: 'Expiradas',
            };
            return (
              <TouchableOpacity
                key={status}
                style={[s.filterChip, isActive && s.filterChipActive]}
                onPress={() => setFilterStatus(status as typeof filterStatus)}
              >
                <Text style={[s.filterChipText, isActive && s.filterChipTextActive]}>{labels[status]}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoadingPromotions ? (
        <View style={s.centerLoader}>
          <ActivityIndicator size="small" color={C.brand} />
          <Text style={s.loaderText}>Cargando promociones...</Text>
        </View>
      ) : filteredPromotions.length === 0 ? (
        <View style={s.centerLoader}>
          <Text style={s.empty}>{searchTerm || filterStatus !== 'all' ? 'No encontramos promociones.' : 'No tienes promociones aún.'}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPromotions}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <View key={item._id} style={[s.rowContainer, index === filteredPromotions.length - 1 && s.rowContainerLast]}>
              <CompactPromotionRow
                promo={item}
                onEdit={openEditModal}
                onDeactivate={handleDeactivate}
                onReactivate={handleReactivate}
                statusUpdating={Boolean(statusUpdatingIds[item._id])}
              />
            </View>
          )}
          contentContainerStyle={s.listContent}
          scrollIndicatorInsets={{ right: 1 }}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={openCreateModal}>
        <Ionicons name="add" size={26} color={C.white} />
      </TouchableOpacity>

      <ModalPromotion
        visible={modalVisible}
        onClose={closeModal}
        isEditing={isEditing}
        places={places}
        isLoadingPlaces={isLoadingPlaces}
        isSubmitting={isSubmitting}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        pointsRequired={pointsRequired}
        setPointsRequired={setPointsRequired}
        placeId={placeId}
        setPlaceId={setPlaceId}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        maxClaimsPerUser={maxClaimsPerUser}
        setMaxClaimsPerUser={setMaxClaimsPerUser}
        totalMaxClaims={totalMaxClaims}
        setTotalMaxClaims={setTotalMaxClaims}
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        onValidateStep={validateStep}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const s = StyleSheet.create({
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceBorder,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.surfaceGray,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    fontWeight: '500',
  },
  filterTabs: {
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.borderLight,
    backgroundColor: C.white,
    marginRight: 8,
  },
  filterChipActive: {
    borderColor: C.brand,
    backgroundColor: C.brandFaint,
  },
  filterChipText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: C.brand,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: { color: C.muted, fontSize: 12, marginTop: 8 },
  empty: {
    color: C.muted,
    textAlign: 'center',
    fontSize: 14,
  },
  rowContainer: {
    paddingHorizontal: 16,
  },
  rowContainerLast: {
    marginBottom: 80,
  },
  listContent: {
    paddingTop: 12,
  },
  card: {
    backgroundColor: C.white,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: '800',
    fontSize: 15,
    color: C.text,
    flex: 1,
    paddingRight: 8,
  },
  cardDesc: {
    color: C.textSub,
    marginVertical: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
    color: C.muted,
  },
  pointsBadge: {
    backgroundColor: C.brandFaint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.brandBorder,
  },
  pointsText: {
    color: C.brand,
    fontWeight: '700',
  },
  statusBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.brandBorder,
    backgroundColor: C.brandFaint,
  },
  actionText: {
    color: C.brand,
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(229,62,62,0.25)',
    backgroundColor: 'rgba(229,62,62,0.08)',
  },
  actionTextDanger: {
    color: C.error,
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.greenBorder,
    backgroundColor: C.greenFaint,
  },
  actionTextSuccess: {
    color: C.green,
    fontSize: 12,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    backgroundColor: C.brand,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
  placeSection: { marginBottom: 8 },
  placeLabel: { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  placeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  placeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.borderLight,
    backgroundColor: C.white,
  },
  placeChipActive: {
    borderColor: C.brand,
    backgroundColor: C.brandFaint,
  },
  placeChipText: { color: C.muted, fontSize: 12, fontWeight: '700' },
  placeChipTextActive: { color: C.brand },
  previewImage: {
    width: '100%',
    aspectRatio: 1.6,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: C.borderLight,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
  },
  stepBtnDisabled: { opacity: 0.5 },
  stepBtnText: { color: C.textSub, fontSize: 14, fontWeight: '700' },
  stepBtnPrimary: {
    height: 48,
    flex: 1,
    borderRadius: 14,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  stepBtnPrimaryText: { color: C.white, fontSize: 14, fontWeight: '800' },
  saveBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  saveBtnDisabled: { opacity: 0.7 },
  saveGradient: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '800',
  },
  cancelText: {
    textAlign: 'center',
    marginTop: 6,
    color: C.muted,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: C.bg,
  },
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
});




