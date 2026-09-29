import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

/** Alias para los íconos de categoría definidos en el admin que no existen en Ionicons. */
const ALIASES: Record<string, IconName> = {
  restaurant: 'restaurant',
  cafe: 'cafe',
  coffee: 'cafe',
  'wine-bar': 'wine',
  bar: 'beer',
  bakery: 'pizza',
  'ice-cream': 'ice-cream',
  spa: 'flower',
  beauty: 'cut',
  fitness: 'barbell',
  gym: 'barbell',
  store: 'storefront',
  shop: 'bag-handle',
  construct: 'construct',
  services: 'construct',
  pharmacy: 'medkit',
  pets: 'paw',
};

export function categoryIcon(icon?: string | null): IconName {
  if (!icon) return 'pricetag';
  const key = icon.trim().toLowerCase();
  if (key in Ionicons.glyphMap) return key as IconName;
  return ALIASES[key] ?? 'pricetag';
}
