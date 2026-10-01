import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { MyReview } from '@/services';

import { ReviewForm } from './review-form';

type Props = {
  target: { checkinId: number; businessName: string; points: number } | null;
  onClose: () => void;
  onDone: (review: MyReview) => void;
};

/** Hoja inferior con el formulario de reseña (desde el historial de visitas). */
export function ReviewSheet({ target, onClose, onDone }: Props) {
  return (
    <BottomSheet visible={!!target} onClose={onClose}>
      {target && (
        <ReviewForm
          checkinId={target.checkinId}
          businessName={target.businessName}
          points={target.points}
          onDone={onDone}
          onSkip={onClose}
        />
      )}
    </BottomSheet>
  );
}
