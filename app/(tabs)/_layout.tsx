import { Tabs, useRouter } from 'expo-router';

import { TabBar, TabConfig } from '@/components/navigation/tab-bar';

const TABS: Record<string, TabConfig> = {
  index: { label: 'Inicio', icon: 'home-outline', iconActive: 'home' },
  rewards: { label: 'Premios', icon: 'gift-outline', iconActive: 'gift' },
  explore: { label: 'Explorar', icon: 'compass-outline', iconActive: 'compass' },
  profile: { label: 'Perfil', icon: 'person-outline', iconActive: 'person' },
};

export default function TabLayout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <TabBar
          {...props}
          tabs={TABS}
          center={{
            route: 'scan',
            label: 'Escanear',
            icon: 'scan',
            accessibilityLabel: 'Escanear QR del negocio',
            onPress: () => router.push('/scanner'),
          }}
        />
      )}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="rewards" options={{ title: 'Premios' }} />
      <Tabs.Screen name="scan" options={{ title: 'Escanear' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explorar' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
