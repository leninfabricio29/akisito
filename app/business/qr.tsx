import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, EmptyState, StackHeader } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { useBusiness } from '@/context/business-context';
import { useAlert } from '@/hooks/use-alert';
import { errorMessage, portalService } from '@/services';
import { API_URL } from '@/services/api/config';
import { getTokens } from '@/services/api/token-store';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';

export default function BusinessQrScreen() {
  const alert = useAlert();
  const { business, isApproved } = useBusiness();
  const [version, setVersion] = useState(0);
  const [opening, setOpening] = useState(false);
  const [rotating, setRotating] = useState(false);
  const token = getTokens()?.access;

  const openPoster = async () => {
    setOpening(true);
    try {
      const { url } = await portalService.qrPosterLink();
      await Linking.openURL(url);
    } catch (error) {
      alert.error('No se pudo abrir el afiche', errorMessage(error));
    } finally {
      setOpening(false);
    }
  };

  const rotate = () =>
    alert.show({
      type: 'confirm',
      title: '¿Regenerar el QR?',
      message: 'El QR impreso actual dejará de funcionar de inmediato. Úsalo solo si crees que alguien lo copió.',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Regenerar',
          style: 'destructive',
          onPress: async () => {
            setRotating(true);
            try {
              await portalService.rotateQr();
              setVersion((v) => v + 1);
              alert.success('QR regenerado', 'Imprime el nuevo QR y reemplaza el anterior.');
            } catch (error) {
              alert.error('No se pudo regenerar', errorMessage(error));
            } finally {
              setRotating(false);
            }
          },
        },
      ],
    });

  if (!isApproved) {
    return (
      <View style={styles.root}>
        <StackHeader title="Mi código QR" />
        <EmptyState icon="lock-closed-outline" title="Disponible al aprobar tu negocio" message="Tu QR se activa cuando validemos tu RUC." />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StackHeader title="Mi código QR" subtitle={business?.name} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.qrCard}>
          <AppText variant="h3" align="center">
            ¡Gana puntos aquí!
          </AppText>
          <AppText color="textSecondary" align="center">
            Escanea con la app Akisito
          </AppText>
          {token && (
            <Image
              key={version}
              source={{ uri: `${API_URL}/business/qr/image/?v=${version}`, headers: { Authorization: `Bearer ${token}` } }}
              style={styles.qr}
              contentFit="contain"
              cachePolicy="none"
              accessibilityLabel="Código QR del negocio"
            />
          )}
          <AppText variant="title" align="center">
            {business?.name}
          </AppText>
        </Card>

        <Button title="Imprimir o guardar PDF" icon="print-outline" size="lg" fullWidth loading={opening} onPress={openPoster} />
        <AppText variant="caption" color="textMuted" align="center">
          Se abre un afiche listo para imprimir en tu navegador (el enlace dura 10 minutos).
        </AppText>

        <Card>
          <AppText variant="title" style={{ marginBottom: spacing.sm }}>
            Consejos
          </AppText>
          {[
            'Colócalo en caja o en la entrada, a la altura de los ojos.',
            'Tus clientes solo suman puntos si están dentro del radio de tu local.',
            'Cada cliente puede sumar una vez cada pocas horas: no hace falta vigilarlo.',
          ].map((tip) => (
            <View key={tip} style={styles.tip}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <AppText color="textSecondary" style={{ flex: 1 }}>
                {tip}
              </AppText>
            </View>
          ))}
        </Card>

        <Button title="Regenerar QR" icon="refresh" variant="danger" fullWidth loading={rotating} onPress={rotate} />
      </ScrollView>
      <Alert visible={alert.visibleConfig} config={alert.config} onDismiss={alert.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: SCREEN_PADDING, gap: spacing.md, paddingBottom: spacing.xxxl },
  qrCard: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl },
  qr: { width: 250, height: 250, marginVertical: spacing.md, borderRadius: radius.md },
  tip: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginTop: spacing.xs },
});
