import React, {useState, useContext} from 'react';
import {FlatList, StyleSheet, RefreshControl} from 'react-native';
import {Brand} from '../../services/giftcards';
import {useBrands} from './hooks';
import {getSpacing} from './theme';
import {LoadingView} from './LoadingView';
import {ErrorView} from './ErrorView';
import {EmptyView} from './EmptyView';
import {BrandCard} from './BrandCard';

import {ScreenSizeContext} from '../../context/screenSize';

interface BrandGridProps {
  onSelectBrand: (brand: Brand) => void;
}

export function BrandGrid({onSelectBrand}: BrandGridProps) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const {data: brands, loading, error, refetch} = useBrands();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return <LoadingView message="Loading gift cards..." />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={refetch} />;
  }

  if (!brands || brands.length === 0) {
    return <EmptyView message="No gift cards available" />;
  }

  return (
    <FlatList
      data={brands}
      keyExtractor={item => item.slug}
      numColumns={2}
      contentContainerStyle={styles.gridContainer}
      columnWrapperStyle={styles.gridRow}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({item}) => (
        <BrandCard brand={item} onPress={() => onSelectBrand(item)} />
      )}
      extraData={brands?.length}
    />
  );
}

const getStyles = (_screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    gridContainer: {
      padding: getSpacing(screenHeight).md,
    },
    gridRow: {
      justifyContent: 'space-between',
    },
  });
