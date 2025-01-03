import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUser } from '~/contexts/UserContext';
import { useChat } from '~/hooks/useChat';

interface ChatProps {
  discussionId: string;
}

export default function Chat({ discussionId }: ChatProps) {
  const { uid } = useUser();
  const [newMessage, setNewMessage] = useState('');
  const { messages, participant, fetchMessages, fetchParticipantInfo, sendMessage } =
    useChat(discussionId);

  useEffect(() => {
    const unsubscribe = fetchMessages();
    fetchParticipantInfo();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchMessages, fetchParticipantInfo]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;
    await sendMessage(newMessage);
    setNewMessage('');
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View
      className={`mb-[1px] rounded-full px-3 py-2 ${item.senderId === uid ? 'self-end bg-blue-500' : 'self-start bg-gray-300'}`}>
      <Text className={item.senderId === uid ? 'text-white' : 'text-black'}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <View className="flex h-[6vh] flex-row items-center justify-start border backdrop-blur-md">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          {participant && (
            <View className="ml-2 flex-row items-center">
              <Image
                source={{ uri: participant.profilePicture_url }}
                className="mr-2 h-10 w-10 rounded-full"
              />
              <Text className="text-lg font-semibold text-white">{participant.username}</Text>
            </View>
          )}
        </View>

        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          className="mb-2 flex px-4 pb-4"
        />
        <View className="mx-auto w-[95%] flex-row items-center rounded-full border border-gray-500 p-1">
          <TextInput
            className="flex-1 rounded-full px-4 py-2 text-white"
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            className="ml-2 rounded-full bg-blue-500 p-2">
            <Ionicons name="arrow-up" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
