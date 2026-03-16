import React, {useContext} from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {Brand, GiftCard} from '../../services/giftcards';
import {
  colors,
  getSpacing,
  getBorderRadius,
  getFontSize,
  getCommonStyles,
} from './theme';
import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface PurchaseSuccessProps {
  giftCard: GiftCard;
  brand: Brand;
  onDone: () => void;
}

export function PurchaseSuccess({
  giftCard,
  brand,
  onDone,
}: PurchaseSuccessProps) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const copyCode = () => {
    if (giftCard.redeemCode) {
      Clipboard.setString(giftCard.redeemCode);
      Alert.alert('Copied!', 'Gift card code copied to clipboard');
    }
  };

  const openUrl = () => {
    if (giftCard.redeemUrl) {
      Linking.openURL(giftCard.redeemUrl);
    }
  };

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={styles.successContainer}>
      <View style={commonStyles.successIcon}>
        <TranslateText
          textValue="✓"
          maxSizeInPixels={40}
          textStyle={styles.successIconText}
          numberOfLines={1}
        />
      </View>

      <TranslateText
        textKey="purchase_complete"
        domain="nexusShop"
        maxSizeInPixels={SCREEN_HEIGHT * 0.032}
        textStyle={commonStyles.title}
        numberOfLines={1}
      />

      <View style={styles.giftCardDisplay}>
        <TranslateText
          textValue={brand.name}
          maxSizeInPixels={SCREEN_HEIGHT * 0.018}
          textStyle={styles.giftCardBrand}
          numberOfLines={1}
        />
        <TranslateText
          textValue={String(giftCard.faceValue.amount)}
          maxSizeInPixels={36}
          textStyle={styles.giftCardAmount}
          numberOfLines={1}
        />

        {giftCard.redeemUrl && (
          <TouchableOpacity style={styles.redeemButton} onPress={openUrl}>
            <TranslateText
              textKey="open_gift_card"
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.016}
              textStyle={styles.redeemButtonText}
              numberOfLines={1}
            />
          </TouchableOpacity>
        )}

        {giftCard.redeemCode && (
          <View style={styles.codeContainer}>
            <TranslateText
              textKey="gift_card_code"
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.016}
              textStyle={commonStyles.label}
              numberOfLines={1}
            />
            <View style={styles.codeRow}>
              <TranslateText
                textValue={giftCard.redeemCode}
                maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                textStyle={styles.codeText}
                numberOfLines={1}
              />
              <TouchableOpacity style={styles.copyButton} onPress={copyCode}>
                <TranslateText
                  textKey="copy"
                  domain="nexusShop"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.016}
                  textStyle={styles.copyButtonText}
                  numberOfLines={1}
                />
              </TouchableOpacity>
            </View>
            {giftCard.pin && (
              <View
                style={{marginTop: getSpacing(SCREEN_WIDTH, SCREEN_HEIGHT).md}}>
                <TranslateText
                  textKey="pin_label"
                  domain="nexusShop"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.016}
                  textStyle={commonStyles.label}
                  numberOfLines={1}
                />
                <TranslateText
                  textValue={giftCard.pin}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                  textStyle={styles.codeText}
                  numberOfLines={1}
                />
              </View>
            )}
          </View>
        )}

        <TranslateText
          textValue={`Expires: ${new Date(giftCard.expirationDate).toLocaleDateString()}`}
          maxSizeInPixels={SCREEN_HEIGHT * 0.014}
          textStyle={[
            commonStyles.caption,
            {marginTop: getSpacing(SCREEN_WIDTH, SCREEN_HEIGHT).md},
          ]}
          numberOfLines={1}
        />
      </View>

      <TouchableOpacity
        style={[commonStyles.button, {backgroundColor: colors.success}]}
        onPress={onDone}>
        <TranslateText
          textKey="done"
          domain="nexusShop"
          maxSizeInPixels={SCREEN_HEIGHT * 0.018}
          textStyle={commonStyles.buttonText}
          numberOfLines={1}
        />
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    successContainer: {
      padding: getSpacing(screenWidth, screenHeight).lg,
      alignItems: 'center',
    },
    successIconText: {
      fontSize: 40,
      color: colors.white,
    },
    giftCardDisplay: {
      backgroundColor: colors.white,
      borderRadius: getBorderRadius(screenHeight).lg,
      padding: getSpacing(screenWidth, screenHeight).lg,
      width: '100%',
      alignItems: 'center',
      marginVertical: getSpacing(screenWidth, screenHeight).lg,
      shadowColor: colors.black,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    giftCardBrand: {
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '600',
      color: colors.text,
    },
    giftCardAmount: {
      fontSize: 36,
      fontWeight: '700',
      color: colors.success,
      marginVertical: getSpacing(screenWidth, screenHeight).sm,
    },
    redeemButton: {
      backgroundColor: colors.primary,
      paddingVertical: getSpacing(screenWidth, screenHeight).md,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).xl,
      borderRadius: getBorderRadius(screenHeight).sm,
      marginTop: getSpacing(screenWidth, screenHeight).md,
    },
    redeemButtonText: {
      color: colors.white,
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '600',
    },
    codeContainer: {
      backgroundColor: colors.grayLight,
      padding: getSpacing(screenWidth, screenHeight).md,
      borderRadius: getBorderRadius(screenHeight).sm,
      width: '100%',
      marginTop: getSpacing(screenWidth, screenHeight).md,
    },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    codeText: {
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '600',
      fontFamily: 'monospace',
      letterSpacing: 2,
    },
    copyButton: {
      backgroundColor: colors.primary,
      paddingVertical: getSpacing(screenWidth, screenHeight).sm,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).md,
      borderRadius: getBorderRadius(screenHeight).sm,
    },
    copyButtonText: {
      color: colors.white,
      fontWeight: '600',
    },
  });
