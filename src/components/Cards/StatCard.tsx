import React, {useContext} from 'react';
import {View, StyleSheet} from 'react-native';

import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface StatCardProps {
  label: string;
  value: number;
}

const StatCard: React.FC<StatCardProps> = ({label, value}) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <View style={styles.card}>
      <TranslateText
        textValue={String(value)}
        maxSizeInPixels={SCREEN_HEIGHT * 0.035}
        textStyle={styles.value}
        numberOfLines={1}
      />
      <TranslateText
        textValue={label}
        maxSizeInPixels={SCREEN_HEIGHT * 0.012}
        textStyle={styles.label}
        numberOfLines={2}
      />
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: screenHeight * 0.015,
      paddingHorizontal: screenWidth * 0.03,
      paddingVertical: screenHeight * 0.02,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: screenHeight * 0.11,
    },
    value: {
      color: '#FFFFFF',
      fontSize: screenHeight * 0.035,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      marginBottom: screenHeight * 0.008,
    },
    label: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: screenHeight * 0.012,
      fontWeight: '600',
      fontFamily: 'Satoshi Variable',
      textTransform: 'uppercase',
      textAlign: 'center',
    },
  });

export default StatCard;
