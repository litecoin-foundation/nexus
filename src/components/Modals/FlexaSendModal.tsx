import React, {useContext} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import Animated from 'react-native-reanimated';

import GreyRoundButton from '../Buttons/GreyRoundButton';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  cardTranslateAnim: any;
  close(): void;
}

const FlexaSendModalContent: React.FC<Props> = props => {
  const {cardTranslateAnim, close} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <Animated.View style={[styles.container, cardTranslateAnim]}>
      <Text>hello</Text>
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
export default FlexaSendModalContent;
