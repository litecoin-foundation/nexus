import React, {useContext, useState} from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';

import {Brand, formatCurrency} from '../../services/giftcards';
import {colors, getSpacing, getBorderRadius, getFontSize} from './theme';

import {ScreenSizeContext} from '../../context/screenSize';

const backIcon = require('../../assets/images/back-icon.png');

interface BrandCardProps {
  brand: Brand;
  onPress: (amount?: number) => void;
}

export function BrandCard({brand, onPress}: BrandCardProps) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const minAmount = Number(
    brand.digital_face_value_limits?.lower || brand.denominations?.[0],
  );
  const maxAmount = Number(
    brand.digital_face_value_limits?.upper ||
      brand.denominations?.[brand.denominations.length - 1],
  );

  const defaultDenominations = [10, 15, 20, 50, 100].filter(
    d => d >= minAmount && d <= maxAmount,
  );
  const denominations = (brand.denominations || defaultDenominations).slice(
    0,
    5,
  );

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
  };

  const handlePurchase = () => {
    onPress(selectedAmount || undefined);
  };

  const formatDenomination = (value: number | string) => {
    const num = Number(value);
    return Number.isInteger(num)
      ? num.toString()
      : num.toFixed(2).replace(/\.00$/, '');
  };

  return (
    <View style={styles.brandCardContainer}>
      <TouchableOpacity
        style={styles.brandCard}
        onPress={handleToggle}
        activeOpacity={0.7}>
        <View style={styles.logoContainer}>
          {brand.logo_url ? (
            <Image source={{uri: brand.logo_url}} style={styles.brandLogo} />
          ) : (
            <View style={[styles.brandLogo, styles.brandLogoPlaceholder]}>
              <Text style={styles.brandLogoText}>{brand.name.charAt(0)}</Text>
            </View>
          )}
        </View>
        <View style={styles.brandInfo}>
          <Text style={styles.brandName} numberOfLines={1}>
            {brand.name}
          </Text>
          {typeof minAmount === 'number' &&
          !isNaN(minAmount) &&
          typeof maxAmount === 'number' &&
          !isNaN(maxAmount) ? (
            <Text style={styles.brandPrice}>
              {minAmount === maxAmount
                ? `${minAmount}`
                : `${minAmount} - ${maxAmount}`}
            </Text>
          ) : null}
        </View>
        <View style={styles.chevronContainer}>
          <Image
            source={backIcon}
            style={[
              styles.chevronIcon,
              {transform: [{rotate: isExpanded ? '90deg' : '-90deg'}]},
            ]}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View
            style={[
              styles.denominationsRow,
              denominations.length < 5 && styles.denominationsRowLeft,
            ]}>
            {denominations.map(amount => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.denominationButton,
                  selectedAmount === amount &&
                    styles.denominationButtonSelected,
                ]}
                onPress={() => handleAmountSelect(Number(amount))}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.denominationText,
                    selectedAmount === amount &&
                      styles.denominationTextSelected,
                  ]}>
                  {brand.currency === 'USD' ? '$' : ''}
                  {formatDenomination(amount)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={handlePurchase}
            activeOpacity={0.7}>
            <Text style={styles.purchaseButtonText}>Purchase gift card</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    brandCardContainer: {
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
    brandCard: {
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
    },
    brandLogo: {
      width: '80%',
      height: '80%',
      resizeMode: 'contain',
    },
    brandLogoPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.grayLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    brandLogoText: {
      fontSize: getFontSize(screenHeight).xl,
      fontWeight: '700',
      color: colors.gray,
    },
    brandInfo: {
      flex: 1,
      marginLeft: getSpacing(screenWidth, screenHeight).md,
    },
    brandName: {
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '500',
      color: colors.text,
    },
    brandPrice: {
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
    denominationsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: getSpacing(screenWidth, screenHeight).md,
    },
    denominationsRowLeft: {
      justifyContent: 'flex-start',
      gap: getSpacing(screenWidth, screenHeight).sm,
    },
    denominationButton: {
      paddingVertical: getSpacing(screenWidth, screenHeight).sm,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).md,
      borderRadius: getBorderRadius(screenHeight).md,
      borderWidth: 1,
      borderColor: colors.grayLight,
      backgroundColor: colors.white,
      minWidth: screenWidth * 0.15,
      alignItems: 'center',
    },
    denominationButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    denominationText: {
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '500',
      color: colors.text,
    },
    denominationTextSelected: {
      color: colors.white,
    },
    purchaseButton: {
      backgroundColor: colors.primary,
      borderRadius: getBorderRadius(screenHeight).lg,
      paddingVertical: getSpacing(screenWidth, screenHeight).md,
      alignItems: 'center',
    },
    purchaseButtonText: {
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '600',
      color: colors.white,
    },
  });
