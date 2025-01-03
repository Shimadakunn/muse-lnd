// Gestion de la logique de navigation entre les différentes pages

import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { Image } from 'react-native';

export default function TabsLayout() {
  const handleTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'black',
          height: 80,
        },
      }}>
      <Tabs.Screen
        name="swipe"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require('~/assets/tab-icons/logo.png')
                  : require('~/assets/tab-icons/logo-empty.png')
              }
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require('~/assets/tab-icons/library.png')
                  : require('~/assets/tab-icons/library-empty.png')
              }
              style={{ width: 30, height: 30 }}
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require('~/assets/tab-icons/chat.png')
                  : require('~/assets/tab-icons/chat-empty.png')
              }
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require('~/assets/tab-icons/profile.png')
                  : require('~/assets/tab-icons/profile-empty.png')
              }
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
    </Tabs>
  );
}
