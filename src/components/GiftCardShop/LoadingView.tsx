import React, {useContext} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';

import {colors, getSpacing} from './theme';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

export function LoadingView({message = 'Loading...'}: {message?: string}) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
      <TranslateText
        textValue={message}
        textStyle={styles.loadingText}
        maxSizeInPixels={SCREEN_HEIGHT * 0.02}
      />
    </View>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: getSpacing(screenWidth, screenHeight).lg,
    },
    loadingText: {
      color: '#747E87',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.015,
      fontStyle: 'normal',
      fontWeight: '700',
      textAlign: 'center',
      marginTop: getSpacing(screenWidth, screenHeight).md,
    },
  });
