import React from 'react';
import {View, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';

import AuthPad from '../Numpad/AuthPad';
import GreyRoundButton from '../Buttons/GreyRoundButton';

interface Props {
  isVisible: boolean;
  close(): void;
  handleValidationFailure: () => void;
  handleValidationSuccess: () => void;
}

const PinModal: React.FC<Props> = props => {
  const {isVisible, close, handleValidationFailure, handleValidationSuccess} =
    props;
  return (
    <>
      <Modal
        isVisible={isVisible}
        swipeDirection="down"
        backdropColor="rgb(19,58,138)"
        backdropOpacity={0.6}
        style={styles.noMargin}>
        <View style={styles.container}>
          <AuthPad
            handleValidationFailure={handleValidationFailure}
            handleValidationSuccess={handleValidationSuccess}
            handleBiometricPress={handleValidationSuccess}
          />
        </View>
        <View style={styles.closeContainer}>
          <GreyRoundButton onPress={() => close()} />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  noMargin: {
    margin: 0,
  },
  closeContainer: {
    position: 'absolute',
    bottom: '64.7%',
    right: 20,
  },
});
export default PinModal;
