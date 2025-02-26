import React, {useContext} from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';

import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  title?: string;
  textKey?: string;
  textDomain?: string;
  active: boolean;
  onPress: () => void;
}

const NewBlueButton: React.FC<Props> = props => {
  const {title, textKey, textDomain, active, onPress} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const textStyle = active
    ? {
        ...styles.text,
        ...styles.activeText,
      }
    : styles.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, active ? styles.active : null]}>
      {title ? (
        <TranslateText
          textValue={title}
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={textStyle}
          numberOfLines={1}
        />
      ) : textKey && textDomain ? (
        <TranslateText
          textKey={textKey}
          domain={textDomain}
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={textStyle}
          numberOfLines={1}
        />
      ) : (
        <></>
      )}
    </TouchableOpacity>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      height: screenHeight * 0.044,
      minWidth: screenHeight * 0.15,
      borderRadius: screenHeight * 0.012,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FEFEFE',
      borderWidth: 1,
      borderColor: 'rgba(216,210,210,75)',
      paddingHorizontal: screenWidth * 0.02,
    },
    active: {
      backgroundColor: '#2C72FF',
      borderWidth: 0,
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '500',
      color: '#2E2E2E',
      fontSize: screenHeight * 0.017,
    },
    activeText: {
      color: '#FFFFFF',
    },
  });

export default NewBlueButton;
