import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo } from 'react';
import { Modal, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/auth-context';
import { StatsClients, getStatsClientsRequest } from '../../services/user-service';
import { HeaderModal } from './headerModal';

type ModalStatsProps = {
  visible: boolean;
  onClose: () => void;
};

type Indicator = {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
};

const C = {
  brand: '#b82a5e',
  brandLight: '#d4547e',
  brandDark: '#8a1f46',
  brandFaint: 'rgba(184,42,94,0.08)',
  brandBorder: 'rgba(184,42,94,0.18)',
  bg: '#ffffff',
  white: '#ffffff',
  muted: '#9b8492',
  text: '#1a0f15',
  textSub: '#6b5560',
};

export default function ModalStats({ visible, onClose }: ModalStatsProps) {
  const [stats, setStats] = React.useState<StatsClients | null>(null);
  const { authToken } = useAuth();

  const indicators = useMemo<Indicator[]>(() => {
    return [
      {
        id: 'member-since',
        icon: 'calendar-outline',
        label: 'Miembro desde',
        value: stats?.user_start || '-',
      },
      {
        id: 'points',
        icon: 'sparkles-outline',
        label: 'Puntos acumulados',
        value: String(stats?.total_points ?? 0),
      },
      {
        id: 'visited',
        icon: 'location-outline',
        label: 'Visitas realizadas',
        value: String(stats?.total_visits ?? 0),
      },
      {
        id: 'redemptions',
        icon: 'gift-outline',
        label: 'Canjes realizados',
        value: String(stats?.total_redemptions ?? 0),
      },
      {
        id: 'referrals',
        icon: 'people-outline',
        label: 'Referidos',
        value: String(stats?.total_referrals ?? 0),
      },
      {
        id: 'reviews',
        icon: 'chatbubble-ellipses-outline',
        label: 'Reseñas realizadas',
        value: String(stats?.total_reviews ?? 0),
      },
    ];
  }, [stats]);


  useEffect(() => {
    if (visible) {
      fetchStats();
    }
  }, [visible]);

  const fetchStats = async () => {
    try {
      const token = authToken;
      const data = await getStatsClientsRequest(token ? token : '');
      console.log('Stats clients:', data);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.root}>
        <StatusBar barStyle="light-content" />

        <HeaderModal
          title="Mis estadísticas"
          subtitle="Revisa tu actividad y logros en la app"
          onClose={onClose}
        />

        <View style={s.body}>
          {indicators.map((item) => (
            <View key={item.id} style={s.card}>
              <View style={s.iconWrap}>
                <Ionicons name={item.icon} size={18} color={C.brand} />
              </View>

              <View style={s.info}>
                <Text style={s.label}>{item.label}</Text>
                <Text style={s.value}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f2f5' },
  body: {
    padding: 16,
    gap: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    minHeight: 120,
    alignItems: 'flex-start',
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.brandBorder,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.brandFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  label: {
    color: C.muted,
    fontSize: 10,
    marginBottom: 3,
  },
  value: {
    color: C.text,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 1,
  },
});
