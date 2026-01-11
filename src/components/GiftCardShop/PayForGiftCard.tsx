import React, {useContext, useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  DeviceEventEmitter,
} from 'react-native';
import {InitiatePurchaseResponseData} from '../../services/giftcards';
import {useAppDispatch} from '../../store/hooks';
import {sendOnchainPayment} from '../../reducers/transaction';
import PlasmaModal from '../../components/Modals/PlasmaModal';
import PinModalContent from '../../components/Modals/PinModalContent';

import {
  colors,
  getSpacing,
  getBorderRadius,
  getFontSize,
  getCommonStyles,
} from './theme';
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
        <Text style={[commonStyles.titleBlack, styles.title]}>
          Complete payment by sending coins to this invoice
        </Text>

        <View style={styles.paymentDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Brand</Text>
            <Text style={styles.detailValue}>{initiateResponse.brand}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>
              {initiateResponse.amount} {initiateResponse.currency}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount (LTC)</Text>
            <Text style={styles.detailValue}>
              {initiateResponse.paymentAmountLtc}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment To</Text>
            <Text style={[styles.detailValue, styles.addressText]}>
              {initiateResponse.paymentAddress}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expires At</Text>
            <Text style={styles.detailValue}>
              {formatExpiryDate(initiateResponse.expiresAt)}
            </Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[commonStyles.buttonRoundedSecondary, styles.backButton]}
          onPress={onBack}
          disabled={loading}>
          <Text style={commonStyles.buttonTextBlack}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            commonStyles.buttonRounded,
            loading && commonStyles.buttonDisabled,
          ]}
          onPress={() => handleAuthenticationRequired('send-giftcard-payment')}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={commonStyles.buttonText}>Send Payment</Text>
          )}
        </TouchableOpacity>
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
