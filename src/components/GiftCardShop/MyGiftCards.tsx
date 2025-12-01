import React, {useState} from 'react';
import {ScrollView, View, Text, StyleSheet, RefreshControl} from 'react-native';
import {GiftCard, isExpired} from '../../services/giftcards';
import {useMyGiftCards} from './hooks';
import {spacing, commonStyles} from './theme';
import {LoadingView} from './LoadingView';
import {ErrorView} from './ErrorView';
import {EmptyView} from './EmptyView';
import {GiftCardItem} from './GiftCardItem';

interface MyGiftCardsProps {
  onViewCard?: (giftCard: GiftCard) => void;
}

export function MyGiftCards({onViewCard}: MyGiftCardsProps) {
  const {data: giftCards, loading, error, refetch} = useMyGiftCards();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return <LoadingView message="Loading your gift cards..." />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={refetch} />;
  }

  if (!giftCards || giftCards.length === 0) {
    return <EmptyView message="You don't have any gift cards yet." />;
  }

  const activeCards = giftCards.filter(
    gc => gc.status === 'active' && !isExpired(gc),
  );
  const otherCards = giftCards.filter(
    gc => gc.status !== 'active' || isExpired(gc),
  );

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={commonStyles.scrollContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {activeCards.length > 0 && (
        <View style={styles.section}>
          <Text style={commonStyles.subtitle}>Active Gift Cards</Text>
          {activeCards.map(gc => (
            <GiftCardItem
              key={gc.id}
              giftCard={gc}
              onPress={() => onViewCard?.(gc)}
              onUpdate={refetch}
            />
          ))}
        </View>
      )}

      {otherCards.length > 0 && (
        <View style={[styles.section, {opacity: 0.7}]}>
          <Text style={commonStyles.subtitle}>Past Gift Cards</Text>
          {otherCards.map(gc => (
            <GiftCardItem
              key={gc.id}
              giftCard={gc}
              onPress={() => onViewCard?.(gc)}
              onUpdate={refetch}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
});
