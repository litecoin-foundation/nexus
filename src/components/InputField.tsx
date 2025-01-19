import React, {useContext} from 'react';
import {View, TextInput, StyleSheet} from 'react-native';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}

const InputField: React.FC<Props> = props => {
  const {value, onChangeText, placeholder, onFocus, onBlur} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <View style={styles.container}>
      <TextInput
        placeholder={placeholder ? placeholder : undefined}
        placeholderTextColor="#dbdbdb"
        style={styles.text}
        onChangeText={text => onChangeText(text)}
        value={value}
        autoCorrect={false}
        autoComplete="off"
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      minHeight: screenHeight * 0.06,
      borderRadius: screenHeight * 0.01,
      borderColor: '#E8E8E8',
      borderWidth: 1,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      paddingHorizontal: screenHeight * 0.02,
      paddingVertical: screenHeight * 0.01,
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#20BB74',
      fontSize: screenHeight * 0.022,
    },
  });

export default InputField;
