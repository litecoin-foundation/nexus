import React, {useContext} from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  value: string;
  onPress(): void;
  disabled?: boolean;
  customStyles?: {};
  customFontStyles?: {};
  active: boolean;
}

const DateButton: React.FC<Props> = props => {
  const {
    value,
    onPress,
    disabled,
    customStyles,
    customFontStyles,
    active,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <TouchableOpacity
      disabled={disabled || false}
      style={[
        styles.container,
        disabled ? styles.disabled : null,
        customStyles,
        active ? styles.active : null,
      ]}
      onPress={onPress}>
      <Text
        style={[
          styles.text,
          customFontStyles,
          active ? null : styles.inactiveText,
        ]}>
        {value}
      </Text>
    </TouchableOpacity>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      width: screenWidth * 0.11,
      maxWidth: screenHeight * 0.05,
      height: screenHeight * 0.03,
      borderRadius: (screenHeight * 0.03) / 2,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: screenWidth * 0.02,
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#2E2E2E',
      fontSize: screenHeight * 0.012,
    },
    disabled: {
      opacity: 0.5,
    },
    active: {
      backgroundColor: 'white',
    },
    inactiveText: {
      color: 'white',
    },
  });

export default DateButton;
