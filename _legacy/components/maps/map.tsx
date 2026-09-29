import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

// ── Tipos ──
type Place = {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  category?: string;
  icon?: any;
};

// ── Config iconos por categoría ──
const getPin = (cat?: string) => {
  const map: any = {
    restaurante: { icon: 'restaurant', color: '#ef4444' },
    cultura: { icon: 'library', color: '#7c3aed' },
    diversion: { icon: 'game-controller', color: '#f97316' },
    parques: { icon: 'leaf', color: '#16a34a' },
    naturaleza: { icon: 'flower', color: '#059669' },
    aventura: { icon: 'compass', color: '#0891b2' },
    bienestar: { icon: 'heart', color: '#b82a5e' },
  };
  return map[cat ?? ''] || { icon: 'location', color: '#b82a5e' };
};

// ── Decode polyline ──
const decode = (t: string) => {
  let points: any[] = [], index = 0, lat = 0, lng = 0;
  while (index < t.length) {
    let b, shift = 0, result = 0;
    do { b = t.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = result = 0;
    do { b = t.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
};

// ── Componente ──
export default function MapScreen({
  origin,
  destination,
  places = [],
  onPressGoPlace,
}: {
  origin?: any;
  destination?: any;
  places?: Place[];
  onPressGoPlace?: (place: Place) => void;
}) {
  const mapRef = useRef<MapView>(null);
  const [route, setRoute] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const region = useMemo(() => ({
    latitude: origin?.latitude || -3.99,
    longitude: origin?.longitude || -79.2,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }), [origin]);

  useEffect(() => {
    if (!origin || !destination) return setLoading(false);

    (async () => {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await res.json();
        setRoute(data.routes?.[0] ? decode(data.routes[0].overview_polyline.points) : []);
      } catch {}
      setLoading(false);
    })();
  }, [origin, destination]);

  if (loading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color="#b82a5e" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <MapView
        ref={mapRef}
        style={s.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onPress={() => setSelectedPlace(null)}
      >
        {/* Usuario */}
        {origin && (
          <Marker coordinate={origin}>
            <View style={s.user} />
          </Marker>
        )}

        {/* Destino */}
        {destination && (
          <Marker coordinate={destination}>
            <Ionicons name="flag" size={20} color="#000" />
          </Marker>
        )}

        {/* Lugares */}
        {places.map(p => {
          const cfg = getPin(p.category);
          return (
            <Marker
              key={p.id}
              coordinate={p}
              onPress={() => setSelectedPlace(p)}
            >
              <View style={[s.pin, { backgroundColor: cfg.color }]}>
                <Ionicons name={p.icon ?? cfg.icon} size={16} color="#fff" />
              </View>
            </Marker>
          );
        })}

        {/* Ruta */}
        {route.length > 0 && (
          <Polyline coordinates={route} strokeWidth={4} strokeColor="#b82a5e" />
        )}
      </MapView>

      {selectedPlace ? (
        <View style={s.cardWrap} pointerEvents="auto">
          <View style={s.card}>
            <Text style={s.cardTitle} numberOfLines={1}>{selectedPlace.name}</Text>
            <TouchableOpacity
              style={s.goBtn}
              onPress={() => onPressGoPlace?.(selectedPlace)}
            >
              <Text style={s.goBtnText}>Ir</Text>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ── Styles ──
const s = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  user: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#b82a5e',
  },
  pin: {
    padding: 8,
    borderRadius: 20,
  },
  cardWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(184,42,94,0.18)',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    flexShrink: 1,
    color: '#1a0f15',
    fontSize: 14,
    fontWeight: '700',
  },
  goBtn: {
    minWidth: 66,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#8a1f46',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export type { Place };

