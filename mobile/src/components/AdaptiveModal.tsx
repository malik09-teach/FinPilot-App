import React from 'react';
import { Modal, ModalProps, View, StyleSheet, Platform } from 'react-native';

interface AdaptiveModalProps extends ModalProps {
  children: React.ReactNode;
}

export const AdaptiveModal: React.FC<AdaptiveModalProps> = ({
  visible,
  children,
  animationType = 'slide',
  transparent = true,
  ...props
}) => {
  if (!visible) return null;

  // On Web: Render strictly inside the phone emulator chassis as an absolute overlay
  if (Platform.OS === 'web') {
    return <View style={styles.webModalOverlay}>{children}</View>;
  }

  // On iOS / Android Native: Standard native Modal
  return (
    <Modal
      visible={visible}
      animationType={animationType}
      transparent={transparent}
      {...props}
    >
      {children}
    </Modal>
  );
};

const styles = StyleSheet.create({
  webModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
  },
});
