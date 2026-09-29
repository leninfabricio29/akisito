import { api } from './api/client';
import { CheckIn, MyReview, Paginated, PointTransaction, ScanResult, Wallet } from './api/types';

export type ScanInput = {
  qr: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  is_mocked?: boolean;
};

export const loyaltyService = {
  scan: (input: ScanInput) => api.post<ScanResult>('/checkins/scan/', input),
  checkins: (page = 1) => api.get<Paginated<CheckIn>>('/checkins/', { page }),

  review: (checkinId: number, rating: number, comment: string) =>
    api.post<MyReview>('/reviews/', { checkin_id: checkinId, rating, comment }),
  myReviews: (page = 1) => api.get<Paginated<MyReview>>('/reviews/', { page }),

  wallets: (page = 1, pageSize = 20) => api.get<Paginated<Wallet>>('/wallets/', { page, page_size: pageSize }),
  transactions: (businessId: number, page = 1) =>
    api.get<Paginated<PointTransaction>>(`/wallets/${businessId}/transactions/`, { page }),
};
