import React, {useContext, useRef, useState, useEffect} from 'react';
import {View, StyleSheet, Image} from 'react-native';
import Animated, {SharedValue} from 'react-native-reanimated';
import {LongPressGestureHandler, State} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import LiquidGlassBackdrop from './LiquidGlassBackdrop';
import {GLASS_CHART_HEIGHT_RATIO, getGlassChartGap} from './GlassChart';
import {
  CARD_FOLD_RADIUS_RATIO,
  getNewMainSheetPoints,
} from '../animations/useNewMainAnims';
import {GLASS_TAB_CLUSTER_TOP_OFFSET_RATIO} from './glassTabLayout';
import {
  BALANCE_BLOCK_HEIGHT_RATIO,
  getBalanceBlockBottom,
  GlassBalanceModel,
} from './GlassBalanceGraphics';
import {chartPercentageChangeSelector} from '../reducers/chart';
import {satsToSubunitSelector} from '../reducers/settings';
import {fiatValueSelector} from '../reducers/ticker';
import {useAppSelector} from '../store/hooks';
import {formatDate, formatTime} from '../utils/date';
import {triggerMediumFeedback} from '../utils/haptic';

import CustomSafeAreaView from '../components/CustomSafeAreaView';
import TranslateText from '../components/TranslateText';
import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  children: React.ReactNode;
  animatedProps: any;
  internetOpacityStyle: any;
  onTriggerLester?: () => void;
  // Drives the backdrop's gradient and glass geometry.
  mainSheetsTranslationY: SharedValue<number>;
  activeTab: number;
}

const GlassAmountView: React.FC<Props> = props => {
  const {
    children,
    animatedProps,
    internetOpacityStyle,
    onTriggerLester,
    mainSheetsTranslationY,
    activeTab,
  } = props;

  const insets = useSafeAreaInsets();
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  // Shared chart slot for the touch overlay and Skia graph.
  const {FOLD_SHEET_POINT} = getNewMainSheetPoints(SCREEN_HEIGHT, insets.top);
  const chartBlockHeight =
    SCREEN_HEIGHT * GLASS_CHART_HEIGHT_RATIO +
    getGlassChartGap(SCREEN_HEIGHT) +
    SCREEN_HEIGHT * 0.03;
  const balanceBottom = getBalanceBlockBottom(SCREEN_HEIGHT, insets.top);
  const clusterTop =
    FOLD_SHEET_POINT + SCREEN_HEIGHT * GLASS_TAB_CLUSTER_TOP_OFFSET_RATIO;
  const chartTop =
    balanceBottom + (clusterTop - balanceBottom - chartBlockHeight) / 2;

  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, chartTop);

  const chartCursorSelected = useAppSelector(
    state => state.chart!.cursorSelected,
  );
  const chartCursorValue = useAppSelector(state => state.chart!.cursorValue);
  const chartCursorDate = useAppSelector(state => state.chart!.cursorDate);
  const chartMode = useAppSelector(state => state.settings!.chartMode);
  const chartPercentageChange = useAppSelector(state =>
    chartPercentageChangeSelector(state),
  );
  const chartPercentage =
    chartPercentageChange && chartPercentageChange.length > 0
      ? Number(
          chartPercentageChange.substring(0, chartPercentageChange.length - 1),
        )
      : 0;

  const totalBalance = useAppSelector(state => state.balance!.totalBalance);
  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const subunitAmount = convertToSubunit(totalBalance);
  let subunitAmountFormatted = String(
    parseFloat(String(subunitAmount)).toFixed(9),
  );
  if (subunitAmountFormatted.match(/\./)) {
    subunitAmountFormatted = subunitAmountFormatted.replace(/\.?0+$/, '');
  }

  const calculateFiatAmount = useAppSelector(state => fiatValueSelector(state));
  const fiatAmount = calculateFiatAmount(totalBalance);

  const {isInternetReachable} = useAppSelector(state => state.info!);

  // Display strings for the Skia-drawn balance block.
  const balanceModel: GlassBalanceModel = !chartCursorSelected
    ? {
        amountText: subunitAmountFormatted,
        fiatText: fiatAmount,
        percentText: String(chartPercentageChange),
        percentValue: chartPercentage,
      }
    : {
        amountText:
          chartMode === 'balance'
            ? `${chartCursorValue.toFixed(8)} LTC`
            : `$${chartCursorValue}`,
        fiatText: `${formatDate(chartCursorDate)} ${formatTime(chartCursorDate)}`,
        percentText: null,
        percentValue: 0,
      };

  const longPressRef = useRef(null);

  const onEasterEggHandlerStateChange = (e: any) => {
    const {nativeEvent} = e;
    if (nativeEvent.state === State.ACTIVE) {
      triggerMediumFeedback();
      if (onTriggerLester) {
        onTriggerLester();
      }
    }
  };

  const [momentTime, setMomentTime] = useState(Math.floor(Date.now() / 1000));
  useEffect(() => {
    setTimeout(() => {
      const currentTimeInSec = Math.floor(Date.now() / 1000);
      setMomentTime(currentTimeInSec);
    }, 3000);
  }, [momentTime]);

  const peersLength = useAppSelector(state => state.info?.peers?.length || 0);
  const litecoinBackend = useAppSelector(
    state => state.settings?.litecoinBackend,
  );
  const noConnectionWarningTimeoutRef = useRef<number>(
    Math.floor(Date.now() / 1000),
  );
  const [isConnectedToPeers, setIsConnectedToPeers] = useState(true);
  useEffect(() => {
    if (litecoinBackend === 'electrum') {
      setIsConnectedToPeers(true);
      return;
    }
    // Peers are polled every 10 seconds.
    if (
      noConnectionWarningTimeoutRef.current + 11 <
      Math.floor(Date.now() / 1000)
    ) {
      if (peersLength <= 0) {
        setIsConnectedToPeers(false);
      } else {
        setIsConnectedToPeers(true);
      }
    }
  }, [peersLength, momentTime, litecoinBackend]);

  return (
    <LongPressGestureHandler
      ref={longPressRef}
      onHandlerStateChange={onEasterEggHandlerStateChange}
      minDurationMs={2000}
      maxDist={10000}>
      <Animated.View style={[styles.container, animatedProps]}>
        <LiquidGlassBackdrop
          mainSheetsTranslationY={mainSheetsTranslationY}
          activeTab={activeTab}
          online={!!isInternetReachable}
          showChart={!!isInternetReachable && isConnectedToPeers}
          chartTop={chartTop}
          balance={balanceModel}
        />
        <CustomSafeAreaView
          styles={styles.safeArea}
          edges={['top']}
          platform="both">
          {isInternetReachable ? (
            isConnectedToPeers ? null : (
              <Animated.View style={internetOpacityStyle}>
                <View style={styles.internetContainer}>
                  <View style={styles.internetImageContainer}>
                    <Image
                      style={styles.internetImage}
                      source={require('../assets/images/no-internet-graph.png')}
                    />
                  </View>
                  <TranslateText
                    textKey="lnd_no_connection"
                    domain="main"
                    textStyle={styles.peersText}
                    maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                    numberOfLines={3}
                  />
                </View>
              </Animated.View>
            )
          ) : (
            <Animated.View style={internetOpacityStyle}>
              <View style={styles.internetContainer}>
                <View style={styles.internetImageContainer}>
                  <Image
                    style={styles.internetImage}
                    source={require('../assets/images/no-internet-graph.png')}
                  />
                </View>
                <TranslateText
                  textKey="offline_description"
                  domain="onboarding"
                  textStyle={styles.internetText}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.025}
                  numberOfLines={3}
                />
              </View>
            </Animated.View>
          )}
        </CustomSafeAreaView>
        {isInternetReachable && isConnectedToPeers ? (
          <View style={styles.childrenContainer} pointerEvents="box-none">
            {children}
          </View>
        ) : null}
      </Animated.View>
    </LongPressGestureHandler>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  chartTop: number,
) =>
  StyleSheet.create({
    container: {
      top: 0,
      width: '100%',
      backgroundColor: 'transparent',
      borderBottomLeftRadius: screenHeight * CARD_FOLD_RADIUS_RATIO,
      borderBottomRightRadius: screenHeight * CARD_FOLD_RADIUS_RATIO,
      overflow: 'hidden',
    },
    safeArea: {
      flex: 1,
    },
    childrenContainer: {
      // Matches the drawn chart's position.
      position: 'absolute',
      top: chartTop,
      left: 0,
      right: 0,
    },
    internetContainer: {
      // Clears the Skia-drawn balance block.
      marginTop: screenHeight * (BALANCE_BLOCK_HEIGHT_RATIO + 0.03),
    },
    internetText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '500',
      color: 'white',
      fontSize: screenHeight * 0.025,
      textAlign: 'center',
    },
    internetImageContainer: {
      justifyContent: 'center',
      paddingTop: screenHeight * 0.03,
      paddingBottom: screenHeight * 0.03,
    },
    internetImage: {
      justifyContent: 'center',
      alignSelf: 'center',
    },
    peersText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '500',
      color: 'white',
      fontSize: screenHeight * 0.02,
      textAlign: 'center',
      paddingTop: screenHeight * 0.02,
      paddingHorizontal: screenWidth * 0.1,
    },
  });

export default GlassAmountView;
