import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, RatingStars } from '@/components/ui';
import { errorMessage, loyaltyService } from '@/services';
import type { MyReview } from '@/services';
import { colors, radius, spacing, typography } from '@/theme';

const LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', '¡Excelente!'];

type Props = {
  checkinId: number;
  businessName: string;
  points: number;
  initialRating?: number;
  onDone: (review: MyReview) => void;
  onSkip?: () => void;
};

/** Formulario de reseña ligado a una visita. Los puntos no dependen de la calificación. */
export function ReviewForm({ checkinId, businessName, points, initialRating = 0, onDone, onSkip }: Props) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      onDone(await loyaltyService.review(checkinId, rating, comment.trim()));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <View>
      <AppText variant="h3" align="center">
        ¿Cómo te fue en {businessName}?
      </AppText>
      <AppText color="textSecondary" align="center" style={{ marginTop: spacing.xs }}>
        {points > 0 ? `Deja tu reseña y gana +${points} pts más.` : 'Tu opinión ayuda a otros clientes.'}
      </AppText>

      <View style={styles.stars}>
        <RatingStars value={rating} size={38} onChange={setRating} />
        <AppText variant="bodyStrong" color={rating ? 'primary' : 'textMuted'} style={{ marginTop: spacing.sm }}>
          {rating ? LABELS[rating] : 'Toca las estrellas'}
        </AppText>
      </View>

      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Cuéntanos tu experiencia (opcional)"
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={1000}
        style={styles.input}
      />
      {error && (
        <AppText variant="caption" color="danger" style={{ marginBottom: spacing.sm }}>
          {error}
        </AppText>
      )}

      <Button
        title={points > 0 ? `Enviar y ganar ${points} pts` : 'Enviar reseña'}
        icon="send"
        size="lg"
        fullWidth
        disabled={!rating}
        loading={sending}
        onPress={submit}
      />
      {onSkip && <Button title="Ahora no" variant="ghost" fullWidth onPress={onSkip} style={{ marginTop: spacing.xs }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  stars: { alignItems: 'center', marginVertical: spacing.xl },
  input: {
    minHeight: 96,
    textAlignVertical: 'top',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    color: colors.text,
    fontSize: typography.body.fontSize,
    backgroundColor: colors.surface,
  },
});
