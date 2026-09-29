import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { portalService } from '@/services';
import type { OwnBusiness } from '@/services';

type BusinessContextValue = {
  business: OwnBusiness | null;
  loading: boolean;
  isApproved: boolean;
  reload: () => Promise<void>;
  setBusiness: (business: OwnBusiness) => void;
};

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

/** Perfil del negocio del usuario con rol negocio (no hace nada para clientes). */
export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user, isBusiness } = useAuth();
  const [business, setBusiness] = useState<OwnBusiness | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!isBusiness) return;
    setLoading(true);
    try {
      setBusiness(await portalService.get());
    } catch {
      // se conserva lo último cargado
    } finally {
      setLoading(false);
    }
  }, [isBusiness]);

  useEffect(() => {
    if (isBusiness) void reload();
    else setBusiness(null);
  }, [isBusiness, reload, user?.id]);

  const value = useMemo<BusinessContextValue>(
    () => ({
      business,
      loading,
      isApproved: (business?.status ?? user?.business?.status) === 'approved',
      reload,
      setBusiness,
    }),
    [business, loading, reload, user?.business?.status],
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness debe usarse dentro de BusinessProvider');
  return context;
}
