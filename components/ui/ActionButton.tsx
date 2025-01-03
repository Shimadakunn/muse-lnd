import React from 'react';
import { TouchableOpacity } from 'react-native';

type ActionButtonProps = TouchableOpacity['props'] & {
  onTap?: () => void;
};

const ActionButton = React.memo(({ onTap, children, className, ...rest }: ActionButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onTap}
      {...rest}
      className={`flex aspect-square items-center justify-center rounded-full bg-[#3A3D45] ${className}`}>
      {children}
    </TouchableOpacity>
  );
});

export default ActionButton;
