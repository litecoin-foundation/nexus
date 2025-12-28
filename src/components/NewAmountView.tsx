import React, {useContext, useRef, useState, useEffect} from 'react';
import {View, StyleSheet, Image} from 'react-native';
import Animated from 'react-native-reanimated';
import {LongPressGestureHandler, State} from 'react-native-gesture-handler';

import PriceIndicatorButton from './Buttons/PriceIndictorButton';
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
}

const NewAmountView: React.FC<Props> = props => {
  const {children, animatedProps, internetOpacityStyle, onTriggerLester} =
    props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

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

  // 3s timer
  const [momentTime, setMomentTime] = useState(Math.floor(Date.now() / 1000));
  useEffect(() => {
    setTimeout(() => {
      const currentTimeInSec = Math.floor(Date.now() / 1000);
      setMomentTime(currentTimeInSec);
    }, 3000);
  }, [momentTime]);

  // check peers
  const peersLength = useAppSelector(state => state.info?.peers?.length || 0);
  const noConnectionWarningTimeoutRef = useRef<number>(
    Math.floor(Date.now() / 1000),
  );
  const [isConnectedToPeers, setIsConnectedToPeers] = useState(true);
  useEffect(() => {
    // NOTE: 11sec delay cause peers are polled every 10sec
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
  }, [peersLength, momentTime]);

  return (
    <LongPressGestureHandler
      ref={longPressRef}
      onHandlerStateChange={onEasterEggHandlerStateChange}
      minDurationMs={2000}
      maxDist={10000}>
      <Animated.View
        style={[
          styles.container,
          animatedProps,
          !isInternetReachable ? styles.internetBackground : null,
        ]}>
        <CustomSafeAreaView
          styles={styles.safeArea}
          edges={['top']}
          platform="both">
          <View style={styles.subview}>
          {!chartCursorSelected ? (
            <>
              <TranslateText
                textValue={subunitAmountFormatted}
                domain={'main'}
                maxSizeInPixels={SCREEN_HEIGHT * 0.05}
                textStyle={styles.amountText}
                numberOfLines={1}
              />
              <View style={styles.fiat}>
                <TranslateText
                  textValue={fiatAmount}
                  domain={'main'}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                  textStyle={styles.fiatText}
                  numberOfLines={1}
                />
                <PriceIndicatorButton value={chartPercentage} />
                <TranslateText
                  textValue={String(chartPercentageChange)}
                  domain={'main'}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                  textStyle={styles.fiatText}
                  numberOfLines={1}
                />
              </View>
            </>
          ) : chartMode === 'balance' ? (
            <>
              <TranslateText
                textValue={`${chartCursorValue.toFixed(8)} LTC`}
                domain={'main'}
                maxSizeInPixels={SCREEN_HEIGHT * 0.05}
                textStyle={styles.amountText}
                numberOfLines={1}
              />
              <View style={styles.fiat}>
                <TranslateText
                  textValue={`${formatDate(chartCursorDate)} ${formatTime(chartCursorDate)}`}
                  domain={'main'}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                  textStyle={styles.fiatText}
                  numberOfLines={1}
                />
              </View>
            </>
          ) : (
            <>
              <TranslateText
                textValue={`$${chartCursorValue}`}
                domain={'main'}
                maxSizeInPixels={SCREEN_HEIGHT * 0.05}
                textStyle={styles.amountText}
                numberOfLines={1}
              />
              <View style={styles.fiat}>
                <TranslateText
                  textValue={`${formatDate(chartCursorDate)} ${formatTime(chartCursorDate)}`}
                  domain={'main'}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                  textStyle={styles.fiatText}
                  numberOfLines={1}
                />
              </View>
            </>
          )}
        </View>
        {isInternetReachable ? (
          isConnectedToPeers ? (
            <View style={styles.childrenContainer}>{children}</View>
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
      </Animated.View>
    </LongPressGestureHandler>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      top: 0,
      width: '100%',
      backgroundColor: '#1162E6',
      borderBottomLeftRadius: screenHeight * 0.03,
      borderBottomRightRadius: screenHeight * 0.03,
    },
    safeArea: {
      flex: 1,
    },
    subview: {
      alignItems: 'center',
      marginTop: screenHeight * 0.05,
    },
    amount: {
      height: screenHeight * 0.07,
    },
    amountText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '400',
      color: 'white',
      fontSize: screenHeight * 0.05,
      lineHeight: screenHeight * 0.06,
    },
    fiat: {
      height: screenHeight * 0.02,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    fiatText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: 'white',
      fontSize: screenHeight * 0.015,
    },
    childrenContainer: {
      marginTop: screenHeight * 0.03 * -1,
    },
    internetContainer: {
      marginTop: screenHeight * 0.03,
    },
    internetText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '500',
      color: 'white',
      fontSize: screenHeight * 0.025,
      textAlign: 'center',
    },
    internetBackground: {
      backgroundColor: '#F36F56',
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

export default NewAmountView;
