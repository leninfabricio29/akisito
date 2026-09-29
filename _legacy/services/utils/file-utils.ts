/**
 * Utilidades para manejar archivos y FormData
 */

/**
 * Obtiene el tipo MIME de un archivo basado en su extensión
 */
function getMimeType(uri: string): string {
  const ext = uri.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Construye FormData para envío de lugar con imágenes
 * @param data - Datos del lugar
 * @param imageUris - Array de URIs de imágenes locales
 * @returns FormData
 */
export function buildPlaceFormData(
  data: Record<string, any>,
  imageUris: string[],
): any {
  const formData = new FormData() as any;

  // Agregar datos de texto
  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (value !== undefined && value !== null && key !== 'images') {
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  // Agregar imágenes directamente con uri, type y name
  imageUris.forEach((uri, index) => {
    formData.append('images', {
      uri,
      type: getMimeType(uri),
      name: `image_${index}.jpg`,
    });
  });

  return formData;
}

/**
 * Construye FormData para envío de promoción con imagen
 * @param data - Datos de la promoción
 * @param imageUri - URI de la imagen local
 * @returns any
 */
export function buildPromotionFormData(
  data: Record<string, any>,
  imageUri: string,
): any {
  const formData = new FormData() as any;

  // Agregar datos de texto
  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (value !== undefined && value !== null && key !== 'image') {
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  // Agregar imagen directamente con uri, type y name
  formData.append('image', {
    uri: imageUri,
    type: getMimeType(imageUri),
    name: 'promotion.jpg',
  });

  return formData;
}
