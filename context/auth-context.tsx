import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getPushToken } from '@/hooks/use-push-notifications';
import { ApiError, authService, notificationService } from '@/services';
import type { AuthResponse, RegisterBusinessInput, RegisterClientInput, User } from '@/services';
import { loadTokens, setSessionExpiredHandler, setTokens } from '@/services/api/token-store';

const USER_KEY = 'akisito.user';

type AuthContextValue = {
  isLoading: boolean;
  user: User | null;
  isClient: boolean;
  isBusiness: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  registerClient: (input: RegisterClientInput) => Promise<User>;
  registerBusiness: (input: RegisterBusinessInput) => Promise<User>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUserState] = useState<User | null>(null);

  const setUser = useCallback((next: User | null) => {
    setUserState(next);
    void (next ? AsyncStorage.setItem(USER_KEY, JSON.stringify(next)) : AsyncStorage.removeItem(USER_KEY));
  }, []);

  const clearSession = useCallback(async () => {
    await setTokens(null);
    setUser(null);
  }, [setUser]);

  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    return () => setSessionExpiredHandler(null);
  }, [setUser]);

  useEffect(() => {
    (async () => {
      try {
        const tokens = await loadTokens();
        if (!tokens) return;
        const cached = await AsyncStorage.getItem(USER_KEY);
        if (cached) setUserState(JSON.parse(cached) as User);
        try {
          setUser(await authService.me());
        } catch (error) {
          // Sin conexión: se mantiene el usuario guardado. Token inválido: se cierra la sesión.
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) await clearSession();
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [clearSession, setUser]);

  const startSession = useCallback(
    async (response: AuthResponse) => {
      await setTokens({ access: response.access, refresh: response.refresh });
      setUser(response.user);
      return response.user;
    },
    [setUser],
  );

  const signIn = useCallback(
    async (email: string, password: string) => startSession(await authService.login(email, password)),
    [startSession],
  );

  const registerClient = useCallback(
    async (input: RegisterClientInput) => startSession(await authService.registerClient(input)),
    [startSession],
  );

  const registerBusiness = useCallback(
    async (input: RegisterBusinessInput) => startSession(await authService.registerBusiness(input)),
    [startSession],
  );

  const signOut = useCallback(async () => {
    const pushToken = getPushToken();
    if (pushToken) {
      await notificationService.unregisterDevice(pushToken).catch(() => undefined);
    }
    await clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    setUser(await authService.me());
  }, [setUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      user,
      isClient: user?.role === 'client',
      isBusiness: user?.role === 'business',
      signIn,
      registerClient,
      registerBusiness,
      signOut,
      refreshUser,
      setUser,
    }),
    [isLoading, user, signIn, registerClient, registerBusiness, signOut, refreshUser, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
