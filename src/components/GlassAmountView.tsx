import React, {useContext, useMemo, useRef, useState, useEffect} from 'react';
import {View, StyleSheet, Image} from 'react-native';
import Animated, {SharedValue} from 'react-native-reanimated';
import {LongPressGestureHandler, State} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import LiquidGlassBackdrop from './LiquidGlassBackdrop';
import {GLASS_CHART_HEIGHT_RATIO, getGlassChartGap} from './GlassChart';
import {
  CARD_FOLD_RADIUS_RATIO,
  getFoldedTopHalfHeight,
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

// Peers are polled every 10 seconds; wait out one cycle before believing zero.
const PEER_GRACE_MS = 11000;

interface Props {
  children: React.ReactNode;
  internetOpacityStyle: any;
  onTriggerLester?: () => void;
  // Drives the backdrop's gradient and glass geometry.
  mainSheetsTranslationY: SharedValue<number>;
  activeTab: number;
}

const GlassAmountView: React.FC<Props> = props => {
  const {
    children,
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

  // LiquidGlassBackdrop is memoized, so keep the balance model stable when a
  // parent update does not change text it draws.
  const balanceModel: GlassBalanceModel = useMemo(
    () =>
      !chartCursorSelected
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
          },
    [
      chartCursorSelected,
      subunitAmountFormatted,
      fiatAmount,
      chartPercentageChange,
      chartPercentage,
      chartMode,
      chartCursorValue,
      chartCursorDate,
    ],
  );

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

  const peersLength = useAppSelector(state => state.info?.peers?.length || 0);
  const litecoinBackend = useAppSelector(
    state => state.settings?.litecoinBackend,
  );
  const mountedAtRef = useRef(Date.now());
  const [isConnectedToPeers, setIsConnectedToPeers] = useState(true);
  const connectedRef = useRef(true);
  // State changes only when the peer status changes. A clock in state would
  // re-record the backdrop for the life of the screen.
  useEffect(() => {
    const apply = (next: boolean) => {
      if (connectedRef.current !== next) {
        connectedRef.current = next;
        setIsConnectedToPeers(next);
      }
    };
    if (litecoinBackend === 'electrum') {
      apply(true);
      return;
    }
    const evaluate = () => {
      if (Date.now() - mountedAtRef.current < PEER_GRACE_MS) {
        return false;
      }
      apply(peersLength > 0);
      return true;
    };
    if (evaluate()) {
      return;
    }
    const tick = setInterval(() => {
      if (evaluate()) {
        clearInterval(tick);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [peersLength, litecoinBackend]);

  return (
    <LongPressGestureHandler
      ref={longPressRef}
      onHandlerStateChange={onEasterEggHandlerStateChange}
      minDurationMs={2000}
      maxDist={10000}>
      {/* fixed at the folded (max) height: the fold morph's edge is drawn
          as a clip inside the backdrop canvas, so no per-frame Yoga layout */}
      <Animated.View
        style={[
          styles.container,
          {height: getFoldedTopHalfHeight(SCREEN_HEIGHT, insets.top)},
        ]}>
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
