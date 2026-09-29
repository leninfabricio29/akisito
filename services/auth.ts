import { api } from './api/client';
import { toFormData } from './api/files';
import { AuthResponse, User } from './api/types';

export type RegisterClientInput = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  ci: string;
};

export type RegisterBusinessInput = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  business_name: string;
  ruc: string;
  category: number;
  address: string;
  latitude: string;
  longitude: string;
  schedule?: string;
};

export type UpdateProfileInput = Partial<Pick<User, 'first_name' | 'last_name' | 'phone' | 'ci' | 'birth_date'>>;

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login/', { email: email.trim().toLowerCase(), password }, false),
  registerClient: (input: RegisterClientInput) => api.post<AuthResponse>('/auth/register/client/', input, false),
  registerBusiness: (input: RegisterBusinessInput) => api.post<AuthResponse>('/auth/register/business/', input, false),

  forgotPassword: (email: string) => api.post<{ detail: string }>('/auth/password/forgot/', { email }, false),
  verifyResetCode: (email: string, code: string) =>
    api.post<{ valid: boolean }>('/auth/password/verify/', { email, code }, false),
  resetPassword: (email: string, code: string, new_password: string) =>
    api.post<{ detail: string }>('/auth/password/reset/', { email, code, new_password }, false),
  changePassword: (current_password: string, new_password: string) =>
    api.post<{ detail: string }>('/auth/password/change/', { current_password, new_password }),

  me: () => api.get<User>('/me/'),
  updateMe: (input: UpdateProfileInput) => api.patch<User>('/me/', input),
  updateAvatar: (uri: string) => api.patch<User>('/me/', toFormData({}, { avatar: uri })),
  deleteAccount: (password: string) => api.delete('/me/', { password }),
};
