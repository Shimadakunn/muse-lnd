// Page de setup de profil (Affiche les champs de saisie pour le profil)
// Renseignent photo de profil, username et role

import { Ionicons, AntDesign } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { ImagePickerAsset } from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';

import { Button } from '~/components/ui/Button';
import { storage } from '~/utils/firebase';

export default function ProfileSetup() {
  const { email, password } = useLocalSearchParams();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('artist');
  const [loading, setLoading] = useState(false);
  const [imageUpload, setImageUpload] = useState<ImagePickerAsset | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
    });

    if (!result.canceled) {
      setImageUpload(result.assets[0]);
    }
  };

  const uploadFile = async (user: User) => {
    if (imageUpload === null) {
      throw new Error('Please select a profile picture');
    }

    try {
      const imageRef = ref(storage, `profilePictures/${user.uid}`);

      const response = await fetch(imageUpload.uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      const uploadTask = await uploadBytes(imageRef, blob);
      const url = await getDownloadURL(uploadTask.ref);
      return url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload profile picture. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!username) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth();
      let user;

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email as string,
          password as string
        );
        user = userCredential.user;
        console.log('User created:', user);
      } catch (error) {
        if (error instanceof FirebaseError) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          console.error('Firebase Auth Error:', error.code, error.message);
          Alert.alert('Authentication Error', error.message);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          console.error('Unknown Auth Error:', error);
          Alert.alert('Authentication Error', 'An unknown error occurred during authentication.');
        }
        return;
      }

      if (!user) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        throw new Error('No authenticated user found');
      }

      let profilePictureUrl = '';

      if (imageUpload) {
        console.log('Uploading profile picture');
        try {
          profilePictureUrl = await uploadFile(user);
        } catch (error) {
          console.error('Error uploading profile picture:', error);
          Alert.alert('Error', (error as Error).message);
          return;
        }
      }

      try {
        const db = getFirestore();
        await setDoc(doc(db, 'users', user.uid), {
          username,
          role,
          email: user.email,
          profilePicture_url: profilePictureUrl,
        });
      } catch (error) {
        console.error('Firestore Error:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', 'Failed to save user data. Please try again.');
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/swipe');
    } catch (error) {
      console.error('Profile setup error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = (role: string) => {
    setRole(role);
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
        <Text className="text-xl font-bold text-white">Profile picture</Text>
        {imageUpload ? (
          <Image
            source={{ uri: imageUpload.uri }}
            className="mx-auto aspect-square w-36 rounded-full"
          />
        ) : (
          <TouchableOpacity
            onPress={pickImage}
            className="mx-auto flex aspect-square w-36 items-center justify-center rounded-full bg-[#E2D0D0]">
            <AntDesign name="plus" size={32} color="black" />
          </TouchableOpacity>
        )}
        <Text className="text-xl font-bold text-white">Username</Text>
        <TextInput
          className="mb-4 h-12 w-full rounded-lg bg-[#E2D0D0] p-2"
          value={username}
          onChangeText={setUsername}
        />
        <Text className="text-xl font-bold text-white">Role</Text>
        <View className="mb-8 flex w-full px-4">
          <TouchableOpacity
            onPress={() => handleRoleSelection('artist')}
            className="mb-2 flex-row items-center">
            <View
              className={`mr-2 h-5 w-5 rounded-full border-2 border-white ${
                role === 'artist' ? 'bg-white' : 'bg-transparent'
              }`}
            />
            <Text className="text-white">Artist</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRoleSelection('beatmaker')}
            className="flex-row items-center">
            <View
              className={`mr-2 h-5 w-5 rounded-full border-2 border-white ${
                role === 'beatmaker' ? 'bg-white' : 'bg-transparent'
              }`}
            />
            <Text className="text-white">Beatmaker</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color="#0000ff" className="mx-auto" />
        ) : (
          <Button title="Complete Setup" onPress={handleSubmit} className=" mx-auto" />
        )}
      </View>
    </>
  );
}
