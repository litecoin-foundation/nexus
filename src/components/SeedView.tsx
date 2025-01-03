import React, {useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';

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

      <Text style={styles.text}>{value}</Text>
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
      justifyContent: 'center',
      alignItems: 'center',
    },
    numberContainer: {
      borderRightWidth: 1,
      borderRightColor: 'rgba(151, 151, 151, 0.3)',
      height: 40,
      justifyContent: 'center',
    },
    number: {
      fontFamily: 'Satoshi Variable',
      color: '#3873FF',
      fontSize: screenHeight * 0.024,
      fontWeight: 'bold',
      width: screenWidth * 0.15,
      textAlign: 'center',
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontWeight: '500',
      color: '#2e2e2e',
      fontSize: screenHeight * 0.028,
      flexGrow: 4,
      paddingLeft: screenWidth * 0.06,
    },
  });

export default SeedView;
