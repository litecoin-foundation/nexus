import React, {useContext} from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  value: string;
  onPress: () => void;
  disabled?: boolean;
}

const BlueButton: React.FC<Props> = props => {
  const {value, onPress, disabled} = props;

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useContext(ScreenSizeContext);
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
      backgroundColor: '#2C72FF',
      borderRadius: screenHeight * 0.01,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: screenHeight * 0.025,
    },
    text: {
      color: '#FFFFFF',
      fontSize: screenHeight * 0.017,
      fontWeight: '600',
    },
    disabled: {
      opacity: 0.4,
    },
  });

export default BlueButton;
