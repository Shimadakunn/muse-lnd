import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import SongModal from './SongModal';

import Header from '~/components/header';
import { useLibrary } from '~/hooks/useLibrary';

const Library = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedSwipeId, setSelectedSwipeId] = useState<string | null>(null);
  const { groupedSwipes, refetch } = useLibrary();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  useEffect(() => {
    refetch();
  }, [groupedSwipes]);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <Header />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {Object.entries(groupedSwipes).map(([dateLabel, swipes]) => (
          <View key={dateLabel} className="mb-8">
            <Text className="mb-2 text-lg font-bold text-white">{dateLabel}</Text>
            <View className="flex-row flex-wrap">
              {swipes.map((swipe) => (
                <TouchableOpacity
                  key={swipe.swipeId}
                  onPress={() => {
                    setSelectedSwipeId(swipe.swipeId);
                    setShowModal(true);
                  }}>
                  <Image
                    source={{ uri: swipe.coverUrl }}
                    className="mb-2 mr-2 aspect-square h-24 w-24 rounded-2xl"
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      {selectedSwipeId && (
        <SongModal showModal={showModal} setShowModal={setShowModal} swipeId={selectedSwipeId} />
      )}
    </SafeAreaView>
  );
};

export default Library;
