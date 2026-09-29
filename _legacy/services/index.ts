/**
 * Archivo central de exportaciones de servicios
 * Simplifica las importaciones en componentes
 *
 * Uso:
 * import { authService, userService } from '@/services';
 */

// Servicios
export * as advertisementsService from '@/services/modules/advertisements';
export * as authService from '@/services/modules/auth';
export * as favoritesService from '@/services/modules/favorites';
export * as notificationsService from '@/services/modules/notifications';
export * as placesService from '@/services/modules/places';
export * as pointSourcesService from '@/services/modules/point-sources';
export * as promotionsService from '@/services/modules/promotions';
export * as redemptionsService from '@/services/modules/redemptions';
export * as userService from '@/services/modules/user';
export * as visitsService from '@/services/modules/visits';

// Cliente HTTP (para uso avanzado)
export * from '@/services/http/client';

// Tipos compartidos
export * from '@/services/types/api-types';

// Configuración
export { default as API_CONFIG } from '@/services/config/api';

