import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, StackHeader } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/theme';

export default function BusinessMapScreen() {
  const insets = useSafeAreaInsets();
  const { lat, lng, name, address } = useLocalSearchParams<{ lat: string; lng: string; name: string; address?: string }>();
  const latitude = Number(lat);
  const longitude = Number(lng);

  const openDirections = () => {
    const destination = `${latitude},${longitude}`;
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${destination}&q=${encodeURIComponent(name ?? '')}`
        : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    void Linking.openURL(url);
  };

  const openWaze = () => {
    void Linking.openURL(`https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`);
  };

  return (
    <View style={styles.root}>
      <StackHeader title={name ?? 'Ubicación'} subtitle={address} />
      <MapView
        style={{ flex: 1 }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{ latitude, longitude, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker coordinate={{ latitude, longitude }} title={name} description={address} pinColor={colors.primary} />
      </MapView>

      <View style={[styles.panel, shadows.lg, { paddingBottom: insets.bottom + spacing.lg }]}>
        
        <View style={styles.actions}>
          <Button title="Cómo llegar" icon="navigate" size="lg" onPress={openDirections} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
  },
  place: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  pin: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
