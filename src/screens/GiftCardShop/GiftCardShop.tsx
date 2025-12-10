import React, {useState, useMemo, useContext, useLayoutEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import type {StackNavigationOptions} from '@react-navigation/stack';
import {GiftCardClient, Brand, GiftCard} from '../../services/giftcards';
import {BrandGrid} from '../../components/GiftCardShop/BrandGrid';
import {PurchaseForm} from '../../components/GiftCardShop/PurchaseForm';
import {PurchaseSuccess} from '../../components/GiftCardShop/PurchaseSuccess';
import {MyGiftCards} from '../../components/GiftCardShop/MyGiftCards';
import SignUpForm from '../../components/GiftCardShop/SignUpForm';

import {
  colors,
  getSpacing,
  getFontSize,
  getCommonStyles,
} from '../../components/GiftCardShop/theme';
import {GiftCardProvider} from '../../components/GiftCardShop/hooks';

import {ScreenSizeContext} from '../../context/screenSize';

interface GiftCardShopProps {
  initialBrand?: Brand;
}

type ScreenState =
  | {type: 'browse'}
  | {type: 'purchase'; brand: Brand}
  | {type: 'success'; brand: Brand; giftCard: GiftCard}
  | {type: 'my-cards'};

const GiftCardShop: React.FC<GiftCardShopProps> = ({initialBrand}) => {
  const {uniqueId} = useSelector((state: any) => state.onboarding);
  const {account} = useSelector((state: any) => state.nexusshopaccount);
  const isLoggedIn = account && account.isLoggedIn;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [screen, setScreen] = useState<ScreenState>({type: 'browse'});

  const handleSelectBrand = (brand: Brand) => {
    setScreen({type: 'purchase', brand});
  };

  const handlePurchaseSuccess = (giftCard: GiftCard) => {
    if (screen.type === 'purchase') {
      setScreen({type: 'success', brand: screen.brand, giftCard});
    }
  };

  const handleDone = () => {
    setScreen({type: 'browse'});
  };

  const handleBack = () => {
    setScreen({type: 'browse'});
  };

  // Initialize client with uniqueId
  const client = useMemo(() => {
    return uniqueId ? new GiftCardClient(uniqueId) : null;
  }, [uniqueId]);

  // Open preset brand
  useLayoutEffect(() => {
    if (initialBrand) {
      handleSelectBrand(initialBrand);
    }
  }, [initialBrand]);

  return (
    <View
      style={[
        getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT).container,
        styles.container,
      ]}>
      {!client ? (
        <SignUpForm />
      ) : (
        <GiftCardProvider client={client}>
          {isLoggedIn ? (
            <View>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Gift Cards</Text>
                <TouchableOpacity
                  onPress={() =>
                    setScreen(
                      screen.type === 'my-cards'
                        ? {type: 'browse'}
                        : {type: 'my-cards'},
                    )
                  }>
                  <Text style={styles.headerButton}>
                    {screen.type === 'my-cards' ? 'Browse' : 'My Cards'}
                  </Text>
                </TouchableOpacity>
              </View>

              {screen.type === 'browse' && (
                <BrandGrid onSelectBrand={handleSelectBrand} />
              )}

              {screen.type === 'purchase' && (
                <PurchaseForm
                  brand={screen.brand}
                  onBack={handleBack}
                  onSuccess={handlePurchaseSuccess}
                />
              )}

              {screen.type === 'success' && (
                <PurchaseSuccess
                  brand={screen.brand}
                  giftCard={screen.giftCard}
                  onDone={handleDone}
                />
              )}

              {screen.type === 'my-cards' && <MyGiftCards />}
            </View>
          ) : (
            <SignUpForm />
          )}
        </GiftCardProvider>
      )}
    </View>
  );
};

const getStyles = (_screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: getSpacing(screenHeight).md,
      paddingVertical: getSpacing(screenHeight).md,
      backgroundColor: colors.white,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: getFontSize(screenHeight).xl,
      fontWeight: '700',
      color: colors.text,
    },
    headerButton: {
      fontSize: getFontSize(screenHeight).md,
      color: colors.primary,
      fontWeight: '600',
    },
  });

export const navigationOptions = (): StackNavigationOptions => ({
  title: 'Gift Card Shop',
  headerStyle: {
    backgroundColor: '#007AFF',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: '700' as const,
  },
});

export default GiftCardShop;
