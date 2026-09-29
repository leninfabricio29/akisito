import * as Location from 'expo-location';

export type CurrentLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  isMocked: boolean;
};

export class LocationPermissionError extends Error {
  constructor() {
    super('Necesitamos tu ubicación para confirmar que estás en el negocio.');
  }
}

/** Pide permiso (si hace falta) y obtiene la ubicación precisa actual. */
export async function getCurrentLocation(): Promise<CurrentLocation> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new LocationPermissionError();

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy ?? null,
    isMocked: Boolean(position.mocked),
  };
}

/** Ubicación aproximada sin bloquear la UI; devuelve null si no hay permiso. */
export async function getApproximateLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const last = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 });
    const position = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return null;
  }
}
