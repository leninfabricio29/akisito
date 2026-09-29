import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_KEY = 'akisito.access';
const REFRESH_KEY = 'akisito.refresh';

export type Tokens = { access: string; refresh: string };

let current: Tokens | null = null;
let onExpired: (() => void) | null = null;

/** Guarda los tokens en memoria y en el dispositivo. */
export async function setTokens(tokens: Tokens | null): Promise<void> {
  current = tokens;
  if (tokens) {
    await AsyncStorage.multiSet([
      [ACCESS_KEY, tokens.access],
      [REFRESH_KEY, tokens.refresh],
    ]);
  } else {
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
  }
}

export async function loadTokens(): Promise<Tokens | null> {
  const [[, access], [, refresh]] = await AsyncStorage.multiGet([ACCESS_KEY, REFRESH_KEY]);
  current = access && refresh ? { access, refresh } : null;
  return current;
}

export function getTokens(): Tokens | null {
  return current;
}

/** El contexto de sesión se suscribe para cerrar sesión si el refresh deja de ser válido. */
export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onExpired = handler;
}

export function notifySessionExpired(): void {
  onExpired?.();
}
