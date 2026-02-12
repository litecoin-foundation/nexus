import React, {useContext, useState} from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

import {toggleWishlistBrand} from '../../reducers/nexusshopaccount';
import {Brand, formatCurrency} from '../../services/giftcards';

import {colors, getSpacing, getFontSize} from './theme';
import {ScreenSizeContext} from '../../context/screenSize';

const backIcon = require('../../assets/images/back-icon.png');

interface BrandCardProps {
  brand: Brand;
  currency: string;
  onPress: (amount?: number) => void;
}

export function BrandCard({brand, currency, onPress}: BrandCardProps) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const wishlistBrands = useAppSelector(
    state => state.nexusshopaccount?.wishlistBrands,
  );

  const isInWishlist = wishlistBrands
    ? wishlistBrands.some(wishlistBrand => wishlistBrand.slug === brand.slug)
    : false;

  const handleWishlistToggle = () => {
    dispatch(toggleWishlistBrand(brand));
  };

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
              {formatCurrency(currency)}
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
                  {formatCurrency(currency)}
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

      <TouchableOpacity
        style={styles.wishlistButton}
        onPress={handleWishlistToggle}
        activeOpacity={0.7}>
        <Text style={styles.wishlistIcon}>{isInWishlist ? '♥' : '♡'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    brandCardContainer: {
      backgroundColor: colors.white,
      borderRadius: screenHeight * 0.016,
      marginBottom: getSpacing(screenWidth, screenHeight).md,
      shadowColor: colors.black,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    brandCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: screenHeight * 0.01,
    },
    logoContainer: {
      width: screenWidth * 0.2,
      height: screenHeight * 0.08,
      backgroundColor: colors.grayLight,
      borderRadius: screenHeight * 0.012,
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
      fontFamily: 'Satoshi Variable',
      color: colors.gray,
    },
    brandInfo: {
      flex: 1,
      marginLeft: screenWidth * 0.03,
    },
    brandName: {
      fontSize: screenHeight * 0.018,
      fontWeight: '500',
      fontFamily: 'Satoshi Variable',
      color: colors.text,
    },
    brandPrice: {
      fontSize: screenHeight * 0.018,
      fontWeight: '500',
      fontFamily: 'Satoshi Variable',
      color: colors.text,
      marginTop: screenHeight * 0.005,
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
      paddingHorizontal: screenHeight * 0.01,
      paddingBottom: screenHeight * 0.01,
    },
    denominationsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: screenHeight * 0.01,
    },
    denominationsRowLeft: {
      justifyContent: 'center',
      gap: screenWidth * 0.03,
    },
    denominationButton: {
      minWidth: screenWidth * 0.15,
      minHeight: screenWidth * 0.12,
      borderWidth: 1,
      borderColor: colors.grayLight,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: screenHeight * 0.012,
    },
    denominationButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    denominationText: {
      fontSize: screenHeight * 0.017,
      fontWeight: '500',
      fontFamily: 'Satoshi Variable',
      color: colors.text,
    },
    denominationTextSelected: {
      color: colors.white,
    },
    purchaseButton: {
      width: '100%',
      minHeight: screenWidth * 0.12,
      backgroundColor: colors.primary,
      borderRadius: screenHeight * 0.012,
      alignItems: 'center',
      justifyContent: 'center',
    },
    purchaseButtonText: {
      fontSize: screenHeight * 0.015,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      color: colors.white,
      textTransform: 'uppercase',
    },
    wishlistButton: {
      position: 'absolute',
      top: (screenHeight * 0.1) / 2 - (screenWidth * 0.1) / 2,
      right: screenWidth * 0.15,
      width: screenWidth * 0.1,
      height: screenWidth * 0.1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    wishlistIcon: {
      fontSize: screenHeight * 0.03,
      color: colors.primary,
    },
  });
