import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import type { BusinessDetail } from '@/services';
import { colors, radius, spacing } from '@/theme';
import { categoryIcon } from '@/utils/category-icon';

type Props = { business: BusinessDetail; onOpenMap: () => void };

function Row({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="caption" color="textMuted">
          {label}
        </AppText>
        <AppText variant="body" color={onPress ? 'primary' : 'text'}>
          {value}
        </AppText>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

export function BusinessInfo({ business, onOpenMap }: Props) {
  const website = business.website ? business.website.replace(/^https?:\/\//, '') : '';

  return (
    <View style={{ gap: spacing.md }}>
      <Card style={styles.program}>
        <AppText variant="title" color="primary">
          Programa de puntos
        </AppText>
        <View style={styles.programRow}>
          <View style={styles.programItem}>
            <Ionicons name="qr-code" size={22} color={colors.primary} />
            <AppText variant="h3">+{business.checkin_points}</AppText>
            <AppText variant="caption" color="textSecondary">
              por visita
            </AppText>
          </View>
          <View style={styles.programDivider} />
          <View style={styles.programItem}>
            <Ionicons name="star" size={22} color={colors.accent} />
            <AppText variant="h3">+{business.review_points}</AppText>
            <AppText variant="caption" color="textSecondary">
              por reseña
            </AppText>
          </View>
          {business.my_points !== null && (
            <>
              <View style={styles.programDivider} />
              <View style={styles.programItem}>
                <Ionicons name="wallet" size={22} color={colors.success} />
                <AppText variant="h3">{business.my_points}</AppText>
                <AppText variant="caption" color="textSecondary">
                  tus puntos
                </AppText>
              </View>
            </>
          )}
        </View>
      </Card>

      {!!business.description && (
        <Card>
          <AppText variant="title" style={{ marginBottom: spacing.xs }}>
            Sobre nosotros
          </AppText>
          <AppText color="textSecondary">{business.description}</AppText>
        </Card>
      )}

      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        <Row icon="location-outline" label="Dirección" value={business.address} />
        {!!business.schedule && <Row icon="time-outline" label="Horario" value={business.schedule} />}
        <Row icon={categoryIcon(business.category.icon)} label="Categoría" value={business.category.name} />
        {!!business.phone && (
          <Row icon="call-outline" label="Teléfono" value={business.phone} onPress={() => Linking.openURL(`tel:${business.phone}`)} />
        )}
        {!!website && (
          <Row icon="globe-outline" label="Sitio web" value={website} onPress={() => Linking.openURL(business.website)} />
        )}
      </Card>

      <Button title="Ver en mapa" icon="map" size="lg" fullWidth onPress={onOpenMap} />

      {business.images.length > 1 && (
        <View>
          <AppText variant="title" style={{ marginBottom: spacing.sm }}>
            Fotos
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {business.images.map((img) => (
              <Image key={img.id} source={{ uri: img.image }} style={styles.photo} contentFit="cover" transition={150} />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  program: { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
  programRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  programItem: { flex: 1, alignItems: 'center', gap: 2 },
  programDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.primaryBorder },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: 140, height: 100, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
});
