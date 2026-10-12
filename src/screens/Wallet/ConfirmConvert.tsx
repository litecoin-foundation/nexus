import React, {useContext, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  DeviceEventEmitter,
  Platform,
  Alert,
} from 'react-native';
import {NavigatorScreenParams, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import PlasmaModal from '../../components/Modals/PlasmaModal';
import PinModalContent from '../../components/Modals/PinModalContent';
import LoadingIndicator from '../../components/LoadingIndicator';
import GreenButtonV2 from '../../components/ButtonsV2/GreenButtonV2';
import {BUTTON_HEIGHT_RATIO} from '../../components/ButtonsV2/BlueButtonV2';
import {
  GAP_RATIO,
  useFixedBottomStyle,
} from '../../components/ButtonsV2/fixedBottomStyle';
import {
  GlassCard,
  GlassCardHairline,
  GlassCardStackedRow,
  SECONDARY_TEXT,
} from '../../components/Cells/GlassCard';
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
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {sendConvertWithPsbt} from '../../reducers/transaction';
import {showError} from '../../reducers/errors';
import {
  satsToSubunitSelector,
  subunitCodeSelector,
  subunitToSatsSelector,
} from '../../reducers/settings';
import {MainStackParamList} from '../../navigation/types';
import {isLongAmount} from '../../utils/satoshis';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  ConfirmConvert: {
    isRegular: boolean;
    regularAmount: string;
    privateAmount: string;
    regularConfirmedBalance: string;
    privateConfirmedBalance: string;
  };
  SuccessConvert: {
    txid: string;
    amount: number;
    isRegular: boolean;
  };
  Main: NavigatorScreenParams<MainStackParamList>;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'ConfirmConvert'>;
  route: RouteProp<RootStackParamList, 'ConfirmConvert'>;
}

const ConfirmConvert: React.FC<Props> = props => {
  const {navigation, route} = props;
  const {
    isRegular,
    regularAmount,
    privateAmount,
    regularConfirmedBalance,
    privateConfirmedBalance,
  } = route.params;
  const dispatch = useAppDispatch();

  const {t} = useTranslation('settingsTab');
  const {t: tConvert} = useTranslation('convertTab');

  const [loading, setLoading] = useState(false);

  const amountCode = useAppSelector(state => subunitCodeSelector(state));
  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const convertToSats = useAppSelector(state => subunitToSatsSelector(state));

  const regularAmountInSubunit = convertToSubunit(
    Number(regularAmount) * 100000000,
  );
  const privateAmountInSubunit = convertToSubunit(
    Number(privateAmount) * 100000000,
  );
  const regularConfirmedBalanceInSubunit = convertToSubunit(
    regularConfirmedBalance,
  );
  const privateConfirmedBalanceInSubunit = convertToSubunit(
    privateConfirmedBalance,
  );
  const newRegularBalance = isRegular
    ? convertToSubunit(
        Number(regularConfirmedBalance) - Number(regularAmount) * 100000000,
      )
    : regularAmountInSubunit;
  const newPrivateBalance = !isRegular
    ? convertToSubunit(
        Number(privateConfirmedBalance) - Number(privateAmount) * 100000000,
      )
    : privateAmountInSubunit;
  const amount = isRegular ? regularAmountInSubunit : privateAmountInSubunit;
  const longAmount = isLongAmount(amount);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const insets = useSafeAreaInsets();
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, insets);
  const fixedBottomStyle = useFixedBottomStyle();
  const {rects, paddingHorizontal} = useScreenHeaderLayout();
  const headerFadeStyle = useScreenHeaderArrival();

  const [isPinModalOpened, setIsPinModalOpened] = useState(false);
  const pinModalAction = useRef<string>('convert-auth');
  function openPinModal(action: string) {
    pinModalAction.current = action;
    setIsPinModalOpened(true);
  }

  const handleAuthenticationRequired = (action: string) => {
    return new Promise<void>((resolve, reject) => {
      openPinModal(action);
      const subscription = DeviceEventEmitter.addListener(action, bool => {
        if (bool === true) {
          setIsPinModalOpened(false);
          subscription.remove();
          resolve();
        } else if (bool === false) {
          subscription.remove();
          reject();
        }
      });
    });
  };

  const handleConvert = async () => {
    setIsPinModalOpened(false);
    setLoading(true);
    try {
      const amt = isRegular ? regularAmount : privateAmount;
      const destination = isRegular ? 'private' : 'regular';
      const txid = await dispatch(
        sendConvertWithPsbt(convertToSats(Number(amt)), destination),
      );
      setLoading(false);
      navigation.navigate('SuccessConvert', {
        txid: String(txid),
        amount,
        isRegular,
      });
    } catch (error) {
      setLoading(false);
      dispatch(showError(String(error)));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <LinearGradient
          style={styles.background}
          colors={SKIN_GRADIENT_COLORS}
          locations={SKIN_GRADIENT_LOCATIONS}
        />
        <TranslateText
          textKey="convert"
          domain="main"
          maxSizeInPixels={SCREEN_HEIGHT * 0.03}
          textStyle={styles.titleText}
          numberOfLines={1}
        />
        <TranslateText
          textValue={amount + ' ' + amountCode}
          maxSizeInPixels={SCREEN_HEIGHT * (longAmount ? 0.056 : 0.08)}
          textStyle={[
            styles.amountText,
            longAmount ? styles.amountTextSmall : null,
          ]}
          numberOfLines={1}
        />
        <View style={styles.fromTo}>
          <TranslateText
            textKey={isRegular ? 'regular_to_private' : 'private_to_regular'}
            domain="convertTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.05}
            textStyle={styles.fromToText}
            numberOfLines={1}
          />
        </View>
      </View>

      <View style={styles.bottomSheetContainer}>
        <GlassCard>
          <GlassCardStackedRow
            titleTextValue={tConvert('regular').toUpperCase()}
            value={`${regularConfirmedBalanceInSubunit} → ${newRegularBalance} ${amountCode}`}
            largeValue
          />
          <GlassCardHairline />
          <GlassCardStackedRow
            titleTextValue={tConvert('private').toUpperCase()}
            value={`${privateConfirmedBalanceInSubunit} → ${newPrivateBalance} ${amountCode}`}
            largeValue
          />
        </GlassCard>
        {!isRegular ? (
          <TranslateText
            textKey="private_to_regular_note"
            domain="convertTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.017}
            textStyle={styles.noteText}
            numberOfLines={6}
          />
        ) : null}
      </View>

      <View style={fixedBottomStyle}>
        <GreenButtonV2
          textKey="confirm_convert"
          textDomain="convertTab"
          onPress={() => handleAuthenticationRequired('convert-auth')}
        />
      </View>

      <PlasmaModal
        isOpened={isPinModalOpened}
        close={() => {
          setIsPinModalOpened(false);
        }}
        isFromBottomToTop={true}
        animDuration={250}
        gapInPixels={0}
        backSpecifiedStyle={{backgroundColor: 'rgba(19,58,138, 0.6)'}}
        renderBody={(_, __, ___, ____, cardTranslateAnim: any) => (
          <PinModalContent
            cardTranslateAnim={cardTranslateAnim}
            close={() => setIsPinModalOpened(false)}
            handleValidationFailure={() =>
              Alert.alert('Incorrect Pincode', undefined, [
                {
                  text: t('dismiss'),
                  onPress: () => setIsPinModalOpened(false),
                  style: 'cancel',
                },
              ])
            }
            handleValidationSuccess={() => handleConvert()}
          />
        )}
      />

      <LoadingIndicator visible={loading} />

      <ScreenHeader
        rects={rects}
        paddingHorizontal={paddingHorizontal}
        rightTextKey="cancel"
        rightTextDomain="buyTab"
        onRightPress={() =>
          navigation.popTo('Main', {
            screen: 'MainScreen',
            params: {isInitial: true},
          })
        }
        fadeStyle={headerFadeStyle}
      />
    </View>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  insets: {top: number; bottom: number},
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: SKIN_GRADIENT_COLORS[SKIN_GRADIENT_COLORS.length - 1],
      paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
    },
    background: {
      ...StyleSheet.absoluteFill,
    },
    topContainer: {
      flex: 1,
      paddingTop: insets.top,
      paddingHorizontal: screenWidth * 0.04,
    },
    bottomSheetContainer: {
      width: '100%',
      backgroundColor: SHEET_BACKGROUND,
      borderTopLeftRadius: screenHeight * SHEET_TOP_RADIUS_RATIO,
      borderTopRightRadius: screenHeight * SHEET_TOP_RADIUS_RATIO,
      paddingTop: screenWidth * 0.03,
      paddingHorizontal: screenWidth * 0.03,
      paddingBottom:
        screenHeight * BUTTON_HEIGHT_RATIO + screenWidth * GAP_RATIO * 2,
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
    amountTextSmall: {
      fontSize: screenHeight * 0.042,
    },
    fromTo: {
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
    fromToText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    noteText: {
      color: SECONDARY_TEXT,
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.014,
      fontStyle: 'normal',
      fontWeight: '500',
      paddingHorizontal: screenWidth * 0.045,
    },
  });

export default ConfirmConvert;
