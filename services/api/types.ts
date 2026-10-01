/**
 * Tipos de la API v1 (espejo de los serializers de api_akisito).
 * Los DecimalField llegan como string (p. ej. rating_avg: "4.50").
 */

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type UserRole = 'client' | 'business' | 'admin';
export type BusinessStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type OnboardingStep = 'profile' | 'business';

export type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  ci: string | null;
  birth_date: string | null;
  avatar: string | null;
  role: UserRole;
  business: { id: number; name: string; status: BusinessStatus } | null;
  /** Pasos que la app obliga a completar tras registrarse (vacío = perfil completo). */
  pending_steps: OnboardingStep[];
  created_at: string;
};

export type AuthResponse = { access: string; refresh: string; user: User };

export type Category = { id: number; name: string; icon: string };

export type BusinessSummary = {
  id: number;
  name: string;
  category: Category;
  logo: string | null;
  cover: string | null;
  address: string;
  latitude: string;
  longitude: string;
  rating_avg: string;
  rating_count: number;
  checkin_points: number;
  distance_m: number | null;
  is_favorite: boolean;
  my_points: number | null;
};

export type BusinessDetail = BusinessSummary & {
  description: string;
  review_points: number;
};

export type Favorite = { id: number; business: BusinessSummary; created_at: string };

export type PublicReview = {
  id: number;
  author: string;
  avatar: string | null;
  rating: number;
  comment: string;
  reply: string;
  replied_at: string | null;
  created_at: string;
};

export type ReviewSummary = { rating_avg: string; rating_count: number; breakdown: Record<string, number> };

export type BusinessReviewsPage = Paginated<PublicReview> & { summary: ReviewSummary };

export type MyReview = {
  id: number;
  business: { id: number; name: string };
  checkin: number;
  rating: number;
  comment: string;
  points_awarded: number;
  status: 'published' | 'hidden';
  reply: string;
  created_at: string;
};

export type MiniBusiness = { id: number; name: string; logo: string | null };

export type CheckIn = {
  id: number;
  business: MiniBusiness;
  points_awarded: number;
  created_at: string;
  review_deadline: string | null;
  has_review: boolean;
  can_review: boolean;
  review_points: number;
};

export type ScanResult = {
  checkin: { id: number; created_at: string };
  business: MiniBusiness;
  points_earned: number;
  balance: number;
  visits: number;
  review: { available: boolean; points: number; deadline: string };
};

export type Wallet = {
  business: MiniBusiness & { category: string };
  points_balance: number;
  lifetime_points: number;
  checkins_count: number;
  reviews_count: number;
  redemptions_count: number;
  first_checkin_at: string | null;
  last_checkin_at: string | null;
  redeemable_rewards: number | null;
  next_reward: { id: number; title: string; points_required: number; points_missing: number } | null;
};

export type PointTransaction = {
  id: number;
  kind: 'checkin' | 'review' | 'redemption' | 'refund' | 'adjustment' | 'expiration';
  kind_label: string;
  points: number;
  balance_after: number;
  description: string;
  created_at: string;
};

export type Reward = {
  id: number;
  business: MiniBusiness;
  title: string;
  description: string;
  image: string | null;
  points_required: number;
  starts_at: string;
  ends_at: string | null;
  max_per_client: number | null;
  stock_left: number | null;
  my_points: number | null;
  can_redeem: boolean;
};

export type RedemptionStatus = 'pending' | 'validated' | 'expired' | 'cancelled';

export type Redemption = {
  id: number;
  code: string;
  reward: { id: number; title: string; image: string | null };
  business: { id: number; name: string };
  points_spent: number;
  status: RedemptionStatus;
  status_label: string;
  expires_at: string;
  validated_at: string | null;
  created_at: string;
};

export type NotificationKind = 'points' | 'reward' | 'redemption' | 'review' | 'winback' | 'business' | 'new_business' | 'system';

export type AppNotification = {
  id: number;
  kind: NotificationKind;
  title: string;
  body: string;
  data: { business_id?: number; reward_id?: number; redemption_id?: number; review_id?: number; checkin_id?: number };
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type Banner = { id: number; title: string; image: string; business: number | null; link_url: string };

// ─── Portal del negocio ────────────────────────────────────────────────────────

export type OwnBusiness = {
  id: number;
  name: string;
  ruc: string;
  taxpayer_type: 'natural' | 'private' | 'public';
  category: number;
  description: string;
  logo: string | null;
  cover: string | null;
  address: string;
  latitude: string;
  longitude: string;
  /** Aprobado: la ubicación ya no se puede cambiar desde la app. */
  location_locked: boolean;
  status: BusinessStatus;
  status_reason: string;
  checkin_points: number | null;
  review_points: number | null;
  checkin_radius_m: number | null;
  effective_rules: { checkin_points: number; review_points: number; checkin_radius_m: number };
  rating_avg: string;
  rating_count: number;
  created_at: string;
};

export type OwnReward = {
  id: number;
  title: string;
  description: string;
  image: string | null;
  points_required: number;
  starts_at: string;
  ends_at: string | null;
  max_per_client: number | null;
  stock: number | null;
  stock_left: number | null;
  redeemed_count: number;
  is_active: boolean;
  created_at: string;
};

export type BusinessRedemption = Redemption & { client: { id: number; name: string } };

export type BusinessReview = PublicReview & { status: 'published' | 'hidden' };

export type CustomerSegment = 'new' | 'frequent' | 'at_risk' | 'inactive';

export type Customer = {
  id: number;
  client: { id: number; name: string; avatar: string | null };
  points_balance: number;
  lifetime_points: number;
  checkins_count: number;
  reviews_count: number;
  redemptions_count: number;
  first_checkin_at: string | null;
  last_checkin_at: string | null;
};

type Metric = { value: number; previous: number; change_pct: number | null };

export type StatsPeriod = 'week' | 'month' | 'year';

export type BusinessStats = {
  period: StatsPeriod;
  start: string;
  end: string;
  visits: Metric;
  unique_clients: Metric;
  new_clients: number;
  returning_clients: number;
  repeat_rate_pct: number;
  visits_per_client: number;
  reviews: { count: number; rating_avg: number };
  redemptions: Metric;
  points: { issued: number; redeemed: number; outstanding: number };
  segments: Record<CustomerSegment, number>;
  series: { date: string; visits: number; clients: number }[];
  by_hour: { hour: number; visits: number }[];
  top_clients: { id: number; name: string; visits: number }[];
};
