import { AntDesign } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Image, Text, View } from 'react-native';

import ActionButton from '~/components/ui/ActionButton';
import { AlertDialog } from '~/components/ui/AlertDialog';
import Modal from '~/components/ui/modal';
import { useUser } from '~/contexts/UserContext';
import { useSongModal } from '~/hooks/useSongModal';

interface ModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  swipeId: string;
}

const SongModal = ({ showModal, setShowModal, swipeId }: ModalProps) => {
  const { isPurchased, setIsPurchased } = useUser();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { song, markSwipeAsDeleted, handleMessageAction } = useSongModal({
    showModal,
    swipeId,
    setShowModal,
  });

  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsPurchased(true);
    await new Promise((resolve) => setTimeout(resolve, 10000));
    setIsPurchasing(false);
  };

  return (
    <Modal
      isVisible={showModal}
      onBackdropPress={() => setShowModal(false)}
      onBackButtonPress={() => setShowModal(false)}
      swipeDirection="down"
      onSwipeComplete={() => setShowModal(false)}
      hideModal={() => setShowModal(false)}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={400}
      animationOutTiming={300}
      backdropTransitionInTiming={400}
      backdropTransitionOutTiming={300}
      useNativeDriver
      style={{ margin: 0 }}>
      <View className="relative h-full w-full flex-1 gap-1 rounded-2xl bg-black px-4 py-4">
        {song && (
          <>
            <Image
              source={{ uri: song.coverUrl }}
              className="aspect-square w-full rounded-2xl"
              resizeMode="cover"
            />
            {isPurchasing && !isPurchased && (
              <Text className="mx-auto pt-8 text-4xl font-black text-white">Purchasing...</Text>
            )}
            {isPurchased && (
              <Text className="mx-auto pt-8 text-4xl font-black text-white">Purchased ✅</Text>
            )}
            {!isPurchasing && !isPurchased && (
              <>
                <Text className="text-4xl font-black text-white">{song.title}</Text>
                {/* <View className="flex-row items-center justify-between gap-1">
                  <Text className="text-lg font-bold text-white">BPM: {song.bpm}</Text>
                  <Text className="text-lg font-bold text-white">Key: {song.key}</Text>
                  </View> */}
                <Text className="text-3xl font-black text-white">$25</Text>
                <Text className="text-lg font-bold text-gray-400">22 sats</Text>
              </>
            )}
          </>
        )}

        {/* Action buttons */}
        <View className="absolute bottom-8 right-[55%] translate-x-1/2 flex-row items-center justify-center">
          <ActionButton
            className="mr-4 h-14"
            onTap={() => {
              markSwipeAsDeleted();
              setShowModal(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }}>
            <AntDesign name="delete" size={20} color="white" />
          </ActionButton>
          <ActionButton
            className="h-20"
            onTap={() => {
              setIsAlertOpen(true);
            }}>
            <AntDesign name="shoppingcart" size={40} color="white" />
          </ActionButton>
          <ActionButton className="ml-4 h-14" onTap={handleMessageAction}>
            <AntDesign name="message1" size={20} color="white" />
          </ActionButton>
        </View>
      </View>
      <AlertDialog
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title="Purchase Song"
        description="The song is $25.00 (22 sats). This amount will be deducted from your balance and the song will be added to your purchased songs. Please note that you will pay for the blockchain transaction fee (~3 sats)."
        confirmText="Purchase"
        cancelText="Cancel"
        onConfirm={() => {
          handlePurchase();
        }}
      />
    </Modal>
  );
};

export default SongModal;
