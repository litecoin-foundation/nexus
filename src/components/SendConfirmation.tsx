import React, {useContext, useEffect, useRef, useState} from 'react';
import {View, StyleSheet, DeviceEventEmitter, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {estimateFee} from 'react-native-nitro-lndltc';
import type {Utxo} from 'react-native-nitro-lndltc';

import PlasmaModal from './Modals/PlasmaModal';
import PinModalContent from './Modals/PinModalContent';
import LoadingIndicator from './LoadingIndicator';
import GreenButtonV2 from './ButtonsV2/GreenButtonV2';
import {BUTTON_HEIGHT_RATIO} from './ButtonsV2/BlueButtonV2';
import {GAP_RATIO, useFixedBottomStyle} from './ButtonsV2/fixedBottomStyle';
import {
  GlassCard,
  GlassCardHairline,
  GlassCardRow,
  GlassCardStackedRow,
} from './Cells/GlassCard';
import {BORDER_GRADIENT_COLORS} from './LiquidGlassBackdrop';
import {SHEET_BACKGROUND} from './GlassTxRows';
import {SHEET_TOP_RADIUS_RATIO} from './GlassBottomSheet';
import {SKIN_GRADIENT_COLORS, SKIN_GRADIENT_LOCATIONS} from './FoldedSkinView';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {showError} from '../reducers/errors';
import {
  sendOnchainPayment,
  sendAllOnchainPayment,
  sendOnchainWithCoinSelectionPayment,
} from '../reducers/transaction';
import {
  satsToSubunitSelector,
  subunitCodeSelector,
  subunitSymbolSelector,
} from '../reducers/settings';
import {fiatValueSelector} from '../reducers/ticker';
import {isLongAmount} from '../utils/satoshis';

import TranslateText from '../components/TranslateText';
import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  toAddress: string;
  amount: number;
  fiatAmount: string;
  label: string;
  sendSuccessHandler: (txid: string) => void;
  toDomain?: string;
  sendAll?: boolean;
  coinSelectionUtxos?: Utxo[] | null;
}

const SendConfirmation: React.FC<Props> = props => {
  const {
    toAddress,
    amount,
    label,
    fiatAmount,
    sendSuccessHandler,
    toDomain,
    sendAll,
    coinSelectionUtxos,
  } = props;
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(false);
  const [fee, setFee] = useState(0);

  const {confirmedBalance} = useAppSelector(state => state.balance!);
  const calculateFiatAmount = useAppSelector(state => fiatValueSelector(state));
  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const amountCode = useAppSelector(state => subunitCodeSelector(state));
  const {currencySymbol} = useAppSelector(state => state.settings);

  const sendAmount =
    sendAll === true ? Number(confirmedBalance) - 5100 : amount;
  const sendFiatAmount =
    sendAll === true
      ? calculateFiatAmount(confirmedBalance)
      : `${currencySymbol}${fiatAmount}`;
  // NOTE: sending all spends the whole confirmed balance, whatever the fee comes to
  const totalAmount =
    sendAll === true ? Number(confirmedBalance) : sendAmount + fee;

  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const amountInSubunit = convertToSubunit(sendAmount);
  const longAmount = isLongAmount(amountInSubunit);

  const {t: tSend} = useTranslation('sendTab');

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const insets = useSafeAreaInsets();
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, insets);
  const fixedBottomStyle = useFixedBottomStyle();

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

    let txid: string;
    try {
      if (coinSelectionUtxos) {
        if (coinSelectionUtxos.length > 0) {
          txid = await sendOnchainWithCoinSelectionPayment(
            toAddress,
            Math.trunc(amount),
            // Set ghost label if it's undefined in order to prevent default labeling
            label || ' ',
            undefined,
            coinSelectionUtxos,
          );
        } else {
          throw new Error(
            'Manual Coin Selection enabled, but not Inputs selected.',
          );
        }
      } else if (sendAll) {
        txid = await dispatch(sendAllOnchainPayment(toAddress, label));
      } else {
        txid = await dispatch(
          sendOnchainPayment(toAddress, Math.trunc(amount), label),
        );
      }
      sendSuccessHandler(txid);

      setLoading(false);
    } catch (error) {
      setLoading(false);
      dispatch(showError(String(error)));
    }
  };

  // estimate fee
  useEffect(() => {
    // NOTE: after a send-all broadcasts, the balance drops while this screen is still
    // mounted under SuccessSend, which would make sendAmount negative
    if (sendAmount <= 0) {
      return;
    }

    const calculateFee = async () => {
      try {
        const response = await estimateFee({
          AddrToAmount: {[toAddress]: BigInt(sendAmount)},
          targetConf: 2,
        });

        setFee(Number(response.feeSat));
      } catch (error) {
        console.error(error);
      }
    };

    calculateFee();
  }, [amount, toAddress, sendAmount]);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.topContainer}>
          <LinearGradient
            style={styles.background}
            colors={SKIN_GRADIENT_COLORS}
            locations={SKIN_GRADIENT_LOCATIONS}
          />
          <TranslateText
            textKey="send"
            domain="main"
            maxSizeInPixels={SCREEN_HEIGHT * 0.03}
            textStyle={styles.titleText}
            numberOfLines={1}
          />
          <TranslateText
            textValue={amountInSubunit + ' ' + amountCode}
            maxSizeInPixels={SCREEN_HEIGHT * (longAmount ? 0.056 : 0.08)}
            textStyle={[
              styles.amountText,
              longAmount ? styles.amountTextSmall : null,
            ]}
            numberOfLines={1}
          />
          <View style={styles.fiatAmount}>
            <TranslateText
              textValue={sendFiatAmount}
              maxSizeInPixels={SCREEN_HEIGHT * 0.05}
              textStyle={styles.fiatAmountText}
              numberOfLines={1}
            />
          </View>
        </View>

        <View style={styles.bottomSheetContainer}>
          <GlassCard>
            {toDomain ? (
              <>
                <GlassCardRow
                  titleTextKey="recipient"
                  titleDomain="sendTab"
                  value={toDomain}
                />
                <GlassCardHairline />
              </>
            ) : null}
            <GlassCardStackedRow
              titleTextValue={tSend('send_to_address').toUpperCase()}
              value={toAddress}
            />
            {label ? (
              <>
                <GlassCardHairline />
                <GlassCardStackedRow
                  titleTextValue={tSend('description').toUpperCase()}
                  value={label}
                  numberOfLines={4}
                />
              </>
            ) : null}
            <GlassCardHairline />
            <GlassCardRow
              titleTextKey="network_fee"
              value={`${convertToSubunit(fee)}${amountSymbol} (${calculateFiatAmount(fee)})`}
            />
          </GlassCard>
          <GlassCard>
            <GlassCardRow
              titleTextKey="total"
              value={`${convertToSubunit(totalAmount)} ${amountCode}`}
              valueColor="#2c72ff"
              emphasized
            />
          </GlassCard>
        </View>

        <View style={fixedBottomStyle}>
          <GreenButtonV2
            textKey="confirm_and_send"
            textDomain="sendTab"
            onPress={() => handleAuthenticationRequired('send-auth')}
          />
        </View>
      </View>

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

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  insets: {top: number; bottom: number},
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: SKIN_GRADIENT_COLORS[SKIN_GRADIENT_COLORS.length - 1],
      paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
    },
    background: {
      ...StyleSheet.absoluteFill,
    },
    topContainer: {
      flex: 1,
      paddingTop: insets.top,
      paddingHorizontal: screenWidth * 0.04,
    },
    bottomSheetContainer: {
      width: '100%',
      backgroundColor: SHEET_BACKGROUND,
      borderTopLeftRadius: screenHeight * SHEET_TOP_RADIUS_RATIO,
      borderTopRightRadius: screenHeight * SHEET_TOP_RADIUS_RATIO,
      paddingTop: screenWidth * 0.03,
      paddingHorizontal: screenWidth * 0.03,
      paddingBottom:
        screenHeight * BUTTON_HEIGHT_RATIO + screenWidth * GAP_RATIO * 2,
      overflow: 'hidden',
    },
    titleText: {
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.025,
      fontStyle: 'normal',
      fontWeight: '700',
      marginTop: screenHeight * 0.1,
    },
    amountText: {
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.06,
      fontStyle: 'normal',
      fontWeight: '400',
      marginTop: screenHeight * 0.01,
    },
    amountTextSmall: {
      fontSize: screenHeight * 0.042,
    },
    fiatAmount: {
      width: 'auto',
      height: screenHeight * 0.05,
      borderRadius: screenHeight * 0.025,
      borderCurve: 'continuous',
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: BORDER_GRADIENT_COLORS[1],
      boxShadow: [
        {offsetX: 0, offsetY: 2, blurRadius: 8, color: 'rgba(0, 0, 0, 0.07)'},
        {
          offsetX: 0,
          offsetY: 0.5,
          blurRadius: 0,
          color: BORDER_GRADIENT_COLORS[0],
          inset: true,
        },
        {
          offsetX: 0,
          offsetY: -0.5,
          blurRadius: 0,
          color: BORDER_GRADIENT_COLORS[2],
          inset: true,
        },
      ],
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: screenHeight * 0.01,
      paddingHorizontal: screenHeight * 0.02,
      alignSelf: 'flex-start',
      marginTop: screenHeight * 0.01,
    },
    fiatAmountText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export default SendConfirmation;
