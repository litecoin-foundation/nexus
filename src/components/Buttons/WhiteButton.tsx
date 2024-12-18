import React, {useContext} from 'react';
import {TouchableOpacity, Text, StyleSheet, Platform} from 'react-native';

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

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useContext(ScreenSizeContext);
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
      height: screenHeight * 0.03,
      borderRadius: (screenHeight * 0.03) / 2,
      paddingLeft: screenHeight * 0.015,
      paddingRight: screenHeight * 0.015,
    },
    big: {
      height: 50,
      width: 335,
      borderRadius: 9,
    },
    text: {
      fontFamily:
        Platform.OS === 'ios'
          ? 'Satoshi Variable'
          : 'SatoshiVariable-Regular.ttf',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#2E2E2E',
      fontSize: screenHeight * 0.018,
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
      fontSize: screenHeight * 0.012,
    },
  });

export default WhiteButton;
