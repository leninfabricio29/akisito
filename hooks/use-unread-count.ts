import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { notificationService } from '@/services';

/** Número de notificaciones sin leer; se refresca cada vez que la pantalla gana foco. */
export function useUnreadCount() {
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      notificationService
        .unreadCount()
        .then((r) => active && setCount(r.count))
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, []),
  );

  return count;
}
