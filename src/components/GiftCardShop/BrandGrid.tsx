import React, {useState, useContext} from 'react';
import {FlatList, StyleSheet, RefreshControl, View} from 'react-native';

import {ErrorView} from './ErrorView';
import {EmptyView} from './EmptyView';
import {BrandCard} from './BrandCard';
import {SkeletonBrandCard} from './SkeletonBrandCard';
import {Brand} from '../../services/giftcards';

import {getSpacing} from './theme';
import {useBrands} from './hooks';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface BrandGridProps {
  currency: string;
  onSelectBrand: (brand: Brand, initialAmount?: number) => void;
}

export function BrandGrid({currency, onSelectBrand}: BrandGridProps) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const {data: brands, loading, error, refetch} = useBrands();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedBrandSlug, setExpandedBrandSlug] = useState<string | null>(
    null,
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleToggleBrand = (brandSlug: string) => {
    setExpandedBrandSlug(prev => (prev === brandSlug ? null : brandSlug));
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.section}>
          <TranslateText
            textKey="available_gif_cards"
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
          <SkeletonBrandCard />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorView message={error} onRetry={refetch} onRetryText="Try Again" />
    );
  }

  if (!brands || brands.length === 0) {
    return <EmptyView message="No giftcards available in your country." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <TranslateText
          textKey="available_gif_cards"
          domain="nexusShop"
          maxSizeInPixels={SCREEN_HEIGHT * 0.015}
          textStyle={styles.title}
        />
      </View>
      <FlatList
        data={brands}
        keyExtractor={item => item.slug}
        contentContainerStyle={styles.gridContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({item}) => (
          <BrandCard
            brand={item}
            currency={currency}
            onPress={(amount?: number) => onSelectBrand(item, amount)}
            isExpanded={expandedBrandSlug === item.slug}
            onToggle={() => handleToggleBrand(item.slug)}
          />
        )}
        extraData={[brands?.length, expandedBrandSlug]}
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
    section: {
      // marginBottom: getSpacing(screenHeight).lg,
    },
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
