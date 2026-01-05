import React, {useState, useContext} from 'react';
import {ScrollView, View, Text, StyleSheet, RefreshControl} from 'react-native';
import {isExpired} from '../../services/giftcards';
import {useAppSelector} from '../../store/hooks';
import {getSpacing, getCommonStyles} from './theme';
import {LoadingView} from './LoadingView';
import {EmptyView} from './EmptyView';
import {GiftCardItem} from './GiftCardItem';

import {ScreenSizeContext} from '../../context/screenSize';

export function MyFavouriteCards() {
  const giftCards = useAppSelector(state => state.nexusshopaccount.giftCards);
  const loading = useAppSelector(state => state.nexusshopaccount.loading);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // No need to refetch as we're reading from Redux store
    // The data is already synced when MyGiftCards fetches
    setRefreshing(false);
  };

  // Filter only favoured cards
  const favouriteCards = giftCards.filter(card => card.favoured);

  if (loading && !refreshing) {
    return <LoadingView message="Loading your favourite cards..." />;
  }

  if (!favouriteCards || favouriteCards.length === 0) {
    return (
      <EmptyView message="You haven't marked any gift cards as favourite yet." />
    );
  }

  const activeFavouriteCards = favouriteCards.filter(
    gc => gc.status === 'active' && !isExpired(gc),
  );
  const otherFavouriteCards = favouriteCards.filter(
    gc => gc.status !== 'active' || isExpired(gc),
  );

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={commonStyles.scrollContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {activeFavouriteCards.length > 0 && (
        <View style={styles.section}>
          <Text style={commonStyles.subtitle}>Active Favourite Cards</Text>
          {activeFavouriteCards.map(gc => (
            <GiftCardItem key={gc.id} giftCard={gc} />
          ))}
        </View>
      )}

      {otherFavouriteCards.length > 0 && (
        <View style={[styles.section, {opacity: 0.7}]}>
          <Text style={commonStyles.subtitle}>Past Favourite Cards</Text>
          {otherFavouriteCards.map(gc => (
            <GiftCardItem key={gc.id} giftCard={gc} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const getStyles = (_screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    section: {
      marginBottom: getSpacing(screenHeight).lg,
    },
  });
