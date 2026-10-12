import React, {useContext} from 'react';
import {
  NavigatorScreenParams,
  RouteProp,
  useNavigation,
} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {StyleSheet, View, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import BlueButtonV2, {
  BUTTON_HEIGHT_RATIO,
} from '../../components/ButtonsV2/BlueButtonV2';
import WhiteButtonV2 from '../../components/ButtonsV2/WhiteButtonV2';
import {
  GAP_RATIO,
  useFixedBottomStyle,
} from '../../components/ButtonsV2/fixedBottomStyle';
import {
  GlassCard,
  GlassCardHairline,
  GlassCardRow,
  GlassCardStackedRow,
} from '../../components/Cells/GlassCard';
import {BORDER_GRADIENT_COLORS} from '../../components/LiquidGlassBackdrop';
import {SHEET_BACKGROUND} from '../../components/GlassTxRows';
import {SHEET_TOP_RADIUS_RATIO} from '../../components/GlassBottomSheet';
import {
  SKIN_GRADIENT_COLORS,
  SKIN_GRADIENT_LOCATIONS,
} from '../../components/FoldedSkinView';
import {
  satsToSubunitSelector,
  subunitCodeSelector,
} from '../../reducers/settings';
import {fiatValueSelector} from '../../reducers/ticker';
import {useAppSelector} from '../../store/hooks';
import {MainStackParamList} from '../../navigation/types';
import {isLongAmount} from '../../utils/satoshis';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

// Height fraction
const BUTTONS_GAP_RATIO = 0.015;

type RootStackParamList = {
  SuccessSend: {
    txid: string;
    amount: number;
    toAddress: string;
  };
  Main: NavigatorScreenParams<MainStackParamList>;
};

interface Props {
  route: RouteProp<RootStackParamList, 'SuccessSend'>;
}

const SuccessSend: React.FC<Props> = ({route}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const insets = useSafeAreaInsets();
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, insets);
  const fixedBottomStyle = useFixedBottomStyle();

  const {txid, amount, toAddress} = route.params;
  const amountCode = useAppSelector(state => subunitCodeSelector(state));
  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const calculateFiatAmount = useAppSelector(state => fiatValueSelector(state));

  const amountInSubunit = convertToSubunit(amount);
  const longAmount = isLongAmount(amountInSubunit);

  const {t: tSend} = useTranslation('sendTab');

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <LinearGradient
          style={styles.background}
          colors={SKIN_GRADIENT_COLORS}
          locations={SKIN_GRADIENT_LOCATIONS}
        />
        <TranslateText
          textKey="just_sent"
          domain="sendTab"
          maxSizeInPixels={SCREEN_HEIGHT * 0.03}
          textStyle={styles.titleText}
          numberOfLines={1}
        />
        <TranslateText
          textValue={amountInSubunit + ' ' + amountCode}
          maxSizeInPixels={SCREEN_HEIGHT * (longAmount ? 0.056 : 0.08)}
          textStyle={[
            styles.amountText,
            longAmount ? styles.amountTextSmall : null,
          ]}
          numberOfLines={1}
        />
        <View style={styles.fiatAmount}>
          <TranslateText
            textValue={calculateFiatAmount(amount)}
            maxSizeInPixels={SCREEN_HEIGHT * 0.05}
            textStyle={styles.fiatAmountText}
            numberOfLines={1}
          />
        </View>
      </View>

      <View style={styles.bottomSheetContainer}>
        <GlassCard>
          <GlassCardStackedRow
            titleTextValue={tSend('send_to_address').toUpperCase()}
            value={toAddress}
          />
          {txid ? (
            <>
              <GlassCardHairline />
              <GlassCardRow titleTextKey="tx_id" value={txid} smallValue />
            </>
          ) : null}
        </GlassCard>
      </View>

      <View style={[fixedBottomStyle, styles.buttons]}>
        <WhiteButtonV2
          textKey="view_transaction"
          textDomain="sendTab"
          onPress={() => {
            navigation.popTo('Main', {
              screen: 'MainScreen',
              params: {isInitial: true, openSearch: true},
            });
          }}
        />
        <BlueButtonV2
          textKey="back_to_wallet"
          textDomain="settingsTab"
          onPress={() => {
            navigation.popTo('Main', {
              screen: 'MainScreen',
              params: {isInitial: true},
            });
          }}
        />
      </View>
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
        screenHeight * BUTTON_HEIGHT_RATIO * 2 +
        screenHeight * BUTTONS_GAP_RATIO +
        screenWidth * GAP_RATIO * 2,
      overflow: 'hidden',
    },
    buttons: {
      gap: screenHeight * BUTTONS_GAP_RATIO,
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
  });

export const SuccessSendNavigationOptions = () => {
  return {
    headerTitle: '',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => <></>,
    gestureEnabled: false,
  };
};

export default SuccessSend;
