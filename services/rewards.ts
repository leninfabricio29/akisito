import { api } from './api/client';
import { Paginated, Redemption, RedemptionStatus, Reward } from './api/types';

export const rewardService = {
  list: (query: { page?: number; business?: number; search?: string; ordering?: string } = {}) =>
    api.get<Paginated<Reward>>('/rewards/', query),
  redeem: (rewardId: number) => api.post<Redemption>(`/rewards/${rewardId}/redeem/`),

  redemptions: (page = 1, status?: RedemptionStatus) => api.get<Paginated<Redemption>>('/redemptions/', { page, status }),
  cancel: (redemptionId: number) => api.post<Redemption>(`/redemptions/${redemptionId}/cancel/`),
};
