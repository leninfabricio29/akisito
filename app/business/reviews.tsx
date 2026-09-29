import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ReviewItem } from '@/components/reviews/review-item';
import { AppText, Button, Chip, EmptyState, StackHeader } from '@/components/ui';
import { useBusiness } from '@/context/business-context';
import { usePaginated } from '@/hooks/use-paginated';
import { errorMessage, portalService } from '@/services';
import type { BusinessReview } from '@/services';
import { colors, radius, SCREEN_PADDING, spacing, typography } from '@/theme';
import { formatRating } from '@/utils/format';

export default function BusinessReviewsScreen() {
  const { business } = useBusiness();
  const [rating, setRating] = useState<number | null>(null);
  const [target, setTarget] = useState<BusinessReview | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();

  const list = usePaginated<BusinessReview>((page) => portalService.reviews(page, rating ?? undefined), [rating]);

  const openReply = (review: BusinessReview) => {
    setTarget(review);
    setReply(review.reply);
    setError(undefined);
  };

  const send = async () => {
    if (!target) return;
    setSending(true);
    setError(undefined);
    try {
      const updated = await portalService.reply(target.id, reply.trim());
      list.setItems((items) => items.map((r) => (r.id === updated.id ? updated : r)));
      setTarget(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.root}>
      <StackHeader
        title="Reseñas"
        subtitle={business ? `${formatRating(business.rating_avg)} ★ promedio · ${business.rating_count} publicadas` : undefined}
      />
      <FlatList
        data={list.items}
        keyExtractor={(r) => String(r.id)}
        ListHeaderComponent={
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="Todas" selected={rating === null} onPress={() => setRating(null)} />
            {[5, 4, 3, 2, 1].map((star) => (
              <Chip key={star} label={`${star} ★`} selected={rating === star} onPress={() => setRating(star)} />
            ))}
          </ScrollView>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <ReviewItem review={item} businessName={business?.name ?? 'tu negocio'} />
            <View style={styles.actions}>
              {item.status === 'hidden' && (
                <AppText variant="caption" color="danger" style={{ flex: 1 }}>
                  Oculta por moderación
                </AppText>
              )}
              <Pressable onPress={() => openReply(item)} hitSlop={8} style={{ marginLeft: 'auto' }}>
                <AppText variant="bodyStrong" color="primary">
                  {item.reply ? 'Editar respuesta' : 'Responder'}
                </AppText>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          list.loading ? (
            <ActivityIndicator color={colors.primary} style={{ margin: spacing.xxl }} />
          ) : list.error ? (
            <EmptyState icon="cloud-offline-outline" title="No se pudo cargar" message={list.error} actionLabel="Reintentar" onAction={list.retry} />
          ) : (
            <EmptyState icon="chatbubbles-outline" title="Aún no tienes reseñas" message="Tus clientes podrán reseñarte después de escanear tu QR." />
          )
        }
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} colors={[colors.primary]} />}
        ListFooterComponent={list.loadingMore ? <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} /> : null}
      />

      <Modal visible={!!target} transparent animationType="slide" onRequestClose={() => setTarget(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setTarget(null)} accessibilityLabel="Cerrar" />
          <View style={styles.sheet}>
            <AppText variant="h3">Responder a {target?.author}</AppText>
            {!!target?.comment && (
              <AppText color="textSecondary" numberOfLines={3} style={{ marginTop: spacing.xs }}>
                “{target.comment}”
              </AppText>
            )}
            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder="Agradece y, si algo salió mal, cuéntale cómo lo resolverás"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={1000}
              autoFocus
              style={styles.input}
            />
            {error && (
              <AppText variant="caption" color="danger" style={{ marginBottom: spacing.sm }}>
                {error}
              </AppText>
            )}
            <Button title="Publicar respuesta" icon="send" size="lg" fullWidth disabled={!reply.trim()} loading={sending} onPress={send} />
            <Button title="Cancelar" variant="ghost" fullWidth onPress={() => setTarget(null)} style={{ marginTop: spacing.xs }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  chips: { gap: spacing.sm, padding: SCREEN_PADDING },
  item: { marginHorizontal: SCREEN_PADDING, marginBottom: spacing.md },
  actions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xs, paddingTop: spacing.sm },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  input: {
    minHeight: 110,
    textAlignVertical: 'top',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
    color: colors.text,
    fontSize: typography.body.fontSize,
  },
});
