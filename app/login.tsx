// Page de connexion + gestion de l'authentification 

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { View, Text, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';

import { Button } from '~/components/ui/Button';
import { auth } from '~/utils/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('Logged in successfully');
      router.replace('/swipe');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to log in. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
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
        <Text className="text-xl font-bold text-white">Input your password</Text>
        <TextInput
          className="mb-4 h-12 w-full rounded-lg bg-[#E2D0D0] p-2"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {loading ? (
          <ActivityIndicator size="small" color="#0000ff" className="mx-auto" />
        ) : (
          <Button title="Log In" onPress={handleLogin} className="mx-auto mt-6" />
        )}
      </View>
    </>
  );
}
