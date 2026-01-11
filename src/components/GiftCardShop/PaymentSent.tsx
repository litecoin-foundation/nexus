import React, {useContext} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {colors, getSpacing, getFontSize, getCommonStyles} from './theme';

import {ScreenSizeContext} from '../../context/screenSize';

interface PaymentSentProps {
  txid: string;
  onDone: () => void;
}

export function PaymentSent({txid, onDone}: PaymentSentProps) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  if (__DEV__) {
    console.log(txid);
  }

  return (
    <View style={[commonStyles.container, commonStyles.centered]}>
      <Text style={styles.verifiedText}>Payment was sent!</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={commonStyles.buttonRoundedGreen}
          onPress={onDone}>
          <Text style={commonStyles.buttonText}>To the Shop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    verifiedText: {
      width: '100%',
      fontSize: getFontSize(screenHeight).xxl,
      fontWeight: '600',
      color: colors.lightBlack,
      textAlign: 'center',
      marginTop: getSpacing(screenWidth, screenHeight).xl * -1,
    },
    buttonContainer: {
      width: '100%',
      padding: getSpacing(screenWidth, screenHeight).xl,
    },
  });
