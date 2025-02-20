import React, {useContext, useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, DeviceEventEmitter} from 'react-native';

import PlasmaModal from './Modals/PlasmaModal';
import PinModalContent from './Modals/PinModalContent';
import LoadingIndicator from './LoadingIndicator';
import GreenButton from './Buttons/GreenButton';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {showError} from '../reducers/errors';
import {sendOnchainPayment} from '../reducers/transaction';
import {estimateFee} from 'react-native-turbo-lnd';
import {
  satsToSubunitSelector,
  subunitCodeSelector,
  subunitSymbolSelector,
} from '../reducers/settings';
import {fiatValueSelector} from '../reducers/ticker';

import {ScreenSizeContext} from '../context/screenSize';
import LinearGradient from 'react-native-linear-gradient';

interface Props {
  toAddress: string;
  amount: number;
  fiatAmount: string;
  label: string;
  sendSuccessHandler: (txid: string) => void;
}

const SendConfirmation: React.FC<Props> = props => {
  const {toAddress, amount, label, fiatAmount, sendSuccessHandler} = props;
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(false);
  const [fee, setFee] = useState(0);

  const calculateFiatAmount = useAppSelector(state => fiatValueSelector(state));
  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const amountCode = useAppSelector(state => subunitCodeSelector(state));
  const currencySymbol = useAppSelector(state => state.settings.currencySymbol);
  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const amountInSubunit = convertToSubunit(amount);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [isPinModalOpened, setIsPinModalOpened] = useState(false);
  const pinModalAction = useRef<string>('send-auth');
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

  const handleSend = async () => {
    setIsPinModalOpened(false);
    setLoading(true);
    try {
      // await is required!
      const txid = await dispatch(
        sendOnchainPayment(toAddress, Math.trunc(amount), label),
      );
      setLoading(false);
      sendSuccessHandler(txid);
    } catch (error) {
      setLoading(false);
      dispatch(showError(String(error)));
    }
  };

  // estimate fee
  useEffect(() => {
    const calculateFee = async () => {
      try {
        const response = await estimateFee({
          AddrToAmount: {[toAddress]: BigInt(amount)},
          targetConf: 2,
        });
        setFee(Number(response.feeSat));
      } catch (error) {
        console.error(error);
      }
    };

    calculateFee();
  }, []);

  return (
    <>
      {/* <Animated.View style={styles.chooseWalletBtnContainer}>
        <ChooseWalletLargeButton
          title={'Main Wallet (2.574LTC)'}
          onPress={() => {
            rotateArrow();
            setWalletsModalOpened(!isWalletsModalOpened);
          }}
          arrowSpinAnim={animatedWalletButtonArrowStyle}
          isOpen={isWalletsModalOpened}
        />
      </Animated.View> */}

      <LinearGradient style={styles.background} colors={['#1162E6', '#0F55C7']}>
        <View style={styles.body}>
          <Text style={styles.sendText}>Send</Text>
          <Text style={styles.amountText}>
            {amountInSubunit + ' ' + amountCode}
          </Text>
          <View style={styles.fiatAmount}>
            <Text style={styles.fiatAmountText}>
              {currencySymbol + '' + fiatAmount}
            </Text>
          </View>
          <Text style={styles.valueSubtitle}>To Recipient Address</Text>
          <Text style={styles.valueTitle}>{toAddress}</Text>
          <Text style={styles.valueSubtitle}>Fee</Text>
          <Text style={styles.valueTitle}>
            {convertToSubunit(fee) + '' + amountSymbol}
          </Text>
          <Text style={styles.valueTitle}>{calculateFiatAmount(fee)}</Text>
        </View>

        <View style={styles.confirmButtonContainer}>
          <GreenButton
            value="Confirm and Send"
            onPress={() => handleAuthenticationRequired('send-auth')}
          />
        </View>
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
              // TODO: handle pin failure
              console.log('incorrect pin')
            }
            handleValidationSuccess={() => handleSend()}
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
    body: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      position: 'relative',
      paddingTop: screenHeight * 0.12,
      paddingLeft: screenHeight * 0.02,
      paddingRight: screenHeight * 0.02,
    },
    chooseWalletBtnContainer: {
      position: 'absolute',
      top: 0,
      width: '100%',
      height: 'auto',
      paddingLeft: screenHeight * 0.02,
      paddingRight: screenHeight * 0.02,
      marginTop: screenHeight * 0.12,
      zIndex: 2,
    },
    chooseWalletBtn: {
      width: '100%',
      height: '100%',
      borderRadius: screenHeight * 0.01,
      backgroundColor: '#0d3d8a',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: screenHeight * 0.02,
      paddingRight: screenHeight * 0.02,
    },
    chooseWalletBtnText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: screenHeight * 0.017,
    },
    btnArrow: {
      height: screenHeight * 0.012,
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
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.025,
      marginTop: screenHeight * 0.08,
    },
    amountText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '400',
      fontSize: screenHeight * 0.05,
    },
    fiatAmount: {
      width: 'auto',
      borderRadius: screenHeight * 0.01,
      backgroundColor: '#0F4CAD',
      paddingTop: screenHeight * 0.01,
      paddingBottom: screenHeight * 0.01,
      paddingLeft: screenHeight * 0.015,
      paddingRight: screenHeight * 0.015,
    },
    fiatAmountText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.02,
      opacity: 0.4,
    },
    valueSubtitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.017,
      textTransform: 'uppercase',
      opacity: 0.6,
      marginTop: screenHeight * 0.05,
    },
    valueTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.025,
    },
    confirmButtonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.03,
      width: '100%',
      height: screenHeight * 0.05,
      paddingLeft: screenHeight * 0.02,
      paddingRight: screenHeight * 0.02,
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
      ...StyleSheet.absoluteFillObject,
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

export default SendConfirmation;
