import React, {useContext} from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  value: string;
  onPress: () => void;
  disabled?: boolean;
}

const GreenButton: React.FC<Props> = props => {
  const {value, onPress, disabled} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <TouchableOpacity
      style={[styles.container, disabled ? styles.disabled : null]}
      onPress={onPress}
      disabled={disabled}>
      <Text style={styles.text}>{value}</Text>
    </TouchableOpacity>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      height: screenHeight * 0.055,
      backgroundColor: '#20BB74',
      borderRadius: screenHeight * 0.01,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: screenHeight * 0.025,
    },
    text: {
      color: '#FFFFFF',
      fontSize: screenHeight * 0.017,
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
    },
    disabled: {
      opacity: 0.4,
    },
  });

export default GreenButton;
