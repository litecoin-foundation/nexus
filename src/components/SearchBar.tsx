import React, {useContext} from 'react';
import {View, TextInput, StyleSheet, Image} from 'react-native';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
}

const SearchBar: React.FC<Props> = props => {
  const {value, onChangeText, placeholder} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          style={styles.image}
          source={require('../assets/icons/search-icon.png')}
        />
      </View>
      <TextInput
        placeholder={placeholder ? placeholder : undefined}
        placeholderTextColor="#2e2e2e65"
        style={styles.text}
        onChangeText={text => onChangeText(text)}
        value={value}
        autoCorrect={false}
        autoComplete="off"
      />
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      width: '100%',
      height: screenHeight * 0.05,
      borderRadius: screenHeight * 0.01,
      borderColor: '#e8e8e8',
      borderWidth: 1,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.07,
      shadowRadius: 4,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: screenHeight * 0.006,
    },
    imageContainer: {
      width: screenHeight * 0.038,
      height: screenHeight * 0.038,
      borderRadius: screenHeight * 0.008,
      backgroundColor: '#d8d8d833',
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: '50%',
      height: '50%',
      objectFit: 'scale-down',
    },
    text: {
      flex: 1,
      color: '#47516B',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '500',
      letterSpacing: -0.39,
      fontSize: screenHeight * 0.02,
      marginLeft: screenHeight * 0.01,
    },
  });

export default SearchBar;
