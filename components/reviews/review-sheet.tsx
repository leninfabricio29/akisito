import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import type { MyReview } from '@/services';
import { colors, radius, spacing } from '@/theme';

import { ReviewForm } from './review-form';

type Props = {
  target: { checkinId: number; businessName: string; points: number } | null;
  onClose: () => void;
  onDone: (review: MyReview) => void;
};

/** Hoja inferior con el formulario de reseña (desde el historial de visitas). */
export function ReviewSheet({ target, onClose, onDone }: Props) {
  return (
    <Modal visible={!!target} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {target && (
            <ReviewForm
              checkinId={target.checkinId}
              businessName={target.businessName}
              points={target.points}
              onDone={onDone}
              onSkip={onClose}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
});
