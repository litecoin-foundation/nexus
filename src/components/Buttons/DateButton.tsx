import React, {useContext} from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';

import TranslateText from '../../components/TranslateText';
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
  const {value, onPress, disabled, customStyles, customFontStyles, active} =
    props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const textStyle = active
    ? {
        ...styles.text,
        ...customFontStyles,
      }
    : {
        ...styles.text,
        ...customFontStyles,
        ...styles.inactiveText,
      };

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
      <TranslateText
        textKey={String(value).toLowerCase()}
        domain="main"
        maxSizeInPixels={SCREEN_HEIGHT * 0.015}
        textStyle={textStyle}
        numberOfLines={1}
      />
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
