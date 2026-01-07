import React, {
  useState,
  useMemo,
  useContext,
  useLayoutEffect,
  useEffect,
} from 'react';
import {View, StyleSheet, TouchableOpacity, Text, Image} from 'react-native';
import {useSelector} from 'react-redux';
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
import {MyGiftCards} from '../../components/GiftCardShop/MyGiftCards';
import {MyWishlistBrands} from '../../components/GiftCardShop/MyWishlistBrands';
import SignUpForm from '../../components/GiftCardShop/SignUpForm';
import TripleSwitch from '../../components/Buttons/TripleSwitch';

import {
  colors,
  getSpacing,
  getFontSize,
} from '../../components/GiftCardShop/theme';
import {GiftCardProvider} from '../../components/GiftCardShop/hooks';
import {clearAccount} from '../../reducers/nexusshopaccount';
import {useAppDispatch} from '../../store/hooks';

// import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface GiftCardShopProps {
  initialBrand?: Brand;
  navigation: any;
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

const GiftCardShop: React.FC<GiftCardShopProps> = ({
  initialBrand,
  navigation,
}) => {
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
        // setIsHeaderOverflowHidden(true);
        setIsHeaderOverflowHidden(false);
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

  // Initialize client with email and uniqueId
  const client = useMemo(() => {
    return shopUserEmail ? new GiftCardClient(shopUserEmail, uniqueId) : null;
  }, [shopUserEmail, uniqueId]);

  // Open preset brand
  useLayoutEffect(() => {
    if (initialBrand) {
      handleSelectBrand(initialBrand);
    }
  }, [initialBrand]);

  return (
    <View style={styles.container}>
      {!client ? (
        <View style={styles.signUpFormContainer}>
          <SignUpForm navigation={navigation} />
        </View>
      ) : (
        <GiftCardProvider client={client}>
          {isLoggedIn ? (
            <View style={styles.subContainer}>
              <View style={styles.headerContainer}>
                <View style={styles.imageContainer}>
                  <Image
                    style={styles.image}
                    source={require('../../assets/images/shop-card.png')}
                  />
                </View>

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
              </View>

              <View style={styles.body}>
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
            </View>
          ) : (
            <View style={styles.signUpFormContainer}>
              <SignUpForm navigation={navigation} />
            </View>
          )}
        </GiftCardProvider>
      )}
    </View>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  isHeaderOverflowHidden: boolean,
) =>
  StyleSheet.create({
    container: {
      width: screenWidth,
      // BottomSheet is screenHeight * 0.76
      // DashboardButton is 110
      // Header margin is 5
      height: screenHeight * 0.76,
    },
    subContainer: {
      flex: 1,
    },
    signUpFormContainer: {
      flex: 1,
      borderTopLeftRadius: screenHeight * 0.03,
      borderTopRightRadius: screenHeight * 0.03,
      // DashboardButton is 110
      // Header margin is 5
      marginTop: -115,
      overflow: 'hidden',
    },
    headerContainer: {
      height: 190,
      minHeight: 190,
      maxHeight: 190,
      borderTopLeftRadius: screenHeight * 0.03,
      borderTopRightRadius: screenHeight * 0.03,
      backgroundColor: colors.primaryLight,
      justifyContent: 'flex-end',
      // DashboardButton is 110
      // Header margin is 5
      marginTop: -115,
      overflow: isHeaderOverflowHidden ? 'hidden' : 'visible',
    },
    body: {
      // TODO: there's weird gap at the bottom out of nowhere
      maxHeight: screenHeight * 0.76 - 190,
      flex: 1,
      backgroundColor: colors.primaryLight,
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

export default GiftCardShop;
