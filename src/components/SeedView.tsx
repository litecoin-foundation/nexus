import React, {useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import TranslateText from '../components/TranslateText';
import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  index: number;
  value: string;
}

const SeedView: React.FC<Props> = props => {
  const {index, value} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <View style={styles.container}>
      <View style={styles.numberContainer}>
        <Text style={styles.number}>{index}</Text>
      </View>

      {/* <Text style={styles.text}>{value}</Text> */}
      <TranslateText
        textValue={value}
        maxSizeInPixels={SCREEN_HEIGHT * 0.03}
        textStyle={styles.text}
        numberOfLines={1}
      />
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      height: screenHeight * 0.07,
      width: screenWidth * 0.8,
      borderRadius: screenHeight * 0.014,
      backgroundColor: 'white',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    numberContainer: {
      flexBasis: '20%',
      borderRightWidth: 1,
      borderRightColor: 'rgba(151, 151, 151, 0.3)',
      justifyContent: 'center',
    },
    number: {
      fontFamily: 'Satoshi Variable',
      color: '#3873FF',
      fontSize: screenHeight * 0.024,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    text: {
      flexBasis: '80%',
      color: '#2e2e2e',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.028,
      fontWeight: '500',
      paddingLeft: screenWidth * 0.06,
      paddingBottom: 3,
    },
  });

export default SeedView;
