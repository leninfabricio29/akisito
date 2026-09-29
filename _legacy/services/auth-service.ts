/**
 * ⚠️ COMPATIBILIDAD: Este archivo es un wrapper
 * Usa los módulos refactorizados en services/modules/
 * 
 * Migra a:
 * import * as authService from '@/services/modules/auth';
 * o
 * import { authService } from '@/services';
 */

export * from '@/services/modules/auth';

