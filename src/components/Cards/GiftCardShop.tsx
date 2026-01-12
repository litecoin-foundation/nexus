import React, {useState, useMemo, useContext, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {GiftCardClient, Brand, GiftCard} from '../../services/giftcards';
import {BrandGrid} from '../../components/GiftCardShop/BrandGrid';
import {PaymentSent} from '../../components/GiftCardShop/PaymentSent';
import {MyWishlistBrands} from '../../components/GiftCardShop/MyWishlistBrands';
import MyGiftCards from '../../components/GiftCardShop/MyGiftCards';
import TripleSwitch from '../../components/Buttons/TripleSwitch';
import NewBlueButton from '../Buttons/NewBlueButton';

import {
  colors,
  getSpacing,
  getFontSize,
} from '../../components/GiftCardShop/theme';
import {GiftCardProvider} from '../../components/GiftCardShop/hooks';
import {
  logoutFromNexusShop,
  resetFromNexusShop,
} from '../../reducers/nexusshopaccount';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface GiftCardShopProps {
  initialBrand?: Brand;
  navigation: any;
}

type ScreenState =
  | {type: 'browse'}
  | {type: 'payment-sent'; txid: string}
  | {type: 'success'; brand: Brand; giftCard: GiftCard}
  | {type: 'my-cards'}
  | {type: 'wishlist'};

const GiftCardShop: React.FC<GiftCardShopProps> = ({
  initialBrand,
  navigation,
}) => {
  const uniqueId = useAppSelector((state: any) => state.onboarding.uniqueId);
  const account = useAppSelector(
    (state: any) => state.nexusshopaccount.account,
  );
  const shopUserEmail = account && account.email;
  const isLoggedIn = account && account.isLoggedIn;

  const [screen, setScreen] = useState<ScreenState>({type: 'browse'});

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  const dispatch = useAppDispatch();
  if (__DEV__) {
    console.log('User uniqueId: ' + uniqueId);
    console.log('Giftcard client logged in: ' + isLoggedIn);
    console.log('Giftcard client email: ' + shopUserEmail);
    console.log('Screen: ' + JSON.stringify(screen, null, 2));
  }

  const handleLogoutShopUser = () => {
    if (__DEV__) {
      dispatch(logoutFromNexusShop());
    }
  };

  const handleResetShopUser = () => {
    if (__DEV__) {
      dispatch(resetFromNexusShop());
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
    navigation.navigate('NexusShopStack', {
      screen: 'PurchaseForm',
      params: {
        brand,
        initialAmount,
        onPaymentSuccess: (txid: string) => {
          setScreen({type: 'payment-sent', txid});
        },
      },
    });
  };

  const handleDone = () => {
    setScreen({type: 'browse'});
  };

  /**
   * Initialize client with email and uniqueId
   * Allow init client even without nexus shop account reged,
   * so that users can browse cards and see the my cards page.
   * Since reg wasn't done, any reqs from the GiftCardClient will
   * throw an error which should fallback to signing in.
   */
  /**
   * Since some components of the GiftCardShop are separate screens now,
   * they initialize client again for their use. The GiftCardClient class is stateless
   * and multiple instances do not break anything.
   */
  const client = useMemo(() => new GiftCardClient(), []);

  // Open preset brand
  useEffect(() => {
    if (initialBrand) {
      handleSelectBrand(initialBrand);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBrand]);

  return (
    <View style={styles.container}>
      <GiftCardProvider client={client}>
        <View style={styles.subContainer}>
          <View style={styles.headerContainer}>
            <View style={styles.topBarContainer}>
              <TranslateText
                textKey="nexus_shop"
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.027}
                textStyle={styles.titleText}
                numberOfLines={1}
              />

              <View style={styles.topButtons}>
                <View style={styles.topBtn}>
                  <NewBlueButton
                    textKey="reset_acc"
                    textDomain="nexusShop"
                    active={false}
                    onPress={handleResetShopUser}
                    autoWidth
                  />
                </View>
                <View style={styles.topBtn}>
                  <NewBlueButton
                    textKey="flexa"
                    textDomain="nexusShop"
                    active={false}
                    onPress={() => {}}
                    autoWidth
                  />
                </View>
                <View style={styles.topBtn}>
                  <NewBlueButton
                    textKey="logout"
                    textDomain="nexusShop"
                    active={true}
                    onPress={handleLogoutShopUser}
                    autoWidth
                  />
                </View>
              </View>
            </View>

            <View style={styles.switchContainer}>
              <TripleSwitch
                options={
                  isLoggedIn
                    ? ['Shop', 'My cards', 'Wishlist']
                    : ['Shop', 'My cards']
                }
                selectedIndex={getSelectedIndex()}
                onSelectionChange={handleSwitchChange}
                width={
                  SCREEN_WIDTH - getSpacing(SCREEN_WIDTH, SCREEN_HEIGHT).md * 2
                }
                height={SCREEN_HEIGHT * 0.05}
                activeColor={colors.white}
                inactiveColor={colors.grayMedium}
                textColor={colors.grayDark}
                activeTextColor={colors.black}
              />
            </View>
          </View>

          <View style={styles.body}>
            {screen.type === 'browse' && (
              <BrandGrid onSelectBrand={handleSelectBrand} />
            )}

            {screen.type === 'payment-sent' && (
              <PaymentSent txid={screen.txid} onDone={handleDone} />
            )}

            {screen.type === 'my-cards' && (
              <MyGiftCards navigation={navigation} />
            )}

            {screen.type === 'wishlist' && (
              <MyWishlistBrands onSelectBrand={handleSelectBrand} />
            )}
          </View>
        </View>
      </GiftCardProvider>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      width: screenWidth,
      // BottomSheet is screenHeight * 0.76
      // DashboardButton is 110
      // Header margin is 5
      height: screenHeight * 0.76,
      // height: screenHeight,
      // backgroundColor: 'red',
      // marginTop: screenHeight * 0.24 * -1,
      // zIndex: 1,
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
      height: 115 + screenHeight * 0.13,
      minHeight: 115 + screenHeight * 0.13,
      maxHeight: 115 + screenHeight * 0.13,
      borderTopLeftRadius: screenHeight * 0.03,
      borderTopRightRadius: screenHeight * 0.03,
      justifyContent: 'flex-end',
      // DashboardButton is 110
      // Header margin is 5
      marginTop: -115,
      overflow: 'hidden',
    },
    topBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: screenWidth * 0.06,
      paddingBottom: screenHeight * 0.02,
    },
    titleText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#2E2E2E',
      fontSize: screenHeight * 0.027,
    },
    topButtons: {
      flexDirection: 'row',
    },
    topBtn: {
      marginLeft: screenWidth * 0.02,
    },
    body: {
      // TODO: there's weird gap at the bottom out of nowhere
      maxHeight: screenHeight * 0.76 - (115 + screenHeight * 0.13),
      flex: 1,
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
      paddingHorizontal: getSpacing(screenWidth, screenHeight).md,
      paddingBottom: getSpacing(screenWidth, screenHeight).md,
      zIndex: 2,
    },
    placeholderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: getSpacing(screenWidth, screenHeight).md,
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
