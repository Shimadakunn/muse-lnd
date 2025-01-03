// Logique de la gestion d'affichage des pages , lorsque que le user est connecté ou non

import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

import { UserProvider, useUser } from '~/contexts/UserContext';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'onboarding',
};

const AppLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

const RootLayoutNav = () => {
  const { uid } = useUser();

  useEffect(() => {
    if (!uid) {
      console.log('No user, navigating to onboarding');
      router.navigate('/onboarding');
    }
  }, [uid]);

  return <AppLayout />;
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <UserProvider>
          <RootLayoutNav />
        </UserProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
