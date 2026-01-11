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
import {GiftCard} from '../../services/giftcards';
import {colors, getSpacing, getBorderRadius, getFontSize} from './theme';

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

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: colors.white,
      borderRadius: getBorderRadius(screenHeight).lg,
      marginBottom: getSpacing(screenWidth, screenHeight).md,
      shadowColor: colors.black,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      overflow: 'hidden',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: getSpacing(screenWidth, screenHeight).md,
    },
    logoContainer: {
      width: screenWidth * 0.2,
      height: screenWidth * 0.15,
      backgroundColor: colors.grayLight,
      borderRadius: getBorderRadius(screenHeight).md,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      padding: getSpacing(screenWidth, screenHeight).sm,
    },
    brandLogoText: {
      fontSize: getFontSize(screenHeight).sm,
      fontWeight: '700',
      color: colors.text,
      textTransform: 'capitalize',
      textAlign: 'center',
    },
    cardInfo: {
      flex: 1,
      marginLeft: getSpacing(screenWidth, screenHeight).md,
    },
    cardDate: {
      fontSize: getFontSize(screenHeight).sm,
      color: colors.gray,
    },
    cardAmount: {
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '600',
      color: colors.text,
      marginTop: getSpacing(screenWidth, screenHeight).xs,
    },
    chevronContainer: {
      width: screenWidth * 0.1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevronIcon: {
      width: screenWidth * 0.05,
      height: screenWidth * 0.05,
      tintColor: colors.gray,
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
      fontWeight: '600',
    },
  });
