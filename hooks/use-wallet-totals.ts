import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { loyaltyService } from '@/services';
import type { Wallet } from '@/services';

export type WalletTotals = {
  points: number;
  lifetimePoints: number;
  visits: number;
  reviews: number;
  redemptions: number;
  businesses: number;
};

const EMPTY: WalletTotals = { points: 0, lifetimePoints: 0, visits: 0, reviews: 0, redemptions: 0, businesses: 0 };

/** Monederos del cliente y sus totales; se recargan al enfocar la pantalla. */
export function useWalletTotals() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [totals, setTotals] = useState<WalletTotals>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const all: Wallet[] = [];
      let page = 1;
      // Los clientes rara vez tienen más de un par de páginas de negocios.
      while (page <= 5) {
        const data = await loyaltyService.wallets(page, 50);
        all.push(...data.results);
        if (!data.next) break;
        page += 1;
      }
      setWallets(all);
      setTotals(
        all.reduce<WalletTotals>(
          (acc, w) => ({
            points: acc.points + w.points_balance,
            lifetimePoints: acc.lifetimePoints + w.lifetime_points,
            visits: acc.visits + w.checkins_count,
            reviews: acc.reviews + w.reviews_count,
            redemptions: acc.redemptions + w.redemptions_count,
            businesses: acc.businesses + 1,
          }),
          EMPTY,
        ),
      );
    } catch {
      // se conservan los datos anteriores
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { wallets, totals, loading, reload: load };
}
