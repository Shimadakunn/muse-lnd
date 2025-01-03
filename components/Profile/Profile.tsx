// Page de profil de l'utilisateur
// C'est ici que les utilisateurs peuvent voir leur profil et gérer leur compte

import { AntDesign, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from 'expo-router';
import React from 'react';
import { Image, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

import Header from '~/components/header';
import { useProfile } from '~/hooks/useProfile';

// Define your RootStackParamList
type RootStackParamList = {
  'add-song': undefined;
};

// Page de profil de l'utilisateur
export default function Profile() {
  const { handleSignOut, userProfile } = useProfile();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Component Header */}
      <Header />
      {/* Information de l'utilisateur */}
      <View className="h-full w-full flex-1 flex-col">
        <View className="w-full flex-row items-center ">
          {/* Photo de profil */}
          {userProfile?.profilePicture_url ? (
            <Image
              source={{ uri: userProfile.profilePicture_url }}
              className="ml-6 aspect-square h-40 rounded-full"
            />
          ) : (
            <View className="ml-4 aspect-square h-20 items-center justify-center rounded-full bg-gray-500">
              <Text className="text-2xl text-white">
                {userProfile?.username?.[0].toUpperCase() || userProfile?.email?.[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View className="mx-auto h-36 flex-1 items-start justify-around">
            {/* Nom de l'utilisateur */}
            <Text className="ml-4 text-4xl font-black text-gray-200">{userProfile?.username}</Text>
            {/* Nombre de likes et de vues */}
            <View className="flex w-[90%] flex-row items-start justify-around">
              <View className="flex items-center justify-center gap-1">
                <AntDesign name="hearto" size={24} color="#FFC1EB" />
                <Text className="text-lg text-white">129</Text>
              </View>
              <View className="flex items-center justify-center gap-1">
                <Ionicons name="eye-outline" size={28} color="#FFC1EB" />
                <Text className="text-lg text-white">25485</Text>
              </View>
            </View>
          </View>
        </View>
        {/* Bouton pour ajouter une chanson */}
        <View className="my-4 flex w-full items-end justify-center px-8">
          <TouchableOpacity onPress={() => navigation.navigate('add-song')}>
            <FontAwesome5 name="plus" size={16} color="white" />
          </TouchableOpacity>
        </View>
        {/* Bouton pour se déconnecter */}
        <View className="my-4 flex w-full items-center justify-center px-8">
          <Text className="text-gray-300">Wallet Address</Text>
          <Text className="text-2xl font-bold text-white">
            bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
          </Text>
        </View>
        <View className="my-4 flex w-full items-center justify-center px-8">
          <TouchableOpacity className="rounded-lg bg-gray-500 p-2" onPress={handleSignOut}>
            <Text className="text-white">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
