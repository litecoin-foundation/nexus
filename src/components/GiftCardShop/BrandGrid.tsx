import React, {useState} from 'react';
import {FlatList, StyleSheet, RefreshControl} from 'react-native';
import {Brand} from '../../services/giftcards';
import {useBrands} from './hooks';
import {spacing} from './theme';
import {LoadingView} from './LoadingView';
import {ErrorView} from './ErrorView';
import {EmptyView} from './EmptyView';
import {BrandCard} from './BrandCard';

interface BrandGridProps {
  onSelectBrand: (brand: Brand) => void;
}

export function BrandGrid({onSelectBrand}: BrandGridProps) {
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
    />
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    padding: spacing.md,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
});
