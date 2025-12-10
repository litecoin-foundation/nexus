import React, {useContext} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  colors,
  getFontSize,
  getCommonStyles,
} from '../../components/GiftCardShop/theme';

import {ScreenSizeContext} from '../../context/screenSize';

const OTPVerified: React.FC = () => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <View style={[commonStyles.container, commonStyles.centered]}>
      <Text style={styles.verifiedText}>Verified</Text>
    </View>
  );
};

const getStyles = (_screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    verifiedText: {
      fontSize: getFontSize(screenHeight).xxl,
      fontWeight: '700',
      color: colors.success,
      textAlign: 'center',
    },
  });

export default OTPVerified;
