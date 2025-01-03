import { Image, Text, View } from 'react-native';

import { useLnd } from '~/contexts/ContextLND';
import { useUser } from '~/contexts/UserContext';

export default function Header() {
  const { isPurchased } = useUser();
  const { user } = useLnd();
  return (
    <View className="h-[8vh] w-full flex-row items-center justify-between px-4">
      <View className="flex-row items-center justify-center gap-2">
        <Image source={require('~/assets/tab-icons/logo.png')} className="h-8" />
        <Text className="text-2xl font-bold text-white">Muse</Text>
      </View>
      <Text className="text-lg font-bold text-white">{user.wallet.balance}</Text>
    </View>
  );
}
