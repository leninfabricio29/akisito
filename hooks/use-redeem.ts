import { useState } from 'react';

import { useAlert } from '@/hooks/use-alert';
import { errorMessage, rewardService } from '@/services';
import type { Redemption, Reward } from '@/services';

/**
 * Flujo de canje: confirmar → canjear → mostrar el código.
 * `onRedeemed` permite a la pantalla refrescar saldos y la lista.
 */
export function useRedeem(onRedeemed?: (reward: Reward, redemption: Redemption) => void) {
  const alert = useAlert();
  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  const [redemption, setRedemption] = useState<Redemption | null>(null);

  const redeem = (reward: Reward) => {
    alert.confirm(
      '¿Canjear recompensa?',
      `Usarás ${reward.points_required} pts de ${reward.business.name} para "${reward.title}".`,
      async () => {
        setRedeemingId(reward.id);
        try {
          const result = await rewardService.redeem(reward.id);
          setRedemption(result);
          onRedeemed?.(reward, result);
        } catch (error) {
          alert.error('No se pudo canjear', errorMessage(error));
        } finally {
          setRedeemingId(null);
        }
      },
    );
  };

  return { redeem, redeemingId, redemption, closeRedemption: () => setRedemption(null), alert };
}
