/**
 * URL base de la API.
 *
 * Se configura con EXPO_PUBLIC_API_URL en el archivo .env de la app:
 *   - Emulador Android:   http://10.0.2.2:8000/api/v1
 *   - Teléfono en la LAN: http://<IP-de-tu-PC>:8000/api/v1
 *   - Producción:         https://api.akisito.com/api/v1
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://172.30.0.188:8000/api/v1').replace(/\/$/, '');

export const REQUEST_TIMEOUT_MS = 20_000;
