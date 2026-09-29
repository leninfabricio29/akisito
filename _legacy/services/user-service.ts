

import API_CONFIG from '@/services/config/api';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
};


export type UserProfile = {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    referral_code?: string;
    points_balance?: number;
    }

export type UpdateProfilePayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
};

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
};


export type StatsClients = {
    user_start: string;
    total_points: number;
    total_visits: number;
    total_redemptions: number;
    total_referrals: number;
    total_reviews: number;

}

async function requestJson<TResponse, TBody = undefined>(
  path: string,
  options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    token?: string;
    body?: TBody;
    allowEmptyData?: boolean;
  },
): Promise<TResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
    method: options.method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const parsed = (await response.json()) as ApiResponse<TResponse>;

  return (parsed.data as TResponse) ?? ({} as TResponse);
}

export async function getUserProfileRequest(token: string): Promise<UserProfile> {

    return requestJson<UserProfile>('/users/me', {
    method: 'GET',
    token,
  });
  }

export async function getStatsClientsRequest(token: string): Promise<StatsClients> {

    return requestJson<StatsClients>('/users/stats', {
    method: 'GET',
    token,
  });
  }

export async function updateUserProfileRequest(token: string, payload: UpdateProfilePayload): Promise<UserProfile> {
  return requestJson<UserProfile, UpdateProfilePayload>('/users/me', {
    method: 'PUT',
    token,
    body: payload,
  });
}

export async function changePasswordRequest(token: string, payload: ChangePasswordPayload): Promise<void> {
  await requestJson<void, ChangePasswordPayload>('/auth/change-password', {
    method: 'PUT',
    token,
    body: payload,
  });
}


