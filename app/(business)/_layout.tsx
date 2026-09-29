import { Tabs, useRouter } from 'expo-router';

import { TabBar, TabConfig } from '@/components/navigation/tab-bar';

const TABS: Record<string, TabConfig> = {
  index: { label: 'Inicio', icon: 'grid-outline', iconActive: 'grid' },
  rewards: { label: 'Premios', icon: 'gift-outline', iconActive: 'gift' },
  customers: { label: 'Clientes', icon: 'people-outline', iconActive: 'people' },
  account: { label: 'Mi negocio', icon: 'storefront-outline', iconActive: 'storefront' },
};

export default function BusinessTabsLayout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <TabBar
          {...props}
          tabs={TABS}
          center={{
            route: 'validate',
            label: 'Validar',
            icon: 'ticket',
            accessibilityLabel: 'Validar código de canje',
            onPress: () => router.push('/business/validate'),
          }}
        />
      )}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="rewards" options={{ title: 'Premios' }} />
      <Tabs.Screen name="validate" options={{ title: 'Validar' }} />
      <Tabs.Screen name="customers" options={{ title: 'Clientes' }} />
      <Tabs.Screen name="account" options={{ title: 'Mi negocio' }} />
    </Tabs>
  );
}
