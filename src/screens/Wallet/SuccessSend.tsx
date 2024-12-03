import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {StyleSheet, Text, View, Dimensions, Platform} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import HeaderButton from '../../components/Buttons/HeaderButton';
import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';

import {useAppSelector} from '../../store/hooks';

interface Props {}

const SuccessSend: React.FC<Props> = () => {
  const navigation = useNavigation();

  const amount = useAppSelector(state => state.input.amount);
  const toAddress = useAppSelector(state => state.input.toAddress);

  return (
    <>
      <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
        <View style={styles.body}>
          <Text style={styles.title}>Awesome!</Text>
          <Text style={styles.subtitle}>You just sent</Text>
          <Text style={styles.amount}>{amount + ' LTC'}</Text>
          <View style={styles.separator} />
          <View style={styles.toAddressContainer}>
            <Text style={styles.toAddressText}>{toAddress}</Text>
          </View>
        </View>

        <View style={styles.confirmButtonContainer}>
          <WhiteClearButton
            small={true}
            value="See transactions"
            onPress={() => {
              navigation.navigate('SearchTransaction');
            }}
          />
          <WhiteButton
            disabled={false}
            small={false}
            active={true}
            value="Back to wallets"
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
    width: '100%',
    height: '100%',
  },
  body: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Dimensions.get('screen').height * 0.03,
  },
  title: {
    width: '100%',
    color: '#fff',
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: Dimensions.get('screen').height * 0.07,
    textAlign: 'center',
    marginTop: Dimensions.get('screen').height * 0.05 * -1,
  },
  subtitle: {
    width: '100%',
    color: '#fff',
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: Dimensions.get('screen').height * 0.016,
    textTransform: 'uppercase',
    textAlign: 'center',
    opacity: 0.9,
    marginTop: Dimensions.get('screen').height * 0.005,
  },
  amount: {
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
    marginTop: Dimensions.get('screen').height * 0.005,
  },
  separator: {
    width: 2,
    height: 12,
    backgroundColor: '#fff',
    marginTop: Dimensions.get('screen').height * 0.015,
    marginBottom: Dimensions.get('screen').height * 0.015,
    opacity: 0.9,
  },
  toAddressContainer: {
    width: 'auto',
    height: 'auto',
    borderRadius: Dimensions.get('screen').height * 0.012,
    backgroundColor: 'rgba(240, 240, 240, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Dimensions.get('screen').height * 0.005,
    paddingLeft: Dimensions.get('screen').width * 0.05,
    paddingRight: Dimensions.get('screen').width * 0.05,
    paddingTop: Dimensions.get('screen').width * 0.02,
    paddingBottom: Dimensions.get('screen').width * 0.02,
  },
  toAddressText: {
    color: '#fff',
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: Dimensions.get('screen').height * 0.03,
    textAlign: 'center',
  },
  confirmButtonContainer: {
    position: 'absolute',
    bottom: Dimensions.get('screen').height * 0.03,
    width: '100%',
    height: 'auto',
    flexDirection: 'column',
    // justifyContent: 'flex-end',
    alignItems: 'center',
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
