import React, {useContext} from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  value: string;
  onPress(): void;
  small: boolean;
  disabled?: boolean;
  customStyles?: {};
  customFontStyles?: {};
  active: boolean;
}

const WhiteButton: React.FC<Props> = props => {
  const {
    value,
    onPress,
    small,
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
        small ? styles.small : styles.big,
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
          small ? styles.smallText : null,
        ]}>
        {value}
      </Text>
    </TouchableOpacity>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    small: {
      width: screenWidth * 0.7,
      height: screenHeight * 0.055,
      borderRadius: screenHeight * 0.01,
    },
    big: {
      width: '100%',
      height: screenHeight * 0.07,
      borderRadius: screenHeight * 0.014,
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#2E2E2E',
      fontSize: screenHeight * 0.02,
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
    smallText: {
      fontSize: screenHeight * 0.017,
    },
  });

export default WhiteButton;
