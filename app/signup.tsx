// Page d'inscription (Affiche les champs de saisie pour l'inscription) 
// Renseignent email et password

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';

import { Button } from '~/components/ui/Button';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = () => {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/profile-setup',
      params: { email, password },
    });
    setLoading(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View className="flex-1 items-start justify-start bg-black px-6 pt-28">
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          className="absolute left-4 top-16 z-10">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text className="text-xl font-bold text-white">What's your email?</Text>
        <TextInput
          className="mb-4 h-12 w-full rounded-lg bg-[#E2D0D0] p-2"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text className="text-xl font-bold text-white">Create a password</Text>
        <TextInput
          className="mb-4 h-12 w-full rounded-lg bg-[#E2D0D0] p-2"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {loading ? (
          <ActivityIndicator size="small" color="#0000ff" className="mx-auto" />
        ) : (
          <Button title="Sign Up" onPress={handleSignUp} className="mx-auto mt-6" />
        )}
      </View>
    </>
  );
}
