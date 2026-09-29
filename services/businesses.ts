import { api } from './api/client';
import {
  BusinessDetail,
  BusinessReviewsPage,
  BusinessSummary,
  Category,
  Favorite,
  Paginated,
  Reward,
} from './api/types';

export type BusinessQuery = {
  search?: string;
  category?: number;
  lat?: number;
  lng?: number;
  radius?: number;
  ordering?: string;
  page?: number;
  page_size?: number;
};

export const businessService = {
  categories: () => api.get<Category[]>('/categories/', undefined, false),
  list: (query: BusinessQuery = {}) => api.get<Paginated<BusinessSummary>>('/businesses/', query),
  detail: (id: number) => api.get<BusinessDetail>(`/businesses/${id}/`),
  reviews: (id: number, page = 1) => api.get<BusinessReviewsPage>(`/businesses/${id}/reviews/`, { page, page_size: 10 }),
  rewards: (id: number) => api.get<Paginated<Reward>>(`/businesses/${id}/rewards/`, { page_size: 50 }),

  favorites: (page = 1) => api.get<Paginated<Favorite>>('/favorites/', { page }),
  addFavorite: (businessId: number) => api.post<Favorite>('/favorites/', { business_id: businessId }),
  removeFavorite: (businessId: number) => api.delete(`/favorites/${businessId}/`),
};
