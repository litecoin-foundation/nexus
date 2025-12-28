import React, {useContext} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {NexusShopStackParamList} from '../../navigation/NexusShopStack';

import {
  colors,
  getFontSize,
  getCommonStyles,
  getSpacing,
} from '../../components/GiftCardShop/theme';

import {ScreenSizeContext} from '../../context/screenSize';

const OTPVerified: React.FC = () => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const navigation =
    useNavigation<StackNavigationProp<NexusShopStackParamList>>();

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[commonStyles.container, commonStyles.centered]}>
      <Text style={styles.verifiedText}>Verified!</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={commonStyles.buttonRounded}
          onPress={handleGoBack}>
          <Text style={commonStyles.buttonText}>To the Shop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (_screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    verifiedText: {
      width: '100%',
      fontSize: getFontSize(screenHeight).xxl,
      fontWeight: '700',
      color: colors.success,
      textAlign: 'center',
    },
    buttonContainer: {
      width: '100%',
      paddingTop: getSpacing(screenHeight).xxl,
      paddingHorizontal: getSpacing(screenHeight).xl,
    },
  });

export default OTPVerified;
