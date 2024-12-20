import React, {useContext} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated from 'react-native-reanimated';

import AuthPad from '../Numpad/AuthPad';
import GreyRoundButton from '../Buttons/GreyRoundButton';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  cardTranslateAnim: any;
  close(): void;
  handleValidationFailure: () => void;
  handleValidationSuccess: () => void;
}

const PinModalContent: React.FC<Props> = props => {
  const {cardTranslateAnim, close, handleValidationFailure, handleValidationSuccess} =
    props;

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

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

// AuthPad height os screenHeight * 0.65
// Close button is screenHeight * 0.045
const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      height: '100%',
      width: '100%',
    },
    closeContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.65 - screenHeight * 0.045 - 15,
      right: 15,
    },
  });
export default PinModalContent;
