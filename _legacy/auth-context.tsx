import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  BackendAuthUser,
  forgotPasswordRequest,
  loginRequest,
  registerBusinessRequest,
  registerClientRequest,
  resetPasswordRequest,
  validateResetCodeRequest,
} from '@/services/auth-service';
import { getUserProfileRequest } from '@/services/user-service';

type UserRole = 'Usuario' | 'Negocio';

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  ci?: string;
  ruc?: string;
  businessName?: string;
  businessCategory?: string;
  avatar_url?: string;
  referral_code?: string;
};

type AuthResult = {
  ok: boolean;
  message?: string;
  redirectUrl?: string;
};

type ForgotPasswordResult = AuthResult & {
  email?: string;
};

type RegisterPayload = {
  isBusiness: boolean;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  cedula?: string;
  ruc?: string;
  businessName?: string;
  businessCategory?: string;
  referralCode?: string;
};

type ForgotPasswordPayload = {
  ci?: string;
  ruc?: string;
};

type AuthContextValue = {
  isLoading: boolean;
  session: SessionUser | null;
  authToken: string | null;
  refreshSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  registerUser: (payload: RegisterPayload) => Promise<AuthResult>;
  requestPasswordRecovery: (payload: ForgotPasswordPayload) => Promise<ForgotPasswordResult>;
  validateRecoveryCode: (email: string, code: string) => Promise<AuthResult>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<AuthResult>;
};

const STORAGE_SESSION_KEY = 'winner_app_session';
const STORAGE_TOKEN_KEY = 'winner_app_auth_token';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAppRole(role: BackendAuthUser['role']): UserRole {
  return role === 'business' ? 'Negocio' : 'Usuario';
}

function toSessionUser(user: BackendAuthUser): SessionUser {
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

  return {
    id: user._id,
    email: user.email,
    name: fullName || user.email,
    role: toAppRole(user.role),
    phone: user.phone,
    ci: user.ci,
    ruc: user.ruc,
    businessName: user.business_name,
    businessCategory: user.business_category,
    avatar_url: user.avatar_url,
    referral_code: user.referral_code,
  };
}

function mergeProfileIntoSession(base: SessionUser, profile: Awaited<ReturnType<typeof getUserProfileRequest>>): SessionUser {
  return {
    ...base,
    email: profile.email ?? base.email,
    phone: profile.phone ?? base.phone,
    avatar_url: profile.avatar_url ?? base.avatar_url,
    referral_code: profile.referral_code ?? base.referral_code,
    name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || base.name,
  };
}

function nowMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }

  return Date.now();
}

function logTiming(label: string, ms: number): void {
  // Instrumentacion ligera para detectar cuellos de botella en login/sesion.
  console.info(`[auth-timing] ${label}: ${Math.round(ms)}ms`);
}

function isPasswordResetSuccessMessage(message: string): boolean {
  const normalized = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

  return (
    normalized.includes('contrasena actualizada correctamente') ||
    normalized.includes('password updated successfully')
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [rawSession, rawToken] = await Promise.all([
          AsyncStorage.getItem(STORAGE_SESSION_KEY),
          AsyncStorage.getItem(STORAGE_TOKEN_KEY),
        ]);

        if (rawSession && rawToken) {
          const storedSession = JSON.parse(rawSession) as SessionUser;
          let nextSession = storedSession;

          try {
            const profile = await getUserProfileRequest(rawToken);
            nextSession = mergeProfileIntoSession(storedSession, profile);
            await AsyncStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(nextSession));
          } catch {
            // Keep stored session if profile refresh fails.
          }

          setSession(nextSession);
          setAuthToken(rawToken);
        } else if (rawSession || rawToken) {
          await Promise.all([
            AsyncStorage.removeItem(STORAGE_SESSION_KEY),
            AsyncStorage.removeItem(STORAGE_TOKEN_KEY),
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const refreshSession = async (): Promise<void> => {
    if (!authToken || !session) return;

    const profile = await getUserProfileRequest(authToken);
    const nextSession = mergeProfileIntoSession(session, profile);

    await AsyncStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const tStart = nowMs();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      return { ok: false, message: 'Ingresa correo y contraseña.' };
    }

    try {
      const tLoginStart = nowMs();
      const data = await loginRequest(normalizedEmail, normalizedPassword);
      logTiming('loginRequest', nowMs() - tLoginStart);

      const baseSession = toSessionUser(data.user);
      const nextSession = baseSession;

      const tStorageStart = nowMs();
      await Promise.all([
        AsyncStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(nextSession)),
        AsyncStorage.setItem(STORAGE_TOKEN_KEY, data.token),
      ]);
      logTiming('persistSession', nowMs() - tStorageStart);

      setSession(nextSession);
      setAuthToken(data.token);

      void (async () => {
        const tProfileStart = nowMs();
        try {
          const profile = await getUserProfileRequest(data.token);
          const mergedSession = mergeProfileIntoSession(baseSession, profile);

          await AsyncStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(mergedSession));
          setSession(mergedSession);
          logTiming('profileHydration', nowMs() - tProfileStart);
        } catch {
          logTiming('profileHydrationFailed', nowMs() - tProfileStart);
        }
      })();

      logTiming('signInTotal', nowMs() - tStart);
      return { ok: true };
    } catch (error) {
      logTiming('signInTotalWithError', nowMs() - tStart);
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'No se pudo iniciar sesión',
      };
    }
  };

  const signOut = async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_SESSION_KEY),
      AsyncStorage.removeItem(STORAGE_TOKEN_KEY),
    ]);
    setSession(null);
    setAuthToken(null);
  };

  const registerUser = async (payload: RegisterPayload): Promise<AuthResult> => {
    try {
      const email = payload.email.trim().toLowerCase();
      const password = payload.password;

      if (payload.isBusiness) {
        if (!payload.ruc || !payload.businessName || !payload.businessCategory) {
          return { ok: false, message: 'Completa todos los datos del negocio.' };
        }

        await registerBusinessRequest({
          first_name: payload.firstName.trim(),
          last_name: payload.lastName.trim(),
          email,
          password,
          phone: payload.phone.trim(),
          ruc: payload.ruc.trim(),
          business_name: payload.businessName.trim(),
          business_category: payload.businessCategory.trim(),
        });

        // Auto-login para business
        try {
          const data = await loginRequest(email, password);
          const baseSession = toSessionUser(data.user);
          let nextSession = baseSession;

          try {
            const profile = await getUserProfileRequest(data.token);
            nextSession = mergeProfileIntoSession(baseSession, profile);
          } catch {
            // Si falla obtener perfil, usar datos del login
          }

          await Promise.all([
            AsyncStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(nextSession)),
            AsyncStorage.setItem(STORAGE_TOKEN_KEY, data.token),
          ]);

          setSession(nextSession);
          setAuthToken(data.token);

          return { 
            ok: true,
            redirectUrl: '/business/my-business?setup=1'
          };
        } catch (loginError) {
          // Si el auto-login falla, aún así fue registrado exitosamente
          // El usuario podrá hacer login manualmente
          return { ok: true };
        }
      } else {
        if (!payload.cedula) {
          return { ok: false, message: 'La cédula es obligatoria.' };
        }

        await registerClientRequest({
          first_name: payload.firstName.trim(),
          last_name: payload.lastName.trim(),
          email,
          password,
          phone: payload.phone.trim(),
          ci: payload.cedula.trim(),
          referral_code_used: payload.referralCode?.trim() || undefined,
        });
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'No se pudo completar el registro',
      };
    }
  };

  const requestPasswordRecovery = async (
    payload: ForgotPasswordPayload,
  ): Promise<ForgotPasswordResult> => {
    if (!payload.ci && !payload.ruc) {
      return { ok: false, message: 'Ingresa cédula o RUC.' };
    }

    try {
      const response = await forgotPasswordRequest(payload);
      return {
        ok: true,
        message: response.message,
        email: response.email,
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'No se pudo enviar el código',
      };
    }
  };

  const validateRecoveryCode = async (email: string, code: string): Promise<AuthResult> => {
    try {
      const valid = await validateResetCodeRequest(email.trim().toLowerCase(), code.trim());

      if (!valid) {
        return { ok: false, message: 'Código inválido o expirado.' };
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'No se pudo validar el código',
      };
    }
  };

  const resetPassword = async (
    email: string,
    code: string,
    newPassword: string,
  ): Promise<AuthResult> => {
    try {
      await resetPasswordRequest(email.trim().toLowerCase(), code.trim(), newPassword);
      return { ok: true };
    } catch (error) {
      const backendMessage = error instanceof Error ? error.message : '';

      if (backendMessage && isPasswordResetSuccessMessage(backendMessage)) {
        return { ok: true, message: backendMessage };
      }

      return {
        ok: false,
        message: backendMessage || 'No se pudo actualizar la contraseña',
      };
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      session,
      authToken,
      refreshSession,
      signIn,
      signOut,
      registerUser,
      requestPasswordRecovery,
      validateRecoveryCode,
      resetPassword,
    }),
    [authToken, isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
