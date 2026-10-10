import React, {useEffect, useCallback, useContext, useState} from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import {RouteProp, useFocusEffect} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {getCountry} from 'react-native-localize';
import {WalletState} from 'react-native-nitro-lndltc';

import {
  CARD_ROW_HEIGHT_RATIO,
  GlassCard,
  GlassCardHairline,
  GlassCardRow,
} from '../../components/Cells/GlassCard';
import TranslateText from '../../components/TranslateText';
import GreenButtonV2 from '../../components/ButtonsV2/GreenButtonV2';
import {useFixedBottomStyle} from '../../components/ButtonsV2/fixedBottomStyle';
import WhiteButton from '../../components/Buttons/WhiteButton';
import {getSignedUrl, getBuyTransactionHistory} from '../../reducers/buy';
import {getAddress} from '../../reducers/address';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {showError} from '../../reducers/errors';
import {parseQueryString} from '../../utils/querystring';
import ScreenHeader, {
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../../components/ScreenHeader';

import {BORDER_GRADIENT_COLORS} from '../../components/LiquidGlassBackdrop';
import {SHEET_BACKGROUND} from '../../components/GlassTxRows';
import {SHEET_TOP_RADIUS_RATIO} from '../../components/GlassBottomSheet';
import {
  SKIN_GRADIENT_COLORS,
  SKIN_GRADIENT_LOCATIONS,
} from '../../components/FoldedSkinView';
import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import {ScreenSizeContext} from '../../context/screenSize';

const SHEET_HEIGHT_RATIO = 0.38;
// TODO: off until it's confirmed whether the quote's fee already has the discount
// taken off, which a separate discount row would then take off twice
const DISCOUNT_VIEW_ENABLED = false;

type RootStackParamList = {
  ConfirmBuy: {
    queryString?: string;
    prefilledMethod?: string;
  };
  WebPage: {
    uri: string;
    observeURL: string;
    returnRoute: string;
    title?: string;
  };
  Main: {
    isInitial: boolean;
    updateHeader: boolean;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'ConfirmBuy'>;
  route: RouteProp<RootStackParamList, 'ConfirmBuy'>;
}

const ConfirmBuy: React.FC<Props> = props => {
  const {navigation, route} = props;
  const dispatch = useAppDispatch();

  const {buyQuote: quote} = useAppSelector(state => state.buy);
  const {currencySymbol} = useAppSelector(state => state.settings);
  const {
    ltcAmount,
    ltcPrice,
    totalAmount,
    baseCurrencyAmount,
    networkFeeAmount,
    feeAmount,
    discount,
  } = quote;

  const hasDiscount = DISCOUNT_VIEW_ENABLED && discount > 0;
  const sheetHeightRatio =
    SHEET_HEIGHT_RATIO + (hasDiscount ? CARD_ROW_HEIGHT_RATIO : 0);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const insets = useSafeAreaInsets();
  const styles = getStyles(
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    insets.bottom,
    sheetHeightRatio,
  );
  const fixedBottomStyle = useFixedBottomStyle();
  const {rects, paddingHorizontal} = useScreenHeaderLayout();
  const headerFadeStyle = useScreenHeaderArrival();

  const isUK = getCountry() === 'GB';

  const [hasBeenMounted, setHasBeenMounted] = useState(false);
  const [hasNavigatedBack, setHasNavigatedBack] = useState(false);
  const [buyTxid, setBuyTxid] = useState<string>('');
  const [buyTxStatus, setBuyTxStatus] = useState<string>('');
  const [wasSuccessful, setWasSuccessful] = useState<boolean>(false);

  const walletState = useAppSelector(state => state.lightning!.walletState);
  const rpcReady =
    walletState === WalletState.RPC_ACTIVE ||
    walletState === WalletState.SERVER_ACTIVE;
  const address = useAppSelector(state => state.address.regularAddress);

  useEffect(() => {
    if (rpcReady) {
      dispatch(getAddress(false));
    }
  }, [rpcReady, dispatch]);

  const openBuyWidget = useCallback(async () => {
    try {
      if (!address) {
        throw new Error('Address not found. Go back and Try again!');
      }

      if (!isUK && !baseCurrencyAmount) {
        throw new Error('Purchase amount not found.');
      }

      // await is important!
      const url = await dispatch(
        getSignedUrl(
          address,
          baseCurrencyAmount || 1,
          route.params.prefilledMethod || '',
        ),
      );

      if (typeof url === 'string') {
        navigation.navigate('WebPage', {
          uri: url,
          observeURL:
            'https://api.nexuswallet.com/api/buy/moonpay/success_buy/',
          returnRoute: 'ConfirmBuy',
          title: 'MoonPay',
        });
      } else {
        throw new Error('Failed to Buy Litecoin URL (Moonpay)!');
      }
    } catch (error) {
      dispatch(showError(String(error)));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [isUK, address, baseCurrencyAmount, route.params.prefilledMethod]);

  // NOTE: For UK auto-open widget on mount
  // NOTE: Open the widget only after a regular deposit address is available — never
  // synchronously with a stale (possibly MWEB) value from the shared slot.
  useEffect(() => {
    if (isUK && !route.params?.queryString && address && !hasBeenMounted) {
      openBuyWidget();
      setHasBeenMounted(true);
    }
  }, [isUK, address, route.params, openBuyWidget, hasBeenMounted]);

  // NOTE: For UK if exited WebPage before successful buy, go back
  useFocusEffect(
    React.useCallback(() => {
      if (
        isUK &&
        hasBeenMounted &&
        hasNavigatedBack &&
        !route.params?.queryString
      ) {
        navigation.goBack();
      }
    }, [isUK, hasBeenMounted, hasNavigatedBack, route.params, navigation]),
  );

  useEffect(() => {
    if (isUK) {
      const unsubscribe = navigation.addListener('blur', () => {
        setHasNavigatedBack(true);
      });
      return unsubscribe;
    }
  }, [isUK, navigation]);

  // handle successful purchase
  useEffect(() => {
    if (route.params) {
      if (route.params.queryString) {
        dispatch(getBuyTransactionHistory());
        setWasSuccessful(true);

        const parsedQueryString = parseQueryString(route.params.queryString);
        if (parsedQueryString) {
          if (parsedQueryString.hasOwnProperty('transactionId')) {
            setBuyTxid(parsedQueryString.transactionId);
          }
          if (parsedQueryString.hasOwnProperty('transactionStatus')) {
            setBuyTxStatus(parsedQueryString.transactionStatus);
          }
        }
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [route.params]);

  // NOTE: Removed beforeRemove listener that was causing navigation issues
  // The listener was preventing proper back navigation and causing infinite loops

  const SuccessScreen = (
    <>
      <View style={styles.body}>
        <TranslateText
          textKey="awesome"
          domain="settingsTab"
          maxSizeInPixels={SCREEN_HEIGHT * 0.07}
          textStyle={styles.title}
          numberOfLines={1}
        />
        <TranslateText
          textKey="buy_success"
          domain="buyTab"
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={styles.subtitle}
          numberOfLines={2}
        />
        {buyTxid ? (
          <View style={styles.toAddressContainer}>
            <TranslateText
              textValue={buyTxid}
              maxSizeInPixels={SCREEN_HEIGHT * 0.02}
              textStyle={styles.toAddressText}
              numberOfLines={4}
            />
          </View>
        ) : (
          <></>
        )}
      </View>
      <View style={styles.confirmButtonContainer}>
        <WhiteButton
          textKey="back_to_wallet"
          textDomain="settingsTab"
          disabled={false}
          active
          onPress={() => {
            navigation.goBack();
          }}
        />
      </View>
    </>
  );

  const Header = (
    <ScreenHeader
      rects={rects}
      paddingHorizontal={paddingHorizontal}
      fadeStyle={headerFadeStyle}
    />
  );

  // NOTE: NewMain's gradient, which bottoms out where the sheet meets it as on the
  // main screen; with no sheet up it runs to the screen's bottom edge
  const hasSheet = !isUK && !wasSuccessful;
  const Background = (
    <LinearGradient
      style={[styles.background, hasSheet ? styles.aboveSheet : null]}
      colors={SKIN_GRADIENT_COLORS}
      locations={SKIN_GRADIENT_LOCATIONS}
    />
  );

  if (isUK && !wasSuccessful) {
    return (
      <View style={styles.container}>
        {Background}
        {Header}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Background}
      {wasSuccessful ? (
        SuccessScreen
      ) : (
        <>
          <CustomSafeAreaView
            styles={styles.safeArea}
            edges={Platform.OS === 'android' ? ['top', 'bottom'] : ['top']}>
            <View style={styles.topContainer}>
              <TranslateText
                textKey={'purchasing'}
                domain={'buyTab'}
                maxSizeInPixels={SCREEN_HEIGHT * 0.03}
                textStyle={styles.titleText}
                numberOfLines={1}
              />
              <TranslateText
                textValue={`${ltcAmount} LTC`}
                maxSizeInPixels={SCREEN_HEIGHT * 0.08}
                textStyle={styles.amountText}
                numberOfLines={1}
              />
              <View style={styles.fiatAmount}>
                <TranslateText
                  textValue={`${currencySymbol}${totalAmount.toFixed(2)}`}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.05}
                  textStyle={styles.fiatAmountText}
                  numberOfLines={1}
                />
              </View>
            </View>

            <View style={styles.bottomSheetContainer}>
              <GlassCard>
                <GlassCardRow
                  titleTextKey="rate"
                  titleDomain="buyTab"
                  value={`${currencySymbol}${ltcPrice.toFixed(2)} per 1 LTC`}
                />
                <GlassCardHairline />
                <GlassCardRow
                  titleTextKey="provider_fee"
                  value={`${currencySymbol}${feeAmount.toFixed(2)}`}
                />
                <GlassCardHairline />
                <GlassCardRow
                  titleTextKey="network_fee"
                  value={`${currencySymbol}${networkFeeAmount.toFixed(2)}`}
                />
                {hasDiscount ? (
                  <>
                    <GlassCardHairline />
                    <GlassCardRow
                      titleTextKey="fee_discount"
                      titleDomain="buyTab"
                      value={`-${currencySymbol}${discount.toFixed(2)}`}
                      valueColor="#1ebc73"
                    />
                  </>
                ) : null}
              </GlassCard>
              <GlassCard>
                <GlassCardRow
                  titleTextKey="will_spend"
                  titleDomain="buyTab"
                  value={`${currencySymbol}${totalAmount.toFixed(2)}`}
                  valueColor="#2c72ff"
                  emphasized
                />
              </GlassCard>
            </View>
          </CustomSafeAreaView>
          <View style={fixedBottomStyle}>
            <GreenButtonV2
              textKey="continue_purchase"
              textDomain="buyTab"
              onPress={() => openBuyWidget()}
            />
          </View>
        </>
      )}
      {Header}
    </View>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  bottomInset: number,
  sheetHeightRatio: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: SKIN_GRADIENT_COLORS[SKIN_GRADIENT_COLORS.length - 1],
    },
    background: {
      ...StyleSheet.absoluteFill,
    },
    aboveSheet: {
      bottom:
        screenHeight * sheetHeightRatio +
        (Platform.OS === 'android' ? bottomInset : 0),
    },
    safeArea: {
      flex: 1,
      justifyContent: 'space-between',
    },
    topContainer: {
      paddingHorizontal: screenWidth * 0.04,
    },
    bottomSheetContainer: {
      width: '100%',
      height: screenHeight * sheetHeightRatio,
      backgroundColor: SHEET_BACKGROUND,
      borderTopLeftRadius: screenHeight * SHEET_TOP_RADIUS_RATIO,
      borderTopRightRadius: screenHeight * SHEET_TOP_RADIUS_RATIO,
      paddingTop: screenWidth * 0.03,
      paddingHorizontal: screenWidth * 0.03,
      overflow: 'hidden',
    },
    titleText: {
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.025,
      fontStyle: 'normal',
      fontWeight: '700',
      marginTop: screenHeight * 0.1,
    },
    amountText: {
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.06,
      fontStyle: 'normal',
      fontWeight: '400',
      marginTop: screenHeight * 0.01,
    },
    confirmButtonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.03,
      left: screenWidth * 0.04,
      width: screenWidth - screenWidth * 0.08,
    },
    fiatAmount: {
      width: 'auto',
      height: screenHeight * 0.05,
      borderRadius: screenHeight * 0.025,
      borderCurve: 'continuous',
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: BORDER_GRADIENT_COLORS[1],
      boxShadow: [
        {offsetX: 0, offsetY: 2, blurRadius: 8, color: 'rgba(0, 0, 0, 0.07)'},
        {
          offsetX: 0,
          offsetY: 0.5,
          blurRadius: 0,
          color: BORDER_GRADIENT_COLORS[0],
          inset: true,
        },
        {
          offsetX: 0,
          offsetY: -0.5,
          blurRadius: 0,
          color: BORDER_GRADIENT_COLORS[2],
          inset: true,
        },
      ],
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: screenHeight * 0.01,
      paddingHorizontal: screenHeight * 0.02,
      alignSelf: 'flex-start',
      marginTop: screenHeight * 0.01,
    },
    fiatAmountText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    body: {
      width: '100%',
      height: '100%',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: screenHeight * 0.03,
    },
    title: {
      width: '100%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.07,
      fontStyle: 'normal',
      fontWeight: '700',
      textAlign: 'center',
      marginTop: screenHeight * 0.05 * -1,
    },
    subtitle: {
      width: '100%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.016,
      fontStyle: 'normal',
      fontWeight: '700',
      textTransform: 'uppercase',
      textAlign: 'center',
      opacity: 0.9,
      marginTop: screenHeight * 0.005,
    },
    toAddressContainer: {
      width: 'auto',
      height: 'auto',
      borderRadius: screenHeight * 0.012,
      backgroundColor: 'rgba(240, 240, 240, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: screenHeight * 0.05,
      paddingLeft: screenWidth * 0.05,
      paddingRight: screenWidth * 0.05,
      paddingTop: screenWidth * 0.02,
      paddingBottom: screenWidth * 0.02,
    },
    toAddressText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.025,
      fontStyle: 'normal',
      fontWeight: '500',
      textAlign: 'center',
    },
  });

export default ConfirmBuy;
