import HeaderFirstComponent from '@/components/client/header';
import { useAuth } from '@/context/auth-context';
import {
  NotificationItem,
  NotificationType,
  getMyNotificationsRequest,
  markNotificationAsReadRequest,
} from '@/services/notification-service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ── Palette ──────────────────────────────────────────────
const C = {
  brand: '#b82a5e',
  brandLight: '#d4547e',
  brandDark: '#8a1f46',
  brandFaint: 'rgba(184,42,94,0.07)',
  brandBorder: 'rgba(184,42,94,0.18)',
  bg: '#ffffff',
  surfaceGray: '#f7f2f5',
  surfaceBorder: '#ede5ea',
  white: '#ffffff',
  muted: '#9b8492',
  mutedLight: '#c5b5be',
  text: '#1a0f15',
  textSub: '#6b5560',
  gold: '#f5a623',
  goldFaint: 'rgba(245,166,35,0.08)',
  goldBorder: 'rgba(245,166,35,0.25)',
  green: '#2da06e',
  greenFaint: 'rgba(45,160,110,0.08)',
  greenBorder: 'rgba(45,160,110,0.22)',
  purple: '#7c3aed',
  purpleFaint: 'rgba(124,58,237,0.07)',
  purpleBorder: 'rgba(124,58,237,0.2)',
  blue: '#0891b2',
  blueFaint: 'rgba(8,145,178,0.07)',
  blueBorder: 'rgba(8,145,178,0.2)',
  unreadDot: '#b82a5e',
};

type NotifType = NotificationType;

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  createdAt: string;
}

function formatRelativeTime(isoDate: string): string {
  const createdAt = new Date(isoDate);
  if (Number.isNaN(createdAt.getTime())) {
    return 'Ahora';
  }

  const diffMs = Date.now() - createdAt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Ahora';
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'ayer';

  return createdAt.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
}

function getDateGroupLabel(isoDate: string): 'hace poco' | 'ayer' | 'anteriores' {
  const createdAt = new Date(isoDate);
  if (Number.isNaN(createdAt.getTime())) {
    return 'anteriores';
  }

  const diffMs = Date.now() - createdAt.getTime();
  const diffHours = diffMs / 3600000;

  if (diffHours < 24) return 'hace poco';
  if (diffHours < 48) return 'ayer';
  return 'anteriores';
}

function mapNotificationToCard(item: NotificationItem): Notif {
  return {
    id: item._id,
    type: item.type,
    title: item.title,
    body: item.description || 'Sin descripción',
    time: formatRelativeTime(item.createdAt),
    read: item.status === 'read',
    createdAt: item.createdAt,
  };
}

// ── Type config ───────────────────────────────────────────
const DEFAULT_CONFIG = { icon: 'bell', bg: C.brandFaint, border: C.brandBorder, iconColor: C.brand, label: 'Notificación' };

const TYPE_CONFIG: Record<
  NotifType,
  { icon: string; bg: string; border: string; iconColor: string; label: string }
> = {
  promotion: { icon: 'gift',           bg: C.brandFaint,  border: C.brandBorder,  iconColor: C.brand,  label: 'Promo'    },
  points: { icon: 'star',              bg: C.goldFaint,   border: C.goldBorder,   iconColor: C.gold,   label: 'Puntos'   },
  social: { icon: 'people',            bg: C.purpleFaint, border: C.purpleBorder, iconColor: C.purple, label: 'Social'   },
};

const FILTERS: { id: string; label: string }[] = [
  { id: 'all',    label: 'Todas'   },
  { id: 'unread', label: 'No leídas' },
  { id: 'promotion',  label: 'Promos'  },
  { id: 'points', label: 'Puntos'  },
  { id: 'social', label: 'Social' },
];

// ── Notification Card ─────────────────────────────────────
function NotifCard({
  notif,
  onRead,
}: {
  notif: Notif;
  onRead: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[notif.type] ?? DEFAULT_CONFIG;

  return (
    <TouchableOpacity
      style={[n.card, !notif.read && n.cardUnread]}
      activeOpacity={0.78}
      onPress={() => onRead(notif.id)}
    >

      {/* Unread accent bar */}
      {!notif.read && <View style={n.accentBar} />}

      {/* Icon */}
      <View style={[n.iconWrap, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
        <Ionicons name={cfg.icon as any} size={18} color={cfg.iconColor} />
      </View>

      {/* Content */}
      <View style={n.content}>
        <View style={n.topRow}>
          <Text style={[n.title, !notif.read && n.titleUnread]} numberOfLines={1}>
            {notif.title}
          </Text>
          {!notif.read && <View style={n.unreadDot} />}
        </View>

        <Text style={n.body} numberOfLines={2}>{notif.body}</Text>

        <View style={n.bottomRow}>
          <View style={[n.typePill, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <Text style={[n.typePillText, { color: cfg.iconColor }]}>{cfg.label}</Text>
          </View>
          <Text style={n.time}>{notif.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const n = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 18,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#1a0f15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardUnread: {
    borderColor: C.brandBorder,
    backgroundColor: '#fff9fb',
    shadowColor: C.brand,
    shadowOpacity: 0.07,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: C.brand,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
    flexShrink: 0,
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  content: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    flex: 1,
    color: C.textSub,
    fontSize: 13,
    fontWeight: '700',
  },
  titleUnread: { color: C.text },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.brand,
    flexShrink: 0,
  },
  body: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  typePillText: { fontSize: 10, fontWeight: '700' },
  time: { color: C.mutedLight, fontSize: 11, flex: 1 },
});

// ── Empty state ───────────────────────────────────────────
function EmptyState({ filter }: { filter: string }) {
  return (
    <View style={e.wrap}>
      <View style={e.iconWrap}>
        <Ionicons name="notifications-off-outline" size={40} color={C.mutedLight} />
      </View>
      <Text style={e.title}>
        {filter === 'unread' ? 'Todo al día' : 'Sin notificaciones'}
      </Text>
      <Text style={e.sub}>
        {filter === 'unread'
          ? 'No tienes notificaciones pendientes.'
          : 'Aquí aparecerán tus alertas, puntos y novedades.'}
      </Text>
    </View>
  );
}

const e = StyleSheet.create({
  wrap:     { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.surfaceGray, borderWidth: 1, borderColor: C.surfaceBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { color: C.text, fontSize: 17, fontWeight: '800', marginBottom: 6 },
  sub:   { color: C.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});

// ── Main Screen ───────────────────────────────────────────
export default function NotificationsScreen() {
  const { authToken } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [activeFilter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!authToken) {
        setNotifs([]);
        return;
      }

      try {
        const response = await getMyNotificationsRequest(authToken);
        setNotifs(response.items.map(mapNotificationToCard));
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [authToken]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const filtered = notifs.filter((n) => {
    if (activeFilter === 'all')    return true;
    if (activeFilter === 'unread') return !n.read;
    return n.type === activeFilter;
  });

  const groupedNotifications = useMemo(() => {
    const groups: Record<'hace poco' | 'ayer' | 'anteriores', Notif[]> = {
      'hace poco': [],
      ayer: [],
      anteriores: [],
    };

    filtered.forEach((item) => {
      groups[getDateGroupLabel(item.createdAt)].push(item);
    });

    return groups;
  }, [filtered]);

  const handleRead = async (id: string) => {
    const selected = notifs.find((item) => item.id === id);
    if (!selected || selected.read) {
      return;
    }

    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

    if (!authToken) {
      return;
    }

    try {
      await markNotificationAsReadRequest(authToken, id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      <HeaderFirstComponent title="Notificaciones" subtitle={unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
        backButtonProps={{ onPress: () => router.back() }}
      />

      

      

      {/* ── Filters ── */}
      <View style={s.filtersWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filtersScroll}
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f.id;
            const count  = f.id === 'unread'
              ? unreadCount
              : f.id === 'all'
              ? notifs.length
              : notifs.filter((n) => n.type === f.id).length;

            return (
              <TouchableOpacity
                key={f.id}
                style={[s.filterPill, active && s.filterPillActive]}
                onPress={() => setFilter(f.id)}
              >
                <Text style={[s.filterText, active && s.filterTextActive]}>
                  {f.label}
                </Text>
                {count > 0 && (
                  <View style={[s.filterBadge, active && s.filterBadgeActive]}>
                    <Text style={[s.filterBadgeText, active && s.filterBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── List ── */}
      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          <>
            {/* Date group separators */}
            {(['hace poco', 'ayer', 'anteriores'] as const).map((group) => {
              const items = groupedNotifications[group];
              if (items.length === 0) return null;
              return (
                <View key={group}>
                  <View style={s.groupHeader}>
                    <Text style={s.groupLabel}>{group.toUpperCase()}</Text>
                    <View style={s.groupLine} />
                  </View>
                  {items.map((notif) => (
                    <NotifCard
                      key={notif.id}
                      notif={notif}
                      onRead={handleRead}
                    />
                  ))}
                </View>
              );
            })}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* Header */
  header: {
    paddingTop: Platform.select({ ios: 60, android: 44, default: 44 }),
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
    gap: 14,
  },
  circle1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -60,
  },
  circle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { color: C.white, fontSize: 24, fontWeight: '900', letterSpacing: -0.4 },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  markAllText: { color: C.white, fontSize: 12, fontWeight: '700' },

  /* Summary row */
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryPill: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    gap: 3,
  },
  summaryVal:   { color: C.white, fontSize: 16, fontWeight: '900' },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  /* Filters */
  filtersWrap: {
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceBorder,
    backgroundColor: C.white,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.surfaceGray,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    flexShrink: 0,
  },
  filterPillActive:  { backgroundColor: C.brand, borderColor: C.brand },
  filterText:        { color: C.muted, fontSize: 13, fontWeight: '600' },
  filterTextActive:  { color: C.white },
  filterBadge: {
    backgroundColor: C.surfaceBorder,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
  },
  filterBadgeActive:     { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterBadgeText:       { color: C.muted, fontSize: 10, fontWeight: '800' },
  filterBadgeTextActive: { color: C.white },

  /* List */
  list:        { flex: 1, backgroundColor: C.surfaceGray },
  listContent: { padding: 16, paddingTop: 12 },

  /* Group headers */
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    marginTop: 6,
  },
  groupLabel: {
    color: C.mutedLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  groupLine: { flex: 1, height: 1, backgroundColor: C.surfaceBorder },
});