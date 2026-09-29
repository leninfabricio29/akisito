import '@react-native-firebase/app';
import 'react-native-reanimated';

import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import PushBanner from '@/components/ui/alertPush';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { BusinessProvider } from '@/context/business-context';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = { anchor: '(tabs)' };

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};

function RootNavigator() {
  const { isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { foreground, dismiss } = usePushNotifications(Boolean(user));

  useEffect(() => {
    if (isLoading) return;
    void SplashScreen.hideAsync();

    const area: string = segments[0] ?? '';
    const inBusinessArea = area === '(business)' || area === 'business';
    if (!user) {
      if (area !== 'auth') router.replace('/auth/login');
    } else if (user.role === 'business') {
      // El negocio también usa notificaciones, su página pública (businesses/[id]) y
      // configuración/ayuda de la cuenta (profile/settings, profile/help).
      const shared = area === 'notifications' || area === 'businesses' || area === 'profile';
      if (!inBusinessArea && !shared) router.replace('/(business)');
    } else if (area === 'auth' || inBusinessArea) {
      router.replace('/(tabs)');
    }
  }, [isLoading, router, segments, user]);

  if (isLoading) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/recovery" />
        <Stack.Screen name="scanner" options={{ presentation: 'fullScreenModal', animation: 'fade_from_bottom' }} />
        <Stack.Screen name="businesses/[id]" />
        <Stack.Screen name="businesses/map" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile/redemptions" />
        <Stack.Screen name="profile/visits" />
        <Stack.Screen name="profile/favorites" />
        <Stack.Screen name="profile/stats" />
        <Stack.Screen name="profile/settings" />
        <Stack.Screen name="profile/help" />
        <Stack.Screen name="(business)" />
        <Stack.Screen name="business/validate" options={{ presentation: 'fullScreenModal', animation: 'fade_from_bottom' }} />
        <Stack.Screen name="business/reward-form" />
        <Stack.Screen name="business/redemptions" />
        <Stack.Screen name="business/reviews" />
        <Stack.Screen name="business/edit" />
        <Stack.Screen name="business/qr" />
      </Stack>
      <PushBanner
        visible={foreground.visible}
        title={foreground.title}
        body={foreground.body}
        onClose={dismiss}
        onPress={() => router.push('/notifications')}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider value={navigationTheme}>
            <BusinessProvider>
              <RootNavigator />
            </BusinessProvider>
            <StatusBar style="dark" />
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
