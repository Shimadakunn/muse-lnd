import { Stack } from 'expo-router';

import SwipePage from '~/components/SwipePage/Swipe';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SwipePage />
    </>
  );
}
