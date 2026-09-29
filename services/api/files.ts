/** Convierte una imagen local (uri del selector) en un archivo para FormData en React Native. */
export function imageFile(uri: string): Blob {
  const name = uri.split('/').pop()?.split('?')[0] || 'imagen.jpg';
  const lower = name.toLowerCase();
  const type = lower.endsWith('.png') ? 'image/png' : lower.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  return { uri, name, type } as unknown as Blob;
}

/** Arma un FormData omitiendo valores undefined; null se envía vacío (el backend lo interpreta como null). */
export function toFormData(values: Record<string, string | number | boolean | null | undefined>, files: Record<string, string | undefined> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    form.append(key, value === null ? '' : String(value));
  }
  for (const [key, uri] of Object.entries(files)) {
    if (uri) form.append(key, imageFile(uri));
  }
  return form;
}
