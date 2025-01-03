import { AntDesign, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button } from '~/components/ui/Button';
import { useProfile } from '~/hooks/useProfile';

export default function AddSong() {
  const {
    loading,
    title,
    setTitle,
    key,
    setKey,
    bpm,
    setBpm,
    coverUpload,
    beatUpload,
    pickImage,
    pickBeat,
    addSong,
  } = useProfile();

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Return button */}
      <View className="flex-1">
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          className="my-4 ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View className="flex-1 px-6">
          {/* Upload cover */}
          <Text className="text-xl font-bold text-white">Cover</Text>
          {coverUpload ? (
            <Image
              source={{ uri: coverUpload.uri }}
              className="mx-auto aspect-square w-36 rounded-full"
            />
          ) : (
            <TouchableOpacity
              onPress={pickImage}
              className="mx-auto flex aspect-square w-36 items-center justify-center rounded-full bg-[#E2D0D0]">
              <AntDesign name="plus" size={32} color="black" />
            </TouchableOpacity>
          )}
          {/* Input Title */}
          <Text className="text-xl font-bold text-white">Title</Text>
          <TextInput
            className="mb-4 h-12 w-full rounded-lg bg-[#E2D0D0] p-2"
            value={title}
            onChangeText={setTitle}
          />
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1">
              <Text className="text-xl font-bold text-white">Key</Text>
              <TextInput
                className="mb-4 h-12 w-full rounded-lg bg-[#E2D0D0] p-2"
                value={key}
                onChangeText={setKey}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-white">BPM</Text>
              <TextInput
                className="mb-4 h-12 w-full rounded-lg bg-[#E2D0D0] p-2"
                value={bpm}
                onChangeText={setBpm}
              />
            </View>
          </View>
          <Text className="text-xl font-bold text-white">Beat</Text>
          {beatUpload ? (
            <Text className="text-white">Beat uploaded!</Text>
          ) : (
            <TouchableOpacity onPress={pickBeat}>
              <Text className="text-white">Select Beat</Text>
            </TouchableOpacity>
          )}
          {loading ? (
            <ActivityIndicator size="small" color="#0000ff" className="mx-auto" />
          ) : (
            <Button title="Complete Setup" onPress={addSong} className=" mx-auto" />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
