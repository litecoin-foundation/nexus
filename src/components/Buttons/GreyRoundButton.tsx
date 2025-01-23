import React, {useContext} from 'react';
import {TouchableOpacity, Image, StyleSheet} from 'react-native';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  onPress: () => void;
}

const GreyRoundButton: React.FC<Props> = props => {
  const {onPress} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={require('../../assets/images/close.png')} />
    </TouchableOpacity>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      height: screenHeight * 0.045,
      width: screenHeight * 0.045,
      borderRadius: screenHeight * 0.015,
      backgroundColor: '#EAEBED',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default GreyRoundButton;
