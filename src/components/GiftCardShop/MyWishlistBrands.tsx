import React, {useState, useContext} from 'react';
import {ScrollView, View, Text, StyleSheet, RefreshControl} from 'react-native';
import {Brand} from '../../services/giftcards';
import {useAppSelector} from '../../store/hooks';
import {getSpacing, getCommonStyles} from './theme';
import {LoadingView} from './LoadingView';
import {EmptyView} from './EmptyView';
import {BrandCard} from './BrandCard';

import {ScreenSizeContext} from '../../context/screenSize';

interface MyWishlistBrandsProps {
  onSelectBrand?: (brand: Brand, initialAmount?: number) => void;
}

export function MyWishlistBrands({onSelectBrand}: MyWishlistBrandsProps) {
  const wishlistBrands = useAppSelector(
    state => state.nexusshopaccount.wishlistBrands,
  );
  const loading = useAppSelector(state => state.nexusshopaccount.loading);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // No need to refetch as we're reading from Redux store
    // The data is already synced when brands are added to wishlist
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return <LoadingView message="Loading your wishlist..." />;
  }

  if (!wishlistBrands || wishlistBrands.length === 0) {
    return (
      <EmptyView message="You haven't added any brands to your wishlist yet." />
    );
  }

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={commonStyles.scrollContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.section}>
        <Text style={commonStyles.subtitle}>Your Wishlist</Text>
        <View style={styles.brandsGrid}>
          {wishlistBrands.map((brand, index) => (
            <View
              key={brand.slug}
              style={index % 2 === 0 ? styles.leftCard : styles.rightCard}>
              <BrandCard
                brand={brand}
                onPress={(amount?: number) => onSelectBrand?.(brand, amount)}
              />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    section: {
      marginBottom: getSpacing(screenWidth, screenHeight).lg,
    },
    brandsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    leftCard: {
      marginRight: getSpacing(screenWidth, screenHeight).xs,
    },
    rightCard: {
      marginLeft: getSpacing(screenWidth, screenHeight).xs,
    },
  });
