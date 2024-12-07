import React from 'react';
import {View, StyleSheet} from 'react-native';
import Animated from 'react-native-reanimated';

import AuthPad from '../Numpad/AuthPad';
import GreyRoundButton from '../Buttons/GreyRoundButton';

interface Props {
  cardTranslateAnim: any;
  close(): void;
  handleValidationFailure: () => void;
  handleValidationSuccess: () => void;
}

const PinModalContent: React.FC<Props> = props => {
  const {cardTranslateAnim, close, handleValidationFailure, handleValidationSuccess} =
    props;
  return (
    <Animated.View style={[styles.container, cardTranslateAnim]}>
      <AuthPad
        handleValidationFailure={handleValidationFailure}
        handleValidationSuccess={handleValidationSuccess}
        handleBiometricPress={handleValidationSuccess}
      />
      <View style={styles.closeContainer}>
        <GreyRoundButton onPress={() => close()} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    height: '100%',
    width: '100%',
  },
  closeContainer: {
    position: 'absolute',
    top: '31.5%',
    right: 20,
  },
});
export default PinModalContent;
