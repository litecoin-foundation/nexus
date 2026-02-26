import React, {useEffect, useContext, useMemo} from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import Animated from 'react-native-reanimated';

import PlasmaModal from './PlasmaModal';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {PopUpContext} from '../../context/popUpContext';
import {
  colors,
  getSpacing,
  getFontSize,
  getCommonStyles,
} from '../../components/GiftCardShop/theme';

export interface GCPaymentDetails {
  brand: string;
  amount: number;
  currency: string;
  paymentAmountLtc: string;
  paymentAddress: string;
}

interface Props {
  isVisible: boolean;
  close: () => void;
  details: GCPaymentDetails;
}

const SuccessGCPaymentContent: React.FC<Props> = ({
  isVisible,
  close,
  details,
}) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );
  const commonStyles = useMemo(
    () => getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  const {showPopUp} = useContext(PopUpContext);

  const modal = useMemo(
    () => (
      <PlasmaModal
        isOpened={isVisible}
        close={close}
        isFromBottomToTop={true}
        animDuration={250}
        gapInPixels={0}
        backSpecifiedStyle={styles.backdrop}
        renderBody={(_, __, ___, ____, cardTranslateAnim) => (
          <Animated.View style={[styles.modal, cardTranslateAnim]}>
            <View style={styles.header}>
              <TranslateText
                textKey="payment_sent"
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.022}
                textStyle={styles.headerText}
                numberOfLines={1}
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
                  textValue={details.brand}
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
                  textValue={`${details.amount} ${details.currency}`}
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
                  textValue={details.paymentAmountLtc}
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
                  textValue={details.paymentAddress}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                  textStyle={styles.detailValue}
                  numberOfLines={3}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[commonStyles.buttonRounded, styles.doneButton]}
              onPress={close}
              activeOpacity={0.7}>
              <TranslateText
                textKey="done"
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                textStyle={commonStyles.buttonText}
                numberOfLines={1}
              />
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    ),
    [isVisible, close, details, styles, commonStyles, SCREEN_HEIGHT],
  );

  useEffect(() => {
    showPopUp(modal);
  }, [showPopUp, modal]);

  return <></>;
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    backdrop: {
      backgroundColor: 'rgba(19,58,138, 0.6)',
    },
    modal: {
      position: 'absolute',
      bottom: 0,
      backgroundColor: '#fff',
      width: screenWidth,
      borderTopLeftRadius: screenHeight * 0.03,
      borderTopRightRadius: screenHeight * 0.03,
      paddingBottom: screenHeight * 0.04,
      shadowColor: '#000000',
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 2,
      shadowOffset: {
        height: -3,
        width: 0,
      },
    },
    header: {
      alignItems: 'center',
      paddingTop: getSpacing(screenWidth, screenHeight).xl,
      paddingBottom: getSpacing(screenWidth, screenHeight).md,
    },
    headerText: {
      fontSize: screenHeight * 0.022,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      color: colors.text,
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
      minHeight: screenHeight * 0.04,
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
    doneButton: {
      marginHorizontal: getSpacing(screenWidth, screenHeight).lg,
    },
  });

export default SuccessGCPaymentContent;
