import React, {useContext, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  DeviceEventEmitter,
  Platform,
  Image,
  Alert,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';

import HeaderButton from '../../components/Buttons/HeaderButton';
import PlasmaModal from '../../components/Modals/PlasmaModal';
import PinModalContent from '../../components/Modals/PinModalContent';
import LoadingIndicator from '../../components/LoadingIndicator';
import GreenButton from '../../components/Buttons/GreenButton';
import {useTranslation} from 'react-i18next';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {sendConvertWithCoinControl} from '../../reducers/transaction';
import {showError} from '../../reducers/errors';
import {
  satsToSubunitSelector,
  subunitCodeSelector,
  subunitToSatsSelector,
} from '../../reducers/settings';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {}

type RootStackParamList = {
  ConfirmConvert: {
    isRegular: boolean;
    regularAmount: string;
    privateAmount: string;
    regularConfirmedBalance: string;
    privateConfirmedBalance: string;
  };
  SuccessConvert: {
    txid: string;
    amount: number;
    isRegular: boolean;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'ConfirmConvert'>;
  route: RouteProp<RootStackParamList, 'ConfirmConvert'>;
}

const ConfirmConvert: React.FC<Props> = props => {
  const {navigation, route} = props;
  const {
    isRegular,
    regularAmount,
    privateAmount,
    regularConfirmedBalance,
    privateConfirmedBalance,
  } = route.params;
  const dispatch = useAppDispatch();

  const {t} = useTranslation('settingsTab');

  const [loading, setLoading] = useState(false);

  const amountCode = useAppSelector(state => subunitCodeSelector(state));
  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const convertToSats = useAppSelector(state => subunitToSatsSelector(state));

  const regularAmountInSubunit = convertToSubunit(
    Number(regularAmount) * 100000000,
  );
  const privateAmountInSubunit = convertToSubunit(
    Number(privateAmount) * 100000000,
  );
  const regularConfirmedBalanceInSubunit = convertToSubunit(
    regularConfirmedBalance,
  );
  const privateConfirmedBalanceInSubunit = convertToSubunit(
    privateConfirmedBalance,
  );
  const newRegularBalance = isRegular
    ? convertToSubunit(
        Number(regularConfirmedBalance) - Number(regularAmount) * 100000000,
      )
    : regularAmountInSubunit;
  const newPrivateBalance = !isRegular
    ? convertToSubunit(
        Number(privateConfirmedBalance) - Number(privateAmount) * 100000000,
      )
    : privateAmountInSubunit;
  const amount = isRegular ? regularAmountInSubunit : privateAmountInSubunit;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [isPinModalOpened, setIsPinModalOpened] = useState(false);
  const pinModalAction = useRef<string>('convert-auth');
  function openPinModal(action: string) {
    pinModalAction.current = action;
    setIsPinModalOpened(true);
  }

  const handleAuthenticationRequired = (action: string) => {
    return new Promise<void>((resolve, reject) => {
      openPinModal(action);
      const subscription = DeviceEventEmitter.addListener(action, bool => {
        if (bool === true) {
          setIsPinModalOpened(false);
          subscription.remove();
          resolve();
        } else if (bool === false) {
          subscription.remove();
          reject();
        }
      });
    });
  };

  const handleConvert = async () => {
    setIsPinModalOpened(false);
    setLoading(true);
    try {
      const amt = isRegular ? regularAmount : privateAmount;
      const destination = isRegular ? 'private' : 'regular';
      const txid = await sendConvertWithCoinControl(
        convertToSats(Number(amt)),
        destination,
      );
      setLoading(false);
      navigation.navigate('SuccessConvert', {
        txid: String(txid),
        amount,
        isRegular,
      });
    } catch (error) {
      setLoading(false);
      dispatch(showError(String(error)));
    }
  };

  return (
    <>
      <LinearGradient style={styles.background} colors={['#1162E6', '#0F55C7']}>
        <CustomSafeAreaView
          styles={styles.safeArea}
          edges={
            Platform.OS === 'ios'
              ? ['top', 'left', 'right']
              : ['top', 'bottom', 'left', 'right']
          }>
          <View style={styles.body}>
            <TranslateText
              textKey="convert"
              domain="main"
              maxSizeInPixels={SCREEN_HEIGHT * 0.03}
              textStyle={styles.convertText}
              numberOfLines={1}
            />
            <TranslateText
              textValue={amount + ' ' + amountCode}
              maxSizeInPixels={SCREEN_HEIGHT * 0.05}
              textStyle={styles.amountText}
              numberOfLines={1}
            />
            <View style={styles.fromToContainer}>
              <TranslateText
                textKey={
                  isRegular ? 'regular_to_private' : 'private_to_regular'
                }
                domain="convertTab"
                maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                textStyle={styles.fromToText}
                numberOfLines={1}
              />
            </View>

            <View style={styles.balanceContainer}>
              <View style={styles.balanceItem}>
                <TranslateText
                  textKey="regular"
                  domain="convertTab"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.014}
                  textStyle={styles.valueSubtitle}
                  numberOfLines={1}
                />
                <TranslateText
                  textValue={
                    regularConfirmedBalanceInSubunit + ' ' + amountCode
                  }
                  maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                  textStyle={styles.valueTitle}
                  numberOfLines={3}
                />
              </View>
              <View style={styles.balanceItem}>
                <TranslateText
                  textKey="private"
                  domain="convertTab"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.014}
                  textStyle={styles.valueSubtitle}
                  numberOfLines={1}
                />
                <TranslateText
                  textValue={
                    privateConfirmedBalanceInSubunit + ' ' + amountCode
                  }
                  maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                  textStyle={styles.valueTitle}
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.imageContainer}>
              <Image
                source={require('../../assets/images/arrow-down.png')}
                style={styles.image}
              />
            </View>

            <View style={styles.balanceContainer}>
              <View style={styles.balanceItem}>
                <TranslateText
                  textKey="regular"
                  domain="convertTab"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.014}
                  textStyle={styles.valueSubtitle}
                  numberOfLines={1}
                />
                <TranslateText
                  textValue={newRegularBalance + ' ' + amountCode}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                  textStyle={styles.valueTitle}
                  numberOfLines={3}
                />
              </View>
              <View style={styles.balanceItem}>
                <TranslateText
                  textKey="private"
                  domain="convertTab"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.014}
                  textStyle={styles.valueSubtitle}
                  numberOfLines={1}
                />
                <TranslateText
                  textValue={newPrivateBalance + ' ' + amountCode}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                  textStyle={styles.valueTitle}
                  numberOfLines={3}
                />
              </View>
            </View>

            {!isRegular ? (
              <View style={styles.noteContainer}>
                <TranslateText
                  textKey="private_to_regular_note"
                  domain="convertTab"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                  textStyle={styles.noteText}
                  numberOfLines={6}
                />
              </View>
            ) : null}

            <View style={styles.confirmButtonContainer}>
              <GreenButton
                textKey="confirm_convert"
                textDomain="convertTab"
                onPress={() => handleAuthenticationRequired('convert-auth')}
              />
            </View>
          </View>
        </CustomSafeAreaView>
      </LinearGradient>

      <PlasmaModal
        isOpened={isPinModalOpened}
        close={() => {
          setIsPinModalOpened(false);
        }}
        isFromBottomToTop={true}
        animDuration={250}
        gapInPixels={0}
        backSpecifiedStyle={{backgroundColor: 'rgba(19,58,138, 0.6)'}}
        renderBody={(_, __, ___, ____, cardTranslateAnim: any) => (
          <PinModalContent
            cardTranslateAnim={cardTranslateAnim}
            close={() => setIsPinModalOpened(false)}
            handleValidationFailure={() =>
              Alert.alert('Incorrect Pincode', undefined, [
                {
                  text: t('dismiss'),
                  onPress: () => setIsPinModalOpened(false),
                  style: 'cancel',
                },
              ])
            }
            handleValidationSuccess={() => handleConvert()}
          />
        )}
      />

      <LoadingIndicator visible={loading} />
    </>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    background: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    body: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'flex-start',
      position: 'relative',
      paddingTop: screenHeight * 0.05,
      paddingHorizontal: screenWidth * 0.06,
    },
    convertText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.03,
      marginTop: screenHeight * 0.08,
    },
    amountText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '400',
      fontSize: screenHeight * 0.05,
      textTransform: 'uppercase',
    },
    fromToContainer: {
      width: 'auto',
      borderRadius: screenHeight * 0.01,
      backgroundColor: '#0F4CAD',
      paddingTop: screenHeight * 0.01,
      paddingBottom: screenHeight * 0.01,
      paddingLeft: screenHeight * 0.014,
      paddingRight: screenHeight * 0.014,
      marginTop: screenHeight * 0.01,
      marginBottom:
        Platform.OS === 'ios' ? screenHeight * 0.1 : screenHeight * 0.08,
    },
    fromToText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.02,
      opacity: 0.4,
      textTransform: 'uppercase',
    },
    balanceContainer: {
      width: '100%',
      flexDirection: 'row',
      borderRadius: screenHeight * 0.02,
      backgroundColor: '#2d333dcb',
      paddingVertical: screenHeight * 0.02,
      paddingHorizontal: screenWidth * 0.04,
    },
    balanceItem: {
      flexBasis: '50%',
    },
    imageContainer: {
      width: '100%',
      height: screenHeight * 0.07,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      height: 16,
    },
    valueSubtitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.018,
      textTransform: 'uppercase',
      opacity: 0.6,
    },
    valueTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.025,
    },
    noteContainer: {
      width: '100%',
      height: screenHeight * 0.15,
      alignItems: 'center',
      paddingHorizontal: screenWidth * 0.07,
      marginTop: screenHeight * 0.05,
    },
    noteText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.02,
      textAlign: 'justify',
    },
    confirmButtonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.03,
      left: screenWidth * 0.06,
      width: '100%',
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

export const ConfirmConvertNavigationOptions = (navigation: any) => {
  return {
    headerTitle: '',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        textKey="change"
        textDomain="buyTab"
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
    headerRight: () => (
      <HeaderButton
        textKey="cancel"
        textDomain="buyTab"
        onPress={() => navigation.navigate('Main', {isInitial: true})}
        rightPadding={true}
      />
    ),
  };
};

export default ConfirmConvert;
