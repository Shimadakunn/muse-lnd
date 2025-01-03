import { format } from 'date-fns';
import { Link, useFocusEffect } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { useChat } from '~/hooks/useChat';

interface Discussion {
  id: string;
  participants_ids: string[];
  createdAt: Timestamp;
  lastMessage?: {
    text: string;
    createdAt: Timestamp;
  };
}

interface UserInfo {
  username: string;
  profilePicture_url: string;
}

export default function ChatInfo({ item }: { item: Discussion }) {
  const [otherUserInfo, setOtherUserInfo] = useState<UserInfo | null>(null);
  const { fetchOtherUserInfo } = useChat();

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const userInfo = await fetchOtherUserInfo(item);
        if (userInfo) {
          setOtherUserInfo(userInfo);
        }
      };
      loadData();
    }, [fetchOtherUserInfo, item])
  );

  const formatDate = (date: Date) => {
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'HH:mm');
    } else if (date.getFullYear() === now.getFullYear()) {
      return format(date, 'dd MMM');
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  return (
    <Link href={`/chat/${item.id}`} asChild>
      <TouchableOpacity className="flex-row items-center justify-between border-b border-gray-500 p-3">
        <View className="flex-row items-center">
          <Image
            source={{ uri: otherUserInfo?.profilePicture_url }}
            className="mr-3 h-12 w-12 rounded-full"
          />
          <View>
            <Text className="text-lg font-bold text-white">{otherUserInfo?.username}</Text>
            {item.lastMessage && (
              <Text className="text-sm text-gray-400" numberOfLines={1} ellipsizeMode="tail">
                {item.lastMessage.text}
              </Text>
            )}
          </View>
        </View>
        {item.lastMessage && (
          <Text className="text-xs text-gray-400">
            {formatDate(item.lastMessage.createdAt.toDate())}
          </Text>
        )}
      </TouchableOpacity>
    </Link>
  );
}
