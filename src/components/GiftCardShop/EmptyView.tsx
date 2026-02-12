import React, {useContext} from 'react';
import {View, StyleSheet} from 'react-native';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

export function EmptyView({message}: {message: string}) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <View style={styles.emptyContainer}>
      <TranslateText
        textValue={message}
        textStyle={styles.emptyText}
        maxSizeInPixels={SCREEN_HEIGHT * 0.02}
      />
    </View>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    emptyContainer: {
      paddingVertical: screenHeight * 0.03,
      paddingHorizontal: screenWidth * 0.1,
    },
    emptyText: {
      color: '#747E87',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.015,
      fontStyle: 'normal',
      fontWeight: '700',
      letterSpacing: -0.28,
      textAlign: 'center',
    },
  });
