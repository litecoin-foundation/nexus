import React, {useState, useContext} from 'react';
import {FlatList, StyleSheet, RefreshControl, View} from 'react-native';
import {Brand} from '../../services/giftcards';
import {useBrands} from './hooks';
import {getSpacing} from './theme';
import {LoadingView} from './LoadingView';
import {ErrorView} from './ErrorView';
import {EmptyView} from './EmptyView';
import {BrandCard} from './BrandCard';

import {ScreenSizeContext} from '../../context/screenSize';

interface BrandGridProps {
  onSelectBrand: (brand: Brand, initialAmount?: number) => void;
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
    <View style={styles.container}>
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
            onPress={(amount?: number) => onSelectBrand(item, amount)}
          />
        )}
        extraData={brands?.length}
      />
    </View>
  );
}

const getStyles = (_screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      zIndex: 1,
    },
    gridContainer: {
      padding: getSpacing(screenHeight).md,
    },
  });
