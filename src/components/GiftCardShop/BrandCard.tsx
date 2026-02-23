import React, {useContext, useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
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
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function BrandCard({
  brand,
  currency,
  onPress,
  isExpanded = false,
  onToggle,
}: BrandCardProps) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const heightAnim = useSharedValue(0);
  const opacityAnim = useSharedValue(0);
  const chevronRotation = useSharedValue(isExpanded ? 90 : -90);

  const isLoggedIn = useAppSelector(
    state => state.nexusshopaccount?.account?.isLoggedIn,
  );

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

  const denominations = (() => {
    const MAX_BUTTONS = 5;
    const allDenoms = brand.denominations?.map(Number).sort((a, b) => a - b);

    if (allDenoms && allDenoms.length > 0) {
      if (allDenoms.length <= MAX_BUTTONS) {
        return allDenoms;
      }
      // Always include first and last, pick evenly-spaced ones in between
      const result: number[] = [allDenoms[0]];
      const innerCount = MAX_BUTTONS - 2;
      for (let i = 1; i <= innerCount; i++) {
        const idx = Math.round((i * (allDenoms.length - 1)) / (innerCount + 1));
        if (!result.includes(allDenoms[idx])) {
          result.push(allDenoms[idx]);
        }
      }
      if (!result.includes(allDenoms[allDenoms.length - 1])) {
        result.push(allDenoms[allDenoms.length - 1]);
      }
      return result;
    }

    // Range-based brand: generate nice round values spread across the range
    if (isNaN(minAmount) || isNaN(maxAmount) || minAmount >= maxAmount) {
      return [minAmount].filter(v => !isNaN(v));
    }
    const candidates = [
      5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 125, 150, 175, 200, 250,
      300, 400, 500, 750, 1000,
    ].filter(d => d >= minAmount && d <= maxAmount);

    if (candidates.length <= MAX_BUTTONS) {
      const result = [...candidates];
      if (!result.includes(minAmount)) result.unshift(minAmount);
      if (!result.includes(maxAmount)) result.push(maxAmount);
      return result.slice(0, MAX_BUTTONS);
    }

    // Pick evenly-spaced candidates, always including first and last
    const result: number[] = [candidates[0]];
    const innerCount = MAX_BUTTONS - 2;
    for (let i = 1; i <= innerCount; i++) {
      const idx = Math.round((i * (candidates.length - 1)) / (innerCount + 1));
      if (!result.includes(candidates[idx])) {
        result.push(candidates[idx]);
      }
    }
    if (!result.includes(candidates[candidates.length - 1])) {
      result.push(candidates[candidates.length - 1]);
    }
    return result;
  })();

  useEffect(() => {
    if (contentHeight !== null) {
      if (isExpanded) {
        heightAnim.value = withTiming(contentHeight, {duration: 300});
        opacityAnim.value = withTiming(1, {duration: 250});
        chevronRotation.value = withTiming(90, {duration: 300});
      } else {
        heightAnim.value = withTiming(0, {duration: 300});
        opacityAnim.value = withTiming(0, {duration: 200});
        chevronRotation.value = withTiming(-90, {duration: 300});
      }
    }
  }, [isExpanded, contentHeight, heightAnim, opacityAnim, chevronRotation]);

  const animatedExpandedStyle = useAnimatedStyle(() => ({
    height: contentHeight === null ? 'auto' : heightAnim.value,
    opacity: contentHeight === null ? 0 : opacityAnim.value,
    overflow: 'hidden',
  }));

  const animatedChevronStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${chevronRotation.value}deg`}],
  }));

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    }
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
      <Pressable style={styles.brandCard} onPress={handleToggle}>
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
          <Animated.Image
            source={backIcon}
            style={[styles.chevronIcon, animatedChevronStyle]}
          />
        </View>
      </Pressable>

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
            <View
              style={[
                styles.denominationsRow,
                denominations.length < 5 && styles.denominationsRowLeft,
              ]}>
              {denominations.map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={styles.denominationButton}
                  activeOpacity={0.7}>
                  <Text style={styles.denominationText}>
                    {formatCurrency(currency)}
                    {formatDenomination(amount)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.purchaseButton} activeOpacity={0.7}>
              <Text style={styles.purchaseButtonText}>Purchase gift card</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Animated content */}
      {contentHeight !== null && (
        <Animated.View style={animatedExpandedStyle}>
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
                    selectedAmount === Number(amount) &&
                      styles.denominationButtonSelected,
                  ]}
                  onPress={() => handleAmountSelect(Number(amount))}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.denominationText,
                      selectedAmount === Number(amount) &&
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
        </Animated.View>
      )}

      {isLoggedIn && (
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={handleWishlistToggle}
          activeOpacity={0.7}>
          <Text style={styles.wishlistIcon}>{isInWishlist ? '♥' : '♡'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    brandCardContainer: {
      backgroundColor: colors.white,
      borderRadius: screenHeight * 0.016,
      borderWidth: screenHeight * 0.002,
      borderColor: '#F0F0F0',
      marginBottom: getSpacing(screenWidth, screenHeight).sm,
    },
    brandCard: {
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
      marginLeft: screenWidth * 0.025,
    },
    brandName: {
      fontSize: screenHeight * 0.0155,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      color: colors.text,
    },
    brandPrice: {
      fontSize: screenHeight * 0.0135,
      fontWeight: '500',
      fontFamily: 'Satoshi Variable',
      color: colors.textSecondary,
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
      top: (screenHeight * 0.077) / 2 - (screenWidth * 0.085) / 2,
      right: screenWidth * 0.13,
      width: screenWidth * 0.085,
      height: screenWidth * 0.085,
      justifyContent: 'center',
      alignItems: 'center',
    },
    wishlistIcon: {
      fontSize: screenHeight * 0.026,
      color: colors.primary,
    },
  });
