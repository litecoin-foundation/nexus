import React, {useState, useContext} from 'react';
import {ScrollView, View, Text, StyleSheet, RefreshControl} from 'react-native';
import {isExpired} from '../../services/giftcards';
import {useMyGiftCards} from './hooks';
import {getSpacing, getCommonStyles} from './theme';
import {LoadingView} from './LoadingView';
import {ErrorView} from './ErrorView';
import {EmptyView} from './EmptyView';
import {GiftCardItem} from './GiftCardItem';

import {ScreenSizeContext} from '../../context/screenSize';

export function MyGiftCards() {
  const {data: giftCards, loading, error, refetch} = useMyGiftCards();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

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
    <View style={commonStyles.containerPrimary}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={commonStyles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {activeCards.length > 0 && (
          <View style={styles.section}>
            <Text style={commonStyles.subtitle}>Active Gift Cards</Text>
            {activeCards.map(gc => (
              <GiftCardItem key={gc.id} giftCard={gc} />
            ))}
          </View>
        )}

        {otherCards.length > 0 && (
          <View style={[styles.section, {opacity: 0.8}]}>
            <Text style={commonStyles.subtitle}>Past Gift Cards</Text>
            {otherCards.map(gc => (
              <GiftCardItem key={gc.id} giftCard={gc} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (_screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      zIndex: 1,
    },
    section: {
      marginBottom: getSpacing(screenHeight).lg,
    },
  });
