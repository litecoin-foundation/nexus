import React, {
  useState,
  useMemo,
  useContext,
  useLayoutEffect,
  useEffect,
} from 'react';
import {View, StyleSheet, TouchableOpacity, Text, Image} from 'react-native';
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
import {PaymentSent} from '../../components/GiftCardShop/PaymentSent';
// import {PurchaseSuccess} from '../../components/GiftCardShop/PurchaseSuccess';
import {MyGiftCards} from '../../components/GiftCardShop/MyGiftCards';
import {MyWishlistBrands} from '../../components/GiftCardShop/MyWishlistBrands';
import SignUpForm from '../../components/GiftCardShop/SignUpForm';
import TripleSwitch from '../../components/Buttons/TripleSwitch';
import HeaderButton from '../../components/Buttons/HeaderButton';

import {
  colors,
  getSpacing,
  getFontSize,
  getCommonStyles,
} from '../../components/GiftCardShop/theme';
import {GiftCardProvider} from '../../components/GiftCardShop/hooks';
import {clearAccount} from '../../reducers/nexusshopaccount';
import {useAppDispatch} from '../../store/hooks';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface GiftCardShopProps {
  initialBrand?: Brand;
}

type ScreenState =
  | {type: 'browse'}
  | {type: 'purchase'; brand: Brand; initialAmount?: number}
  | {
      type: 'payment';
      brand: Brand;
      initiateResponse: InitiatePurchaseResponseData;
    }
  | {type: 'payment-sent'; txid: string}
  | {type: 'success'; brand: Brand; giftCard: GiftCard}
  | {type: 'my-cards'}
  | {type: 'wishlist'};

const GiftCardShop: React.FC<GiftCardShopProps> = ({initialBrand}) => {
  const {uniqueId} = useSelector((state: any) => state.onboarding);
  const {account} = useSelector((state: any) => state.nexusshopaccount);
  const shopUserEmail = account && account.email;
  const isLoggedIn = account && account.isLoggedIn;

  const [screen, setScreen] = useState<ScreenState>({type: 'browse'});
  const [isHeaderOverflowHiddenState, setIsHeaderOverflowHidden] =
    useState<boolean>(true);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, isHeaderOverflowHiddenState),
    [SCREEN_WIDTH, SCREEN_HEIGHT, isHeaderOverflowHiddenState],
  );

  useEffect(() => {
    switch (screen.type) {
      case 'my-cards':
        setIsHeaderOverflowHidden(false);
        break;
      default:
        setIsHeaderOverflowHidden(true);
        break;
    }
  }, [screen]);

  const dispatch = useAppDispatch();
  if (__DEV__) {
    console.log('User uniqueId: ' + uniqueId);
    console.log('Giftcard client logged in: ' + isLoggedIn);
    console.log('Giftcard client email: ' + shopUserEmail);
    console.log('Screen: ' + JSON.stringify(screen, null, 2));
  }

  const handleResetShopUser = () => {
    if (__DEV__) {
      dispatch(clearAccount());
    }
  };

  const getSelectedIndex = () => {
    switch (screen.type) {
      case 'browse':
        return 0;
      case 'my-cards':
        return 1;
      case 'wishlist':
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
        setScreen({type: 'my-cards'});
        break;
      case 2:
        setScreen({type: 'wishlist'});
        break;
    }
  };

  const handleSelectBrand = (brand: Brand, initialAmount?: number) => {
    setScreen({type: 'purchase', brand, initialAmount});
  };

  const handleInitiate = (initiateResponse: InitiatePurchaseResponseData) => {
    if (screen.type === 'purchase') {
      setScreen({type: 'payment', brand: screen.brand, initiateResponse});
    }
  };

  const handlePaymentSent = (txid: string) => {
    if (screen.type === 'payment') {
      setScreen({type: 'payment-sent', txid});
    }
  };

  // NOTE: Keep it, used for when giftcards purchased bypassing cryptotransaction,
  // for purchases using balance or dev purposes
  // const handlePurchaseSuccess = (giftCard: GiftCard) => {
  //   if (screen.type === 'payment') {
  //     setScreen({type: 'success', brand: screen.brand, giftCard});
  //   }
  // };

  const handlePaymentBack = () => {
    if (screen.type === 'payment') {
      setScreen({type: 'browse'});
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
              <View style={styles.headerContainer}>
                <View style={styles.imageContainer}>
                  <Image
                    style={styles.image}
                    source={require('../../assets/images/shop-card.png')}
                  />
                </View>

                <CustomSafeAreaView styles={styles.safeArea} edges={['top']}>
                  <View style={styles.switchContainer}>
                    <TripleSwitch
                      options={['Gift Cards', 'Available', 'Wishlist']}
                      selectedIndex={getSelectedIndex()}
                      onSelectionChange={handleSwitchChange}
                      width={SCREEN_WIDTH - getSpacing(SCREEN_HEIGHT).md * 2}
                      height={SCREEN_HEIGHT * 0.05}
                      activeColor={colors.white}
                      inactiveColor={colors.primaryDark}
                      textColor={colors.white}
                      activeTextColor={colors.black}
                    />
                  </View>
                </CustomSafeAreaView>
              </View>

              {screen.type === 'browse' && (
                <BrandGrid onSelectBrand={handleSelectBrand} />
              )}

              {screen.type === 'purchase' && (
                <PurchaseForm
                  brand={screen.brand}
                  initialAmount={screen.initialAmount}
                  onBack={handleBack}
                  onInitiate={handleInitiate}
                />
              )}

              {screen.type === 'payment' && (
                <PayForGiftCard
                  initiateResponse={screen.initiateResponse}
                  onBack={handlePaymentBack}
                  onSuccess={handlePaymentSent}
                />
              )}

              {screen.type === 'payment-sent' && (
                <PaymentSent txid={screen.txid} onDone={handleDone} />
              )}

              {/* {screen.type === 'success' && (
                <PurchaseSuccess
                  brand={screen.brand}
                  giftCard={screen.giftCard}
                  onDone={handleDone}
                />
              )} */}

              {screen.type === 'my-cards' && <MyGiftCards />}

              {screen.type === 'wishlist' && (
                <MyWishlistBrands onSelectBrand={handleSelectBrand} />
              )}

              {__DEV__ ? (
                <View style={{position: 'absolute', bottom: 50}}>
                  <TouchableOpacity onPress={handleResetShopUser}>
                    <Text>Reset Shop User</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <></>
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

const getStyles = (
  _screenWidth: number,
  screenHeight: number,
  isHeaderOverflowHidden: boolean,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      backgroundColor: colors.primary,
      paddingTop: getSpacing(screenHeight).header,
    },
    headerContainer: {
      overflow: isHeaderOverflowHidden ? 'hidden' : 'visible',
    },
    imageContainer: {
      position: 'absolute',
      top: 0,
      width: '100%',
      height: screenHeight * 0.3,
      alignItems: 'center',
      zIndex: 1,
    },
    image: {
      width: '80%',
      height: '100%',
      objectFit: 'contain',
      opacity: 0.5,
    },
    switchContainer: {
      paddingHorizontal: getSpacing(screenHeight).md,
      paddingBottom: getSpacing(screenHeight).md,
      zIndex: 2,
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
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export const GiftCardShopNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height, true);

  return {
    headerTransparent: true,
    headerTitle: () => (
      <TranslateText
        textKey="shop"
        domain="nexusShop"
        maxSizeInPixels={height * 0.02}
        textStyle={styles.headerTitle}
        numberOfLines={1}
      />
    ),
    headerTitleAlign: 'left',
    headerTitleContainerStyle: {
      left: 7,
    },
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
    headerRight: () => (
      <HeaderButton
        textKey="flexa"
        textDomain="nexusShop"
        onPress={() => {}}
        rightPadding={true}
      />
    ),
  };
};

export default GiftCardShop;
