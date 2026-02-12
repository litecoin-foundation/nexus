import React, {useState, useContext} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Image,
} from 'react-native';
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

  const openUrl = () => {
    if (giftCard.redeemUrl) {
      Linking.openURL(giftCard.redeemUrl);
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
          <Text style={styles.brandLogoText}>{giftCard.brand}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardDate}>
            {formatDate(giftCard.purchasedAt)}
          </Text>
          <Text style={styles.cardAmount}>
            {giftCard.faceValue.currency === 'USD' ? '$' : ''}
            {giftCard.faceValue.amount}
          </Text>
        </View>
        <View style={styles.chevronContainer}>
          <Image
            source={backIcon}
            style={[
              styles.chevronIcon,
              {transform: [{rotate: expanded ? '90deg' : '-90deg'}]},
            ]}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          {giftCard.redeemCode ? (
            <View style={styles.codeRow}>
              <View style={styles.codePill}>
                <Text style={styles.codePillText}>{giftCard.redeemCode}</Text>
              </View>
              <TouchableOpacity
                onPress={copyCode}
                style={styles.copyIconButton}>
                <Text style={styles.copyIcon}>⧉</Text>
              </TouchableOpacity>
            </View>
          ) : (
            giftCard.redeemUrl && (
              <TouchableOpacity style={styles.detailButton} onPress={openUrl}>
                <Text style={styles.detailButtonText}>View Gift Card</Text>
              </TouchableOpacity>
            )
          )}
        </View>
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
          <Text style={styles.brandLogoText}>{pendingGiftCard.brand}</Text>
        </View>
        <View style={styles.pendingCardInfo}>
          <Text style={styles.cardDate}>
            {formatDate(pendingGiftCard.createdAt)}
          </Text>
          <Text style={styles.pendingCardAmount}>
            {pendingGiftCard.currency === 'USD' ? '$' : ''}
            {pendingGiftCard.amount}
          </Text>
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
    expandedContent: {
      paddingHorizontal: getSpacing(screenWidth, screenHeight).md,
      paddingBottom: getSpacing(screenWidth, screenHeight).md,
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
      height: screenHeight * 0.04,
      backgroundColor: colors.primary,
      paddingVertical: getSpacing(screenWidth, screenHeight).sm,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).md,
      borderRadius: getBorderRadius(screenHeight).sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailButtonText: {
      color: colors.white,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
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
