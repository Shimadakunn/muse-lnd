import { AntDesign } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Swiper, type SwiperCardRefType } from 'rn-swiper-list';

import Header from '../header';

import ActionButton from '~/components/ui/ActionButton';
import { useSwipe } from '~/hooks/useSwipe';

const App = () => {
  const ref = useRef<SwiperCardRefType>();
  const swipedTopRef = useRef(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right'>('left');

  const { songs, setCurrentIndex, handleSwipe, handleSwipeBack, fetchSongs } = useSwipe();

  useFocusEffect(
    useCallback(() => {
      fetchSongs();
    }, [fetchSongs])
  );

  // Render swipe card
  const renderCard = useCallback(
    (song: any) => {
      return (
        <Pressable
          className="h-full w-full flex-1"
          onPress={() => {
            if (swipeDirection === 'left') {
              ref.current?.swipeLeft();
            } else {
              ref.current?.swipeRight();
            }
            setSwipeDirection((prev) => (prev === 'left' ? 'right' : 'left'));
          }}>
          <View className="h-full w-full flex-1 gap-2 rounded-2xl bg-black px-4 py-4">
            <LinearGradient
              colors={['white', 'black']}
              locations={[0, 1]}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
            />
            <Image
              source={{ uri: song.coverUrl }}
              className="aspect-square w-full rounded-2xl"
              resizeMode="cover"
            />
            <Text className="text-4xl font-black text-white">{song.title}</Text>
            <Text className="text-2xl font-black text-white">{song.creator_username}</Text>
            <View className="flex-row items-center justify-between gap-1">
              <Text className="text-lg text-white">{song.bpm} BPM</Text>
              <Text className="text-lg text-white">Key {song.key}</Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [swipeDirection]
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <GestureHandlerRootView className="relative flex-1">
        <Header />

        {/* Swipe system */}
        <View className="flex-1 items-center justify-end px-4 pt-4">
          <Swiper
            ref={ref}
            cardStyle={{
              width: '100%',
              height: '100%',
              borderRadius: 15,
              alignSelf: 'center',
            }}
            data={songs}
            renderCard={renderCard}
            onIndexChange={setCurrentIndex}
            onSwipedAll={() => {
              console.log('onSwipedAll');
            }}
            onSwipeLeft={(cardIndex) => {
              const beatId = songs[cardIndex]?.id;
              if (beatId) {
                handleSwipe(beatId, false);
              }
            }}
            onSwipeRight={(cardIndex) => {
              const beatId = songs[cardIndex]?.id;
              if (beatId) {
                handleSwipe(beatId, false);
              }
            }}
            onSwipeTop={(cardIndex) => {
              const beatId = songs[cardIndex]?.id;
              if (beatId) {
                handleSwipe(beatId, true);
              }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              console.log('onSwipeTop', cardIndex);
              swipedTopRef.current = true;
            }}
          />
        </View>

        {/* Action buttons */}
        <View className="absolute bottom-8 right-1/2 translate-x-1/2 flex-row items-center justify-center">
          <ActionButton
            className="mr-4 h-16"
            onTap={() => {
              ref.current?.swipeBack();
              handleSwipeBack();
            }}>
            <AntDesign name="reload1" size={24} color="white" />
          </ActionButton>
          <ActionButton
            className="h-24"
            onTap={() => {
              ref.current?.swipeTop();
            }}>
            <AntDesign name="heart" size={32} color="white" />
          </ActionButton>
          <ActionButton className="ml-4 h-16" onTap={() => {}}>
            <AntDesign name="message1" size={32} color="white" />
          </ActionButton>
        </View>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

export default App;
