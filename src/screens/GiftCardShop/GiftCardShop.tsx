import React, {useState, useMemo, useContext, useLayoutEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import type {StackNavigationOptions} from '@react-navigation/stack';
import {
  GiftCardClient,
  Brand,
  GiftCard,
  InitiatePurchaseResponseData,
} from '../../services/giftcards';
import {BrandGrid} from '../../components/GiftCardShop/BrandGrid';
import {PurchaseForm} from '../../components/GiftCardShop/PurchaseForm';
import {PayForGiftCard} from '../../components/GiftCardShop/PayForGiftCard';
import {PurchaseSuccess} from '../../components/GiftCardShop/PurchaseSuccess';
import {MyGiftCards} from '../../components/GiftCardShop/MyGiftCards';
import {MyWishlistBrands} from '../../components/GiftCardShop/MyWishlistBrands';
import SignUpForm from '../../components/GiftCardShop/SignUpForm';
import TripleSwitch from '../../components/Buttons/TripleSwitch';

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
  | {
      type: 'payment';
      brand: Brand;
      initiateResponse: InitiatePurchaseResponseData;
    }
  | {type: 'success'; brand: Brand; giftCard: GiftCard}
  | {type: 'my-cards'}
  | {type: 'wishlist'};

const GiftCardShop: React.FC<GiftCardShopProps> = ({initialBrand}) => {
  const {uniqueId} = useSelector((state: any) => state.onboarding);
  const {account} = useSelector((state: any) => state.nexusshopaccount);
  const isLoggedIn = account && account.isLoggedIn;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [screen, setScreen] = useState<ScreenState>({type: 'browse'});

  if (__DEV__) {
    console.log('User uniqueId: ' + uniqueId);
    console.log('Giftcard client logged in: ' + isLoggedIn);
    console.log('Screen: ' + JSON.stringify(screen, null, 2));
  }

  const getSelectedIndex = () => {
    switch (screen.type) {
      case 'browse':
        return 0;
      case 'wishlist':
        return 1;
      case 'my-cards':
        return 2;
      default:
        return 0;
    }
  };

  const handleSwitchChange = (index: number) => {
    switch (index) {
      case 0:
        setScreen({type: 'browse'});
        break;
      case 1:
        setScreen({type: 'wishlist'});
        break;
      case 2:
        setScreen({type: 'my-cards'});
        break;
    }
  };

  const handleSelectBrand = (brand: Brand) => {
    setScreen({type: 'purchase', brand});
  };

  const handleInitiate = (initiateResponse: InitiatePurchaseResponseData) => {
    if (screen.type === 'purchase') {
      setScreen({type: 'payment', brand: screen.brand, initiateResponse});
    }
  };

  const handlePurchaseSuccess = (giftCard: GiftCard) => {
    if (screen.type === 'payment') {
      setScreen({type: 'success', brand: screen.brand, giftCard});
    }
  };

  const handlePaymentBack = () => {
    if (screen.type === 'payment') {
      setScreen({type: 'purchase', brand: screen.brand});
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
            <View style={styles.container}>
              <View style={styles.switchContainer}>
                <TripleSwitch
                  options={['Browse', 'Wishlist', 'My Cards']}
                  selectedIndex={getSelectedIndex()}
                  onSelectionChange={handleSwitchChange}
                  width={SCREEN_WIDTH - getSpacing(SCREEN_HEIGHT).md * 2}
                  height={44}
                  activeColor={colors.primary}
                  inactiveColor={colors.grayLight}
                  textColor={colors.textSecondary}
                  activeTextColor={colors.white}
                />
              </View>

              {screen.type === 'browse' && (
                <BrandGrid onSelectBrand={handleSelectBrand} />
              )}

              {screen.type === 'purchase' && (
                <PurchaseForm
                  brand={screen.brand}
                  onBack={handleBack}
                  onInitiate={handleInitiate}
                />
              )}

              {screen.type === 'payment' && (
                <PayForGiftCard
                  initiateResponse={screen.initiateResponse}
                  onBack={handlePaymentBack}
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

              {screen.type === 'wishlist' && (
                <MyWishlistBrands onSelectBrand={handleSelectBrand} />
              )}
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
    switchContainer: {
      paddingHorizontal: getSpacing(screenHeight).md,
      paddingVertical: getSpacing(screenHeight).md,
      backgroundColor: colors.white,
    },
    placeholderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: getSpacing(screenHeight).md,
    },
    placeholderText: {
      fontSize: getFontSize(screenHeight).lg,
      color: colors.textSecondary,
      textAlign: 'center',
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
