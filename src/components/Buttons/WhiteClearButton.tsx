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
        small ? styles.smallContainer : null,
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
      height: screenHeight * 0.07,
      width: screenHeight * 0.335,
      borderColor: 'white',
      borderWidth: 2,
      borderRadius: screenHeight * 0.014,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: 'black',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: {
        height: 0,
        width: 0,
      },
      marginTop: 10,
      marginBottom: 10,
    },
    selectedContainer: {
      backgroundColor: 'white',
    },
    smallContainer: {
      height: screenHeight * 0.055,
      borderRadius: screenHeight * 0.01,
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: 'white',
      fontSize: screenHeight * 0.17,
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
