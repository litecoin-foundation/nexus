import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import HeaderButton from '../../components/Buttons/HeaderButton';
import GreenButton from '../../components/Buttons/GreenButton';

import {useAppSelector} from '../../store/hooks';

interface Props {}

const SuccessSend: React.FC<Props> = () => {
  const navigation = useNavigation();

  return (
    <>
      <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
        <View style={styles.body}>
          <Text style={styles.successText}>Success</Text>
        </View>

        <View style={styles.confirmButtonContainer}>
          <GreenButton
            value="Back To Wallet"
            onPress={() => {
            navigation.navigate('Main');
            }}
          />
        </View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Dimensions.get('screen').height * 0.12,
    paddingBottom: Dimensions.get('screen').height * 0.03,
    paddingLeft: Dimensions.get('screen').height * 0.02,
    paddingRight: Dimensions.get('screen').height * 0.02,
  },
  body: {
    width: '100%',
    height: '100%',
  },
  successText: {
    position: 'absolute',
    top: '40%',
    width: '100%',
    color: '#fff',
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: Dimensions.get('screen').height * 0.05,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  confirmButtonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});

export const SuccessSendNavigationOptions = (navigation: any) => {
  return {
    headerTitle: '',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default SuccessSend;
