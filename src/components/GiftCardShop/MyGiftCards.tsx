import React, {useEffect, useState, useContext} from 'react';
import {ScrollView, View, StyleSheet, RefreshControl} from 'react-native';
import {isExpired, PendingGiftCardPurchase} from '../../services/giftcards';
import {useMyGiftCards} from './hooks';
import {getSpacing} from './theme';
import {LoadingView} from './LoadingView';
import {ErrorView} from './ErrorView';
import {EmptyView} from './EmptyView';
import {GiftCardItem, PendingGiftCardItem} from './GiftCardItem';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  navigation: any;
}

const MyGiftCards: React.FC<Props> = props => {
  const {navigation} = props;

  const {data, loading, error, refetch} = useMyGiftCards();
  const giftCards = data?.giftCards ?? [];
  const pendingGiftCards = data?.pendingGiftCards ?? [];

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const toSignUp = () => {
    navigation.navigate('NexusShopStack', {screen: 'SignUp'});
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const [errorText, setErrorText] = useState<string>('');
  useEffect(() => {
    switch (error) {
      case 'Unauthorized':
        setErrorText('To access your giftcards sign in to Nexus Shop account');
        break;
      default:
        setErrorText(error || '');
        break;
    }
  }, [error]);

  if (loading && !refreshing) {
    return <LoadingView message="Loading your gift cards..." />;
  }

  if (error) {
    return (
      <ErrorView
        message={errorText}
        onRetry={error === 'Unauthorized' ? toSignUp : refetch}
        onRetryText={error === 'Unauthorized' ? 'Sign In' : 'Try Again'}
      />
    );
  }

  if (giftCards.length === 0 && pendingGiftCards.length === 0) {
    return <EmptyView message="You don't have any gift cards yet." />;
  }

  const activePendingCards = pendingGiftCards.filter(
    (gc: PendingGiftCardPurchase) =>
      gc.status === 'pending_payment' || gc.status === 'payment_received',
  );

  const activeCards = giftCards.filter(
    gc => gc.status === 'active' && !isExpired(gc),
  );
  const otherCards = giftCards.filter(
    gc => gc.status !== 'active' || isExpired(gc),
  );

  return (
    <View style={styles.container}>
      {activePendingCards.length > 0 && (
        <View style={styles.pendingSection}>
          <TranslateText
            textKey="pending_gif_cards"
            domain="nexusShop"
            maxSizeInPixels={SCREEN_HEIGHT * 0.015}
            textStyle={styles.title}
          />
          <ScrollView
            horizontal
            style={styles.pendingScrollView}
            contentContainerStyle={styles.pendingScrollContainer}
            showsHorizontalScrollIndicator={false}>
            {activePendingCards.map(gc => (
              <PendingGiftCardItem key={gc.id} pendingGiftCard={gc} />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.mainSection}>
        <TranslateText
          textKey="my_cards"
          domain="nexusShop"
          maxSizeInPixels={SCREEN_HEIGHT * 0.015}
          textStyle={styles.title}
        />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {activeCards.length > 0 && (
            <View style={styles.section}>
              {activeCards.map(gc => (
                <GiftCardItem key={gc.id} giftCard={gc} />
              ))}
            </View>
          )}

          {otherCards.length > 0 && (
            <View style={[styles.section, styles.pastSection]}>
              {otherCards.map(gc => (
                <GiftCardItem key={gc.id} giftCard={gc} />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      zIndex: 1,
      paddingTop: screenHeight * 0.01,
    },
    pendingSection: {
      marginBottom: getSpacing(screenWidth, screenHeight).md,
    },
    mainSection: {
      flex: 1,
    },
    pendingScrollView: {
      flexGrow: 0,
    },
    pendingScrollContainer: {
      paddingHorizontal: getSpacing(screenWidth, screenHeight).md,
      gap: getSpacing(screenWidth, screenHeight).sm,
    },
    scrollView: {
      flex: 1,
    },
    scrollContainer: {
      paddingHorizontal: getSpacing(screenWidth, screenHeight).md,
      paddingBottom: getSpacing(screenWidth, screenHeight).lg,
    },
    section: {
      marginBottom: getSpacing(screenWidth, screenHeight).md,
    },
    pastSection: {
      opacity: 0.8,
    },
    title: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#2E2E2E',
      fontSize: screenHeight * 0.015,
      textTransform: 'uppercase',
      paddingHorizontal: screenWidth * 0.06,
      marginBottom: getSpacing(screenWidth, screenHeight).sm,
    },
  });

export default MyGiftCards;
