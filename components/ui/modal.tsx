import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Text,
  PanResponderGestureState,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import ModalComponent, { ModalProps } from 'react-native-modal';

interface Props {
  hideModal: () => void;
  hideCloseButton?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Modal = ({
  hideModal,
  hideCloseButton,
  style,
  children,
  ...props
}: Props & Partial<ModalProps>) => {
  const [offsetY, setOffsetY] = useState(0);

  return (
    <ModalComponent
      {...props}
      style={styles.modalContainer}
      onSwipeMove={(percentageShown: number) => {
        const newOffset = Math.max(0, 1 - percentageShown) * 100;
        setOffsetY(newOffset);
      }}
      onSwipeComplete={() => {
        setOffsetY(0);
        hideModal();
      }}
      onSwipeCancel={() => {
        setOffsetY(0);
      }}
      swipeDirection={['down']}
      propagateSwipe
      swipeThreshold={50}>
      <View style={[styles.modal, style, { transform: [{ translateY: Math.max(0, offsetY) }] }]}>
        {/* <View style={styles.indicator} /> */}
        {children}
      </View>
    </ModalComponent>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'flex-end',
    marginBottom: 30,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 40,
  },
  indicator: {
    width: 80,
    height: 4,
    backgroundColor: 'gray',
    borderRadius: 2,
    marginVertical: 8,
    alignSelf: 'center',
  },
  modal: {
    borderColor: 'white',
    borderWidth: 1,
    flex: 0.65,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: 20,
    alignItems: 'center',
    backgroundColor: 'black',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  text: {
    fontSize: 20,
  },
});

export default Modal;
