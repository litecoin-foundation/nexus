import React, {useContext, useState, useRef} from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  DeviceEventEmitter,
} from 'react-native';
import {InitiatePurchaseResponseData} from '../../services/giftcards';
import {useAppDispatch} from '../../store/hooks';
import {sendOnchainPayment} from '../../reducers/transaction';
import PlasmaModal from '../../components/Modals/PlasmaModal';
import PinModalContent from '../../components/Modals/PinModalContent';
import BlueRoundButton from '../Buttons/BlueRoundButton';

import {
  colors,
  getSpacing,
  getBorderRadius,
  getFontSize,
  getCommonStyles,
} from './theme';
import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

const formatExpiryDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', {month: 'short'});
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${day} ${month} ${hour12}:${minutes} ${ampm}`;
};

interface PayForGiftCardProps {
  initiateResponse: InitiatePurchaseResponseData;
  onBack: () => void;
  onSuccess: (txid: string) => void;
}

export function PayForGiftCard({
  initiateResponse,
  onBack,
  onSuccess,
}: PayForGiftCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();

  const [isPinModalOpened, setIsPinModalOpened] = useState(false);
  const pinModalAction = useRef<string>('send-giftcard-payment');
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

  const handleCompletePurchase = async () => {
    try {
      setLoading(true);
      setIsPinModalOpened(false);
      const txid = await dispatch(
        sendOnchainPayment(
          initiateResponse.paymentAddress,
          Math.trunc(Number(initiateResponse.paymentAmountLtc) * 100000000),
          'Giftcard Payment',
        ),
      );
      onSuccess(txid);
      setLoading(false);
    } catch (err) {
      setError(String(err));
      setIsPinModalOpened(false);
      setLoading(false);
    }
  };

  return (
    <>
      <ScrollView
        style={commonStyles.container}
        contentContainerStyle={styles.container}>
        <TranslateText
          textKey="complete_payment_invoice"
          domain="nexusShop"
          maxSizeInPixels={SCREEN_HEIGHT * 0.024}
          textStyle={[commonStyles.titleBlack, styles.title]}
          numberOfLines={2}
        />

        <View style={styles.paymentDetails}>
          <View style={styles.detailRow}>
            <TranslateText
              textKey="brand"
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.016}
              textStyle={styles.detailLabel}
              numberOfLines={1}
            />
            <TranslateText
              textValue={initiateResponse.brand}
              maxSizeInPixels={SCREEN_HEIGHT * 0.018}
              textStyle={styles.detailValue}
              numberOfLines={1}
            />
          </View>

          <View style={styles.detailRow}>
            <TranslateText
              textKey="amount"
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.016}
              textStyle={styles.detailLabel}
              numberOfLines={1}
            />
            <TranslateText
              textValue={`${initiateResponse.amount} ${initiateResponse.currency}`}
              maxSizeInPixels={SCREEN_HEIGHT * 0.018}
              textStyle={styles.detailValue}
              numberOfLines={1}
            />
          </View>

          <View style={styles.detailRow}>
            <TranslateText
              textKey="amount_ltc"
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.016}
              textStyle={styles.detailLabel}
              numberOfLines={1}
            />
            <TranslateText
              textValue={String(initiateResponse.paymentAmountLtc)}
              maxSizeInPixels={SCREEN_HEIGHT * 0.018}
              textStyle={styles.detailValue}
              numberOfLines={1}
            />
          </View>

          <View style={styles.detailRow}>
            <TranslateText
              textKey="payment_to"
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.016}
              textStyle={styles.detailLabel}
              numberOfLines={1}
            />
            <TranslateText
              textValue={initiateResponse.paymentAddress}
              maxSizeInPixels={SCREEN_HEIGHT * 0.014}
              textStyle={[styles.detailValue, styles.addressText]}
              numberOfLines={2}
            />
          </View>

          <View style={styles.detailRow}>
            <TranslateText
              textKey="expires_at"
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.016}
              textStyle={styles.detailLabel}
              numberOfLines={1}
            />
            <TranslateText
              textValue={formatExpiryDate(initiateResponse.expiresAt)}
              maxSizeInPixels={SCREEN_HEIGHT * 0.018}
              textStyle={styles.detailValue}
              numberOfLines={1}
            />
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <TranslateText
              textValue={error}
              maxSizeInPixels={SCREEN_HEIGHT * 0.014}
              textStyle={styles.errorMessage}
              numberOfLines={2}
            />
          </View>
        )}

        <TouchableOpacity
          style={[commonStyles.buttonRoundedSecondary, styles.backButton]}
          onPress={onBack}
          disabled={loading}>
          <TranslateText
            textKey="back"
            domain="nexusShop"
            maxSizeInPixels={SCREEN_HEIGHT * 0.018}
            textStyle={commonStyles.buttonTextBlack}
            numberOfLines={1}
          />
        </TouchableOpacity>

        <BlueRoundButton
          textKey="send_payment"
          textDomain="nexusShop"
          onPress={() => handleAuthenticationRequired('send-giftcard-payment')}
          disabled={loading}
          loading={loading}
        />
      </ScrollView>

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
            handleValidationSuccess={() => handleCompletePurchase()}
          />
        )}
      />
    </>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      padding: getSpacing(screenWidth, screenHeight).md,
    },
    title: {
      fontSize: getFontSize(screenHeight).xl,
      fontWeight: '600',
      textAlign: 'center',
    },
    backButton: {
      marginBottom: getSpacing(screenWidth, screenHeight).md,
    },
    paymentDetails: {
      backgroundColor: colors.primary,
      borderRadius: getBorderRadius(screenHeight).lg,
      paddingVertical: getSpacing(screenWidth, screenHeight).xl,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).lg,
      marginBottom: getSpacing(screenWidth, screenHeight).lg,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: getSpacing(screenWidth, screenHeight).md,
    },
    detailLabel: {
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    detailValue: {
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '600',
      color: colors.white,
      flex: 2,
      textAlign: 'right',
    },
    addressText: {
      fontSize: getFontSize(screenHeight).sm,
      fontFamily: 'monospace',
    },
    errorContainer: {
      backgroundColor: colors.dangerLight,
      padding: getSpacing(screenWidth, screenHeight).md,
      borderRadius: getBorderRadius(screenHeight).lg,
      marginBottom: getSpacing(screenWidth, screenHeight).lg,
    },
    errorMessage: {
      color: colors.danger,
      fontSize: getFontSize(screenHeight).sm,
    },
  });
