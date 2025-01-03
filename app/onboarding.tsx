// Page d'onboarding (Affiche les boutons de connexion et d'inscription)

import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import React from 'react';
import { View, Text } from 'react-native';

import { Button } from '~/components/ui/Button';
import { useUser } from '~/contexts/UserContext';

export default function Onboarding() {
  const { request, promptAsync } = useUser();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View className="flex h-full items-center justify-center bg-black px-8">
        <Text className="mb-6 text-5xl font-black text-white">Muse</Text>
        <Button
          title="Sign Up"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/signup');
          }}
          className="mb-4 w-full"
          textClassName="text-white"
        />
        <Button
          title="Google Sign In"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            promptAsync();
          }}
          className="mb-4 w-full"
          textClassName="text-white"
          disabled={!request}
        />
        <Button
          title="Login"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/login');
          }}
          className="bg-transparent"
          textClassName="text-gray-100"
        />
      </View>
    </>
  );
}
