import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {
  Alert,
  DeviceEventEmitter,
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
import PinModal from '../../components/Modals/PinModal';
import GreenButton from '../../components/Buttons/GreenButton';
import ChooseWalletLargeButton from '../../components/Buttons/ChooseWalletLargeButton';
import {subunitSymbolSelector} from '../../reducers/settings';
import {useAppSelector} from '../../store/hooks';

interface Props {}

const ConfirmSend: React.FC<Props> = () => {
  const navigation = useNavigation();

  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const currencySymbol = useAppSelector(state => state.settings.currencySymbol);

  const amount = useAppSelector(state => state.input.amount);
  const fiatAmount = useAppSelector(state => state.input.fiatAmount);
  const toAddress = useAppSelector(state => state.input.toAddress);
  const message = useAppSelector(state => state.input.message);
  const fee = useAppSelector(state => state.input.fee);
  // Todo: get total fee for the tx
  const totalFeeInLTC = 'undefined ';

  const [isPinModalTriggered, triggerPinModal] = useState(false);
  const [isWalletsModalOpened, setWalletsModalOpened] = useState(false);

  const handleAuthenticationRequired = () => {
    return new Promise<void>((resolve, reject) => {
      triggerPinModal(true);
      const subscription = DeviceEventEmitter.addListener('auth', bool => {
        if (bool === true) {
          triggerPinModal(false);
          subscription.remove();
          resolve();
        } else if (bool === false) {
          subscription.remove();
          reject();
        }
      });
    });
  };

  const handleSend = () => {
    handleAuthenticationRequired()
      .then(() => {
        console.log('successfully authentication, handle sending');
        navigation.navigate('SuccessSend');
      })
      .catch(() =>
        Alert.alert('Incorrect Pincode', undefined, [
          {
            text: 'Dismiss',
            onPress: () => triggerPinModal(false),
            style: 'cancel',
          },
        ]),
      );
  };

  // animation
  const walletButtonAnimDuration = 200;
  const rotateArrowAnim = useSharedValue(0);
  const rotateArrow = () => {
    rotateArrowAnim.value = withTiming(isWalletsModalOpened ? 0 : 1, {
      duration: walletButtonAnimDuration,
    });
  };
  const animatedWalletButtonArrowStyle = useAnimatedStyle(() => {
    const spinIterpolation = interpolate(
      rotateArrowAnim.value,
      [0, 1],
      [270, 90],
    );
    return {
      transform: [{rotate: `${spinIterpolation}deg`}],
    };
  });

  return (
    <>
      <Animated.View style={styles.chooseWalletBtnContainer}>
        <ChooseWalletLargeButton
          title={'Main Wallet (2.574LTC)'}
          onPress={() => {
            rotateArrow();
            setWalletsModalOpened(!isWalletsModalOpened);
          }}
          arrowSpinAnim={animatedWalletButtonArrowStyle}
          isOpen={isWalletsModalOpened}
        />
      </Animated.View>

      <LinearGradient style={styles.background} colors={['#1162E6', '#0F55C7']}>
        <View style={styles.body}>
          <Text style={styles.sendText}>Send</Text>
          <Text style={styles.amountText}>{amount + ' LTC'}</Text>
          <View style={styles.fiatAmount}>
            <Text style={styles.fiatAmountText}>
              {currencySymbol + '' + fiatAmount}
            </Text>
          </View>
          <Text style={styles.valueSubtitle}>To Recipient Address</Text>
          <Text style={styles.valueTitle}>{toAddress}</Text>
          <Text style={styles.valueSubtitle}>Fee</Text>
          <Text style={styles.valueTitle}>
            {totalFeeInLTC + '' + amountSymbol}
          </Text>
          <Text style={styles.valueSubtitle}>Will be delivered</Text>
          <Text style={styles.valueTitle}>Within 3 minutes</Text>
        </View>

        <View style={styles.confirmButtonContainer}>
          <GreenButton value="Confirm and Send" onPress={() => handleSend()} />
        </View>
      </LinearGradient>

      <PinModal
        isVisible={isPinModalTriggered}
        close={() => triggerPinModal(false)}
        handleValidationFailure={() => DeviceEventEmitter.emit('auth', false)}
        handleValidationSuccess={() => DeviceEventEmitter.emit('auth', true)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    position: 'relative',
    paddingTop: Dimensions.get('screen').height * 0.12,
    paddingLeft: Dimensions.get('screen').height * 0.02,
    paddingRight: Dimensions.get('screen').height * 0.02,
  },
  chooseWalletBtnContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: Dimensions.get('screen').height * 0.05,
    paddingLeft: Dimensions.get('screen').height * 0.02,
    paddingRight: Dimensions.get('screen').height * 0.02,
    marginTop: Dimensions.get('screen').height * 0.12,
    zIndex: 11,
  },
  chooseWalletBtn: {
    width: '100%',
    height: '100%',
    borderRadius: Dimensions.get('screen').height * 0.01,
    backgroundColor: '#0d3d8a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: Dimensions.get('screen').height * 0.02,
    paddingRight: Dimensions.get('screen').height * 0.02,
  },
  chooseWalletBtnText: {
    color: '#fff',
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: Dimensions.get('screen').height * 0.017,
  },
  btnArrow: {
    height: Dimensions.get('screen').height * 0.012,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginLeft: 8,
  },
  btnArrowIcon: {
    height: '100%',
    objectFit: 'contain',
  },
  sendText: {
    color: '#fff',
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: Dimensions.get('screen').height * 0.025,
    marginTop: Dimensions.get('screen').height * 0.08,
  },
  amountText: {
    color: '#fff',
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: Dimensions.get('screen').height * 0.05,
  },
  fiatAmount: {
    width: 'auto',
    borderRadius: Dimensions.get('screen').height * 0.01,
    backgroundColor: '#0F4CAD',
    paddingTop: Dimensions.get('screen').height * 0.01,
    paddingBottom: Dimensions.get('screen').height * 0.01,
    paddingLeft: Dimensions.get('screen').height * 0.015,
    paddingRight: Dimensions.get('screen').height * 0.015,
  },
  fiatAmountText: {
    color: '#fff',
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: Dimensions.get('screen').height * 0.02,
    opacity: 0.4,
  },
  valueSubtitle: {
    color: '#fff',
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: Dimensions.get('screen').height * 0.017,
    textTransform: 'uppercase',
    opacity: 0.6,
    marginTop: Dimensions.get('screen').height * 0.05,
  },
  valueTitle: {
    color: '#fff',
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: Dimensions.get('screen').height * 0.025,
  },
  confirmButtonContainer: {
    position: 'absolute',
    bottom: Dimensions.get('screen').height * 0.03,
    width: '100%',
    height: Dimensions.get('screen').height * 0.05,
    paddingLeft: Dimensions.get('screen').height * 0.02,
    paddingRight: Dimensions.get('screen').height * 0.02,
  },

  blurContainer: {
    flex: 1,
    padding: 20,
    margin: 16,
    textAlign: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 20,
  },
  background: {
    flex: 1,
    flexWrap: 'wrap',
    ...StyleSheet.absoluteFill,
  },
  box: {
    width: '25%',
    height: '20%',
  },
  boxEven: {
    backgroundColor: 'orangered',
  },
  boxOdd: {
    backgroundColor: 'gold',
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
  },
});

export const ConfirmSendNavigationOptions = (navigation: any) => {
  return {
    headerTitle: '',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        title="CHANGE"
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
    headerRight: () => (
      <HeaderButton
        title="CANCEL"
        onPress={() => navigation.reset('Main')}
        rightPadding={true}
      />
    ),
  };
};

export default ConfirmSend;
