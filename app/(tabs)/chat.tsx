// Page de chat entre les utilisateurs

import { SafeAreaView } from 'react-native-safe-area-context';

import ChatList from '~/components/ChatPage/ChatsList';
import { useUser } from '~/contexts/UserContext';
export default function Home() {
  return (
    <SafeAreaView className="h-full bg-black">
      <ChatList />
    </SafeAreaView>
  );
}
