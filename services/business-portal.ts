/** Endpoints del portal del negocio (/business/*). Requieren un usuario con rol negocio. */

import { api } from './api/client';
import { toFormData } from './api/files';
import type {
  BusinessRedemption,
  BusinessReview,
  BusinessStats,
  Customer,
  CustomerSegment,
  OwnBusiness,
  OwnReward,
  Paginated,
  RedemptionStatus,
  StatsPeriod,
} from './api/types';

export type OwnBusinessInput = Partial<
  Pick<
    OwnBusiness,
    | 'name'
    | 'category'
    | 'description'
    | 'address'
    | 'latitude'
    | 'longitude'
    | 'checkin_points'
    | 'review_points'
    | 'checkin_radius_m'
  >
>;

export type BusinessCreateInput = {
  name: string;
  ruc: string;
  category: number;
  address: string;
  latitude: string;
  longitude: string;
};

export type RewardInput = {
  title: string;
  description: string;
  points_required: number;
  starts_at?: string;
  ends_at: string | null;
  max_per_client: number | null;
  stock: number | null;
  is_active: boolean;
};

function rewardBody(input: Partial<RewardInput>, imageUri?: string) {
  return imageUri ? toFormData(input, { image: imageUri }) : input;
}

export const portalService = {
  // Perfil
  get: () => api.get<OwnBusiness>('/business/'),
  create: (input: BusinessCreateInput) => api.post<OwnBusiness>('/business/', input),
  update: (input: OwnBusinessInput) => api.patch<OwnBusiness>('/business/', input),
  updateLogo: (uri: string) => api.patch<OwnBusiness>('/business/', toFormData({}, { logo: uri })),
  updateCover: (uri: string) => api.patch<OwnBusiness>('/business/', toFormData({}, { cover: uri })),
  resubmit: () => api.post<OwnBusiness>('/business/resubmit/'),

  // QR
  qr: () => api.get<{ payload: string; rotated_at: string | null }>('/business/qr/'),
  rotateQr: () => api.post<{ payload: string; rotated_at: string | null }>('/business/qr/rotate/'),
  qrPosterLink: () => api.post<{ url: string }>('/business/qr/poster/'),

  // Recompensas
  rewards: (page = 1, isActive?: boolean) =>
    api.get<Paginated<OwnReward>>('/business/rewards/', { page, is_active: isActive }),
  reward: (id: number) => api.get<OwnReward>(`/business/rewards/${id}/`),
  createReward: (input: RewardInput, imageUri?: string) => api.post<OwnReward>('/business/rewards/', rewardBody(input, imageUri)),
  updateReward: (id: number, input: Partial<RewardInput>, imageUri?: string) =>
    api.patch<OwnReward>(`/business/rewards/${id}/`, rewardBody(input, imageUri)),
  deleteReward: (id: number) => api.delete(`/business/rewards/${id}/`),

  // Canjes
  redemptions: (page = 1, status?: RedemptionStatus, search?: string) =>
    api.get<Paginated<BusinessRedemption>>('/business/redemptions/', { page, status, search }),
  lookupCode: (code: string) => api.get<BusinessRedemption>('/business/redemptions/lookup/', { code }),
  validateCode: (code: string) => api.post<BusinessRedemption>('/business/redemptions/validate/', { code }),

  // Reseñas
  reviews: (page = 1, rating?: number) => api.get<Paginated<BusinessReview>>('/business/reviews/', { page, rating }),
  reply: (id: number, reply: string) => api.post<BusinessReview>(`/business/reviews/${id}/reply/`, { reply }),

  // Clientes y estadísticas
  customers: (page = 1, segment?: CustomerSegment, search?: string, ordering?: string) =>
    api.get<Paginated<Customer>>('/business/customers/', { page, segment, search, ordering }),
  stats: (period: StatsPeriod) => api.get<BusinessStats>('/business/stats/', { period }),
};
