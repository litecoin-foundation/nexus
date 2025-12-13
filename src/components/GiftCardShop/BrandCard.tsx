import React, {useContext} from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {Brand, formatCurrency} from '../../services/giftcards';
import {colors, getSpacing, getBorderRadius, getFontSize} from './theme';
import {toggleWishlistBrand} from '../../reducers/nexusshopaccount';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

import {ScreenSizeContext} from '../../context/screenSize';

interface BrandCardProps {
  brand: Brand;
  onPress: () => void;
}

export function BrandCard({brand, onPress}: BrandCardProps) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();
  const wishlistBrands = useAppSelector(
    state => state.nexusshopaccount?.wishlistBrands,
  );

  const isInWishlist = wishlistBrands
    ? wishlistBrands.some(wishlistBrand => wishlistBrand.slug === brand.slug)
    : false;

  const minAmount = Number(
    brand.digital_face_value_limits?.lower || brand.denominations?.[0],
  );
  const maxAmount = Number(
    brand.digital_face_value_limits?.upper ||
      brand.denominations?.[brand.denominations.length - 1],
  );

  const handleWishlistToggle = () => {
    dispatch(toggleWishlistBrand(brand));
  };

  return (
    <View style={styles.brandCardContainer}>
      <TouchableOpacity
        style={styles.brandCard}
        onPress={onPress}
        activeOpacity={0.7}>
        {brand.logo_url ? (
          <Image source={{uri: brand.logo_url}} style={styles.brandLogo} />
        ) : (
          <View style={[styles.brandLogo, styles.brandLogoPlaceholder]}>
            <Text style={styles.brandLogoText}>{brand.name.charAt(0)}</Text>
          </View>
        )}
        <Text style={styles.brandName} numberOfLines={1}>
          {brand.name}
        </Text>
        {typeof minAmount === 'number' &&
        !isNaN(minAmount) &&
        typeof maxAmount === 'number' &&
        !isNaN(maxAmount) &&
        brand.currency ? (
          <Text style={styles.brandPrice}>
            {minAmount === maxAmount
              ? formatCurrency(minAmount, brand.currency)
              : `${formatCurrency(minAmount, brand.currency)} - ${formatCurrency(maxAmount, brand.currency)}`}
          </Text>
        ) : (
          <></>
        )}
      </TouchableOpacity>
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
      position: 'relative',
    },
    brandCard: {
      width: screenWidth * 0.45,
      backgroundColor: colors.white,
      borderRadius: getBorderRadius(screenHeight).md,
      padding: getSpacing(screenHeight).md,
      marginBottom: getSpacing(screenHeight).md,
      alignItems: 'center',
      shadowColor: colors.black,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    wishlistButton: {
      position: 'absolute',
      top: getSpacing(screenHeight).sm,
      right: getSpacing(screenHeight).sm,
      width: screenWidth * 0.08,
      height: screenWidth * 0.08,
      borderRadius: screenWidth * 0.04,
      backgroundColor: colors.white,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.black,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    wishlistIcon: {
      fontSize: getFontSize(screenHeight).lg,
      color: colors.primary,
    },
    brandLogo: {
      width: screenWidth * 0.2,
      height: screenWidth * 0.2,
      borderRadius: getBorderRadius(screenHeight).sm,
      marginBottom: getSpacing(screenHeight).sm,
    },
    brandLogoPlaceholder: {
      backgroundColor: colors.grayLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    brandLogoText: {
      fontSize: getFontSize(screenHeight).xl,
      fontWeight: '700',
      color: colors.gray,
    },
    brandName: {
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    brandPrice: {
      fontSize: getFontSize(screenHeight).sm,
      color: colors.textSecondary,
      marginTop: getSpacing(screenHeight).xs,
    },
  });
