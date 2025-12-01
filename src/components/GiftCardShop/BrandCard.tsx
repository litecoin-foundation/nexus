import React from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {Brand} from '../../services/giftcards';
import {colors, spacing, borderRadius, fontSize} from './theme';

interface BrandCardProps {
  brand: Brand;
  onPress: () => void;
}

export function BrandCard({brand, onPress}: BrandCardProps) {
  const minAmount =
    brand.digital_face_value_limits?.minimum || brand.denominations?.[0];
  const maxAmount =
    brand.digital_face_value_limits?.maximum ||
    brand.denominations?.[brand.denominations.length - 1];

  return (
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
      {minAmount && maxAmount && (
        <Text style={styles.brandPrice}>
          {minAmount === maxAmount ? minAmount : `${minAmount} - ${maxAmount}`}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  brandCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  brandLogo: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  brandLogoPlaceholder: {
    backgroundColor: colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogoText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.gray,
  },
  brandName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  brandPrice: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
