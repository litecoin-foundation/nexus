import React, {useState, useEffect, useContext} from 'react';
import {View, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';

import {GiftCard, PendingGiftCardPurchase} from '../../services/giftcards';

import {colors, getSpacing, getBorderRadius, getFontSize} from './theme';
import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

const backIcon = require('../../assets/images/back-icon.png');

interface GiftCardItemProps {
  giftCard: GiftCard;
}

export function GiftCardItem({giftCard}: GiftCardItemProps) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const heightAnim = useSharedValue(0);
  const opacityAnim = useSharedValue(0);
  const chevronRotation = useSharedValue(-90);

  useEffect(() => {
    if (contentHeight !== null) {
      if (expanded) {
        heightAnim.value = withTiming(contentHeight, {duration: 300});
        opacityAnim.value = withTiming(1, {duration: 250});
        chevronRotation.value = withTiming(90, {duration: 300});
      } else {
        heightAnim.value = withTiming(0, {duration: 300});
        opacityAnim.value = withTiming(0, {duration: 200});
        chevronRotation.value = withTiming(-90, {duration: 300});
      }
    }
  }, [expanded, contentHeight, heightAnim, opacityAnim, chevronRotation]);

  const animatedExpandedStyle = useAnimatedStyle(() => ({
    height: contentHeight === null ? 'auto' : heightAnim.value,
    opacity: contentHeight === null ? 0 : opacityAnim.value,
    overflow: 'hidden' as const,
  }));

  const animatedChevronStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${chevronRotation.value}deg`}],
  }));

  const navigation = useNavigation<any>();

  const openUrl = () => {
    if (giftCard.redeemUrl) {
      navigation.navigate('WebPage', {uri: giftCard.redeemUrl});
    }
  };

  const copyCode = () => {
    if (giftCard.redeemCode) {
      Clipboard.setString(giftCard.redeemCode);
      Alert.alert('Copied!', 'Gift card code copied to clipboard');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}>
        <View style={styles.logoContainer}>
          <TranslateText
            textValue={giftCard.brand}
            textStyle={styles.brandLogoText}
            maxSizeInPixels={SCREEN_HEIGHT * 0.0135}
          />
        </View>
        <View style={styles.cardInfo}>
          <TranslateText
            textValue={formatDate(giftCard.purchasedAt)}
            textStyle={styles.cardDate}
            maxSizeInPixels={SCREEN_HEIGHT * 0.0135}
          />
          <TranslateText
            textValue={`${giftCard.faceValue.currency === 'USD' ? '$' : ''}${giftCard.faceValue.amount}`}
            textStyle={styles.cardAmount}
            maxSizeInPixels={SCREEN_HEIGHT * 0.0155}
          />
        </View>
        <View style={styles.chevronContainer}>
          <Animated.Image
            source={backIcon}
            style={[styles.chevronIcon, animatedChevronStyle]}
          />
        </View>
      </TouchableOpacity>

      {/* Hidden measurement view */}
      {contentHeight === null && (
        <View
          style={styles.measurementContainer}
          onLayout={event => {
            const {height} = event.nativeEvent.layout;
            if (height > 0) {
              setContentHeight(height);
            }
          }}>
          <View style={styles.expandedContent}>
            {giftCard.redeemCode ? (
              <View style={styles.codeRow}>
                <View style={styles.codePill}>
                  <TranslateText
                    textValue={giftCard.redeemCode}
                    textStyle={styles.codePillText}
                    maxSizeInPixels={getFontSize(SCREEN_HEIGHT).md}
                  />
                </View>
                <TouchableOpacity style={styles.copyIconButton}>
                  <TranslateText
                    textValue="⧉"
                    textStyle={styles.copyIcon}
                    maxSizeInPixels={getFontSize(SCREEN_HEIGHT).lg}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              giftCard.redeemUrl && (
                <TouchableOpacity
                  style={styles.detailButton}
                  activeOpacity={0.7}>
                  <TranslateText
                    textValue="View Gift Card"
                    textStyle={styles.detailButtonText}
                    maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                  />
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      )}

      {/* Animated content */}
      {contentHeight !== null && (
        <Animated.View style={animatedExpandedStyle}>
          <View style={styles.expandedContent}>
            {giftCard.redeemCode ? (
              <View style={styles.codeRow}>
                <View style={styles.codePill}>
                  <TranslateText
                    textValue={giftCard.redeemCode}
                    textStyle={styles.codePillText}
                    maxSizeInPixels={getFontSize(SCREEN_HEIGHT).md}
                  />
                </View>
                <TouchableOpacity
                  onPress={copyCode}
                  style={styles.copyIconButton}>
                  <TranslateText
                    textValue="⧉"
                    textStyle={styles.copyIcon}
                    maxSizeInPixels={getFontSize(SCREEN_HEIGHT).lg}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              giftCard.redeemUrl && (
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={openUrl}
                  activeOpacity={0.7}>
                  <TranslateText
                    textValue="View Gift Card"
                    textStyle={styles.detailButtonText}
                    maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                  />
                </TouchableOpacity>
              )
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

interface PendingGiftCardItemProps {
  pendingGiftCard: PendingGiftCardPurchase;
}

export function PendingGiftCardItem({
  pendingGiftCard,
}: PendingGiftCardItemProps) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusTextKey = (status: PendingGiftCardPurchase['status']) => {
    switch (status) {
      case 'pending_payment':
        return 'pending_payment';
      case 'payment_received':
        return 'payment_received';
      default:
        return 'pending';
    }
  };

  return (
    <View style={styles.pendingCardContainer}>
      <View style={styles.pendingCard}>
        <View style={styles.pendingLogoContainer}>
          <TranslateText
            textValue={pendingGiftCard.brand}
            textStyle={styles.brandLogoText}
            maxSizeInPixels={SCREEN_HEIGHT * 0.0135}
          />
        </View>
        <View style={styles.pendingCardInfo}>
          <TranslateText
            textValue={formatDate(pendingGiftCard.createdAt)}
            textStyle={styles.cardDate}
            maxSizeInPixels={SCREEN_HEIGHT * 0.0135}
          />
          <TranslateText
            textValue={`${pendingGiftCard.currency === 'USD' ? '$' : ''}${pendingGiftCard.amount}`}
            textStyle={styles.pendingCardAmount}
            maxSizeInPixels={SCREEN_HEIGHT * 0.014}
          />
        </View>
        <View style={styles.statusBadge}>
          <TranslateText
            textKey={getStatusTextKey(pendingGiftCard.status)}
            domain="nexusShop"
            maxSizeInPixels={SCREEN_HEIGHT * 0.014}
            textStyle={styles.statusText}
          />
        </View>
      </View>
    </View>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: colors.white,
      borderRadius: screenHeight * 0.016,
      borderWidth: screenHeight * 0.002,
      borderColor: '#F0F0F0',
      marginBottom: getSpacing(screenWidth, screenHeight).sm,
      overflow: 'hidden',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: screenHeight * 0.0085,
    },
    logoContainer: {
      width: screenWidth * 0.17,
      height: screenHeight * 0.06,
      backgroundColor: colors.grayLight,
      borderRadius: screenHeight * 0.01,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    brandLogoText: {
      fontSize: screenHeight * 0.0135,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      color: colors.text,
      textTransform: 'capitalize',
      textAlign: 'center',
    },
    cardInfo: {
      flex: 1,
      marginLeft: screenWidth * 0.025,
    },
    cardDate: {
      fontSize: screenHeight * 0.0135,
      fontFamily: 'Satoshi Variable',
      color: colors.textSecondary,
    },
    cardAmount: {
      fontSize: screenHeight * 0.0155,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      color: colors.text,
      marginTop: screenHeight * 0.003,
    },
    chevronContainer: {
      width: screenWidth * 0.1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevronIcon: {
      width: screenWidth * 0.037,
      height: screenWidth * 0.037,
      tintColor: colors.lightBlack,
      resizeMode: 'contain',
    },
    measurementContainer: {
      position: 'absolute',
      opacity: 0,
      zIndex: -1,
      pointerEvents: 'none',
    },
    expandedContent: {
      paddingHorizontal: screenHeight * 0.01,
      paddingBottom: screenHeight * 0.01,
    },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    codePill: {
      backgroundColor: colors.text,
      paddingVertical: getSpacing(screenWidth, screenHeight).sm,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).lg,
      borderRadius: getBorderRadius(screenHeight).md,
    },
    codePillText: {
      color: colors.white,
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '600',
      fontFamily: 'monospace',
      letterSpacing: 1,
    },
    copyIconButton: {
      marginLeft: getSpacing(screenWidth, screenHeight).sm,
      padding: getSpacing(screenWidth, screenHeight).sm,
      borderWidth: 1,
      borderColor: colors.grayMedium,
      borderRadius: getBorderRadius(screenHeight).sm,
    },
    copyIcon: {
      fontSize: getFontSize(screenHeight).lg,
      color: colors.text,
    },
    detailButton: {
      width: '100%',
      minHeight: screenWidth * 0.12,
      backgroundColor: colors.primary,
      borderRadius: screenHeight * 0.012,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailButtonText: {
      fontSize: screenHeight * 0.015,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      color: colors.white,
      textTransform: 'uppercase',
    },
    statusBadge: {
      backgroundColor: colors.warning,
      paddingVertical: getSpacing(screenWidth, screenHeight).xs,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).sm,
      borderRadius: getBorderRadius(screenHeight).sm,
    },
    statusText: {
      color: colors.white,
      fontSize: getFontSize(screenHeight).sm,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
    },
    pendingCardContainer: {
      width: screenWidth * 0.7,
      backgroundColor: colors.white,
      borderRadius: screenHeight * 0.016,
      borderWidth: screenHeight * 0.002,
      borderColor: '#F0F0F0',
      overflow: 'hidden',
    },
    pendingCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: screenHeight * 0.0085,
    },
    pendingLogoContainer: {
      width: screenWidth * 0.135,
      height: screenHeight * 0.055,
      backgroundColor: colors.grayLight,
      borderRadius: screenHeight * 0.01,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    pendingCardInfo: {
      flex: 1,
      marginLeft: screenWidth * 0.025,
    },
    pendingCardAmount: {
      fontSize: screenHeight * 0.014,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      color: colors.text,
      marginTop: screenHeight * 0.003,
    },
  });
