import { api } from './api/client';
import { toFormData } from './api/files';
import { AuthResponse, User } from './api/types';

export type UpdateProfileInput = Partial<Pick<User, 'first_name' | 'last_name' | 'phone' | 'ci' | 'birth_date'>>;

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login/', { email: email.trim().toLowerCase(), password }, false),
  // Registro: solo correo → código por correo → contraseña. El resto del perfil se completa en la app.
  signupStart: (email: string, is_business: boolean) =>
    api.post<{ detail: string }>('/auth/register/start/', { email, is_business }, false),
  signupVerify: (email: string, code: string) =>
    api.post<{ valid: boolean }>('/auth/register/verify/', { email, code }, false),
  signupComplete: (email: string, code: string, password: string) =>
    api.post<AuthResponse>('/auth/register/complete/', { email, code, password }, false),

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
