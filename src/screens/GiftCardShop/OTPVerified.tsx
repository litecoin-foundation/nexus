import React, {useContext, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {NewWalletStackParamList} from '../../navigation/types';

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
    useNavigation<StackNavigationProp<NewWalletStackParamList>>();

  // TODO: gestureEnabled: false is currently not working, check on it later
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      // Allow reset actions (from handleGoBack), block back gestures
      if (e.data.action.type !== 'RESET') {
        e.preventDefault();
      }
    });
    return unsubscribe;
  }, [navigation]);

  const handleGoBack = () => {
    // navigation.reset({
    //   index: 0,
    //   routes: [{name: 'GiftCardShop'}],
    // });
    navigation.navigate({name: 'Main', params: {}});
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
      fontSize: getFontSize(screenHeight).xxxl,
      fontWeight: '600',
      color: colors.lightBlack,
      textAlign: 'center',
    },
    buttonContainer: {
      width: '100%',
      paddingTop: getSpacing(screenHeight).xxl,
      paddingHorizontal: getSpacing(screenHeight).xl,
    },
  });

export default OTPVerified;
