import React, {useContext, useState, useRef} from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  DeviceEventEmitter,
} from 'react-native';
import type {StackNavigationOptions} from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import {useHeaderHeight} from '@react-navigation/elements';
import {InitiatePurchaseResponseData} from '../../services/giftcards';
import {useAppDispatch} from '../../store/hooks';
import {sendOnchainPayment} from '../../reducers/transaction';
import PlasmaModal from '../../components/Modals/PlasmaModal';
import PinModalContent from '../../components/Modals/PinModalContent';
import HeaderButton from '../../components/Buttons/HeaderButton';

import {
  colors,
  getSpacing,
  getBorderRadius,
  getFontSize,
  getCommonStyles,
} from '../../components/GiftCardShop/theme';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
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

interface PayForGiftCardScreenProps {
  route: {
    params: {
      initiateResponse: InitiatePurchaseResponseData;
      onPaymentSuccess: (txid: string) => void;
    };
  };
  navigation: any;
}

const PayForGiftCardScreen: React.FC<PayForGiftCardScreenProps> = ({
  route,
  navigation,
}) => {
  const {initiateResponse, onPaymentSuccess} = route.params;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const deviceHeaderHeight = useHeaderHeight();
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, deviceHeaderHeight);
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
      navigation.goBack();
      onPaymentSuccess(txid);
      setLoading(false);
    } catch (err) {
      setError(String(err));
      setIsPinModalOpened(false);
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      style={styles.container}
      colors={['#F6F9FC', 'rgb(238,244,249)']}>
      <CustomSafeAreaView styles={styles.safeArea} edges={['bottom']}>
        <View style={styles.topContainer}>
          <CustomSafeAreaView styles={styles.safeArea2} edges={['top']}>
            <View style={styles.titles}>
              <TranslateText
                textKey="send_to_invoice"
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                textStyle={[commonStyles.subtitle, styles.title]}
                numberOfLines={2}
              />
            </View>

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
                  textValue={initiateResponse.paymentAmountLtc}
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
                  maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                  textStyle={styles.detailValue}
                  numberOfLines={3}
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
          </CustomSafeAreaView>
        </View>

        <View style={styles.buttonContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <TranslateText
                textValue={error}
                maxSizeInPixels={SCREEN_HEIGHT * 0.014}
                textStyle={styles.errorMessage}
                numberOfLines={1}
              />
            </View>
          )}

          <TouchableOpacity
            style={[commonStyles.buttonRoundedSecondary, styles.backButton]}
            onPress={() => navigation.goBack()}
            disabled={loading}>
            <TranslateText
              textKey="back"
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.018}
              textStyle={commonStyles.buttonTextBlack}
              numberOfLines={1}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              commonStyles.buttonRounded,
              loading && commonStyles.buttonDisabled,
            ]}
            onPress={() =>
              handleAuthenticationRequired('send-giftcard-payment')
            }
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <TranslateText
                textKey="send_payment"
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                textStyle={commonStyles.buttonText}
                numberOfLines={1}
              />
            )}
          </TouchableOpacity>
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
              handleValidationSuccess={() => handleCompletePurchase()}
            />
          )}
        />
      </CustomSafeAreaView>
    </LinearGradient>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  deviceHeaderHeight: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    safeArea2: {
      width: '100%',
      height: '100%',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    topContainer: {
      width: '100%',
      height: screenHeight * 0.65,
      backgroundColor: colors.primary,
      borderBottomLeftRadius: screenHeight * 0.04,
      borderBottomRightRadius: screenHeight * 0.04,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).lg,
      paddingBottom: getSpacing(screenWidth, screenHeight).lg,
    },
    titles: {
      width: '100%',
    },
    title: {
      paddingTop: getSpacing(screenWidth, screenHeight).header,
    },
    paymentDetails: {
      width: '100%',
      backgroundColor: colors.white,
      borderRadius: screenHeight * 0.025,
      paddingVertical: getSpacing(screenWidth, screenHeight).xl,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).lg,
    },
    detailRow: {
      width: '100%',
      minHeight: screenHeight * 0.035,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: getSpacing(screenWidth, screenHeight).md,
    },
    detailLabel: {
      flexBasis: '35%',
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '600',
      color: colors.text,
    },
    detailValue: {
      flexBasis: '65%',
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '600',
      color: colors.text,
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
    buttonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.03,
      left: 0,
      width: '100%',
      paddingHorizontal: getSpacing(screenWidth, screenHeight).xl,
    },
    backButton: {
      marginBottom: getSpacing(screenWidth, screenHeight).md,
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export const PayForGiftCardScreenOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width, height} = useContext(ScreenSizeContext);
  const deviceHeaderHeight = useHeaderHeight();
  const styles = getStyles(width, height, deviceHeaderHeight);

  return {
    headerTransparent: true,
    headerTitle: () => (
      <TranslateText
        textKey="complete_payment"
        domain="nexusShop"
        maxSizeInPixels={height * 0.02}
        textStyle={styles.headerTitle}
        numberOfLines={1}
      />
    ),
    headerTitleAlign: 'left',
    headerTitleContainerStyle: {
      left: 7,
    },
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default PayForGiftCardScreen;
