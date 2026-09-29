import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();

  const renderTab = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    focused: boolean
  ) => {
    // Colores invertidos: blanco para foco, gris claro para no foco
    const iconColor = focused ? '#FFFFFF' : '#bcbaba';
    const borderColor = focused ? '#FFFFFF' : 'transparent';

    return (
      <View
        style={{
          width: 62,
          height: 52,
          borderStyle: 'solid',
          borderBottomColor: borderColor,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 8,
        }}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
        <Text
          style={{
            color: iconColor,
            fontSize: 10,
            fontWeight: '600',
            marginTop: 2,
          }}
        >
          {label}
        </Text>
        <View
          style={{
            position: 'absolute',
            bottom: 2,
            borderRadius: 50,
            height: 4,
            width: 4 ,
            backgroundColor: borderColor,
          }}
        />
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: insets.bottom,
          height: 55,
          borderTopEndRadius: 16,
          borderTopStartRadius: 16,
          backgroundColor: '#b82a5e', // Color morado de fondo (ajústalo a tu gusto)
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => renderTab('home', 'Inicio', focused),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ focused }) => renderTab('calendar', 'Historial', focused),
        }}
      />
      <Tabs.Screen
        name="promotions"
        options={{
          title: 'Promos',
          tabBarIcon: ({ focused }) => renderTab('gift', 'Promos', focused),
        }}
      />
      <Tabs.Screen
        name="winmore"
        options={{
          title: 'Ganar',
          tabBarIcon: ({ focused }) => renderTab('trophy', 'Gana Más', focused),
        }}
      />
    </Tabs>
  );
}