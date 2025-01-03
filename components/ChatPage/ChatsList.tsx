import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { FlatList } from 'react-native';

import Header from '../header';
import ChatInfo from './ChatInfo';

import { useChat } from '~/hooks/useChat';

//Component qui affiche la liste des discussions
const ChatsList = () => {
  const { discussions, fetchDiscussions } = useChat();

  useFocusEffect(
    useCallback(() => {
      fetchDiscussions();
    }, [fetchDiscussions])
  );

  return (
    discussions.length > 0 && (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <Header />
        <FlatList
          data={discussions}
          renderItem={({ item }) => <ChatInfo item={item} />}
          keyExtractor={(item) => item.id}
        />
      </>
    )
  );
};

export default ChatsList;
