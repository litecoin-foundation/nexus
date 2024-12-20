import React, {useContext} from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  onPress: () => void;
  value: string;
  small?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

const WhiteClearButton = (props: Props): React.JSX.Element => {
  const {onPress, value, small, selected, disabled} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        small ? styles.small : styles.big,
        selected ? styles.selectedContainer : null,
      ]}
      disabled={disabled}
      onPress={onPress}>
      <Text
        style={[
          styles.text,
          small ? styles.smallText : null,
          selected ? styles.selectedText : null,
        ]}>
        {value}
      </Text>
    </TouchableOpacity>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      borderColor: 'white',
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: 'black',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: {
        height: 0,
        width: 0,
      },
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
    selectedContainer: {
      backgroundColor: 'white',
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: 'white',
      fontSize: screenHeight * 0.018,
    },
    selectedText: {
      color: '#1341BE',
      fontWeight: 'bold',
    },
    smallText: {
      fontSize: screenHeight * 0.015,
    },
  });

export default WhiteClearButton;
