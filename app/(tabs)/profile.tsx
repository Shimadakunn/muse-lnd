import { createStackNavigator } from '@react-navigation/stack';
import { Stack } from 'expo-router';

import AddSong from '~/components/Profile/AddSong';
import Profile from '~/components/Profile/Profile';

const Stacks = createStackNavigator();

function AppNavigator() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Stacks.Navigator>
        <Stacks.Screen
          name="profile-dashboard"
          component={Profile}
          options={{ headerShown: false }}
        />
        <Stacks.Screen name="add-song" component={AddSong} options={{ headerShown: false }} />
      </Stacks.Navigator>
    </>
  );
}

export default AppNavigator;
