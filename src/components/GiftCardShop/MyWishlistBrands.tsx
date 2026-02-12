import React, {useContext} from 'react';
import {FlatList, View, StyleSheet} from 'react-native';

import {Brand} from '../../services/giftcards';
import {EmptyView} from './EmptyView';
import {BrandCard} from './BrandCard';
import {SkeletonBrandCard} from './SkeletonBrandCard';
import {useAppSelector} from '../../store/hooks';

import {getSpacing} from './theme';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface MyWishlistBrandsProps {
  currency: string;
  onSelectBrand?: (brand: Brand, initialAmount?: number) => void;
}

export function MyWishlistBrands({
  currency,
  onSelectBrand,
}: MyWishlistBrandsProps) {
  const wishlistBrands = useAppSelector(
    state => state.nexusshopaccount.wishlistBrands,
  );
  const loading = useAppSelector(state => state.nexusshopaccount.loading);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.section}>
          <TranslateText
            textKey="your_wishlist"
            domain="nexusShop"
            maxSizeInPixels={SCREEN_HEIGHT * 0.015}
            textStyle={styles.title}
          />
        </View>
        <View style={styles.gridContainer}>
          <SkeletonBrandCard />
          <SkeletonBrandCard />
          <SkeletonBrandCard />
          <SkeletonBrandCard />
          <SkeletonBrandCard />
        </View>
      </View>
    );
  }

  if (!wishlistBrands || wishlistBrands.length === 0) {
    return (
      <EmptyView message="You haven't added any brands to your wishlist yet." />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <TranslateText
          textKey="your_wishlist"
          domain="nexusShop"
          maxSizeInPixels={SCREEN_HEIGHT * 0.015}
          textStyle={styles.title}
        />
      </View>
      <FlatList
        data={wishlistBrands}
        keyExtractor={item => item.slug}
        contentContainerStyle={styles.gridContainer}
        renderItem={({item}) => (
          <BrandCard
            brand={item}
            currency={currency}
            onPress={(amount?: number) => onSelectBrand?.(item, amount)}
          />
        )}
        extraData={wishlistBrands?.length}
      />
    </View>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      zIndex: 1,
      paddingTop: screenHeight * 0.01,
    },
    gridContainer: {
      padding: getSpacing(screenWidth, screenHeight).md,
    },
    section: {},
    title: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#2E2E2E',
      fontSize: screenHeight * 0.015,
      textTransform: 'uppercase',
      paddingHorizontal: screenWidth * 0.06,
    },
  });
