import React, {useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import PriceIndicatorButton from './Buttons/PriceIndictorButton';
import {chartPercentageChangeSelector} from '../reducers/chart';
import {satsToSubunitSelector} from '../reducers/settings';
import {fiatValueSelector} from '../reducers/ticker';
import {useAppSelector} from '../store/hooks';
import {formatDate, formatTime} from '../lib/utils/date';

import TranslateText from '../components/TranslateText';
import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  children: React.ReactNode;
  animatedProps: any;
  internetOpacityStyle: any;
}

const NewAmountView: React.FC<Props> = props => {
  const {children, animatedProps, internetOpacityStyle} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const insets = useSafeAreaInsets();

  const chartCursorSelected = useAppSelector(
    state => state.chart.cursorSelected,
  );
  const chartCursorValue = useAppSelector(state => state.chart.cursorValue);
  const chartCursorDate = useAppSelector(state => state.chart.cursorDate);
  const chartPercentageChange = useAppSelector(state =>
    chartPercentageChangeSelector(state),
  );

  const totalBalance = useAppSelector(state => state.balance.totalBalance);
  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const subunitAmount = convertToSubunit(totalBalance);

  const calculateFiatAmount = useAppSelector(state => fiatValueSelector(state));
  const fiatAmount = calculateFiatAmount(totalBalance);

  const {isInternetReachable} = useAppSelector(state => state.info);
  return (
    <Animated.View
      style={[
        styles.container,
        animatedProps,
        !isInternetReachable ? styles.internetBackground : null,
      ]}>
      <SafeAreaView>
        <View
          style={[
            styles.subview,
            Platform.OS === 'android' ? {paddingTop: insets.top + 7} : null,
          ]}>
          {!chartCursorSelected ? (
            <>
              <TranslateText
                textValue={subunitAmount}
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
                <PriceIndicatorButton value={Number(chartPercentageChange)} />
                <TranslateText
                  textValue={String(chartPercentageChange)}
                  domain={'main'}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                  textStyle={styles.fiatText}
                  numberOfLines={1}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.amountText}>${chartCursorValue}</Text>
              <View style={styles.fiat}>
                <Text style={styles.fiatText}>
                  {formatDate(chartCursorDate)} {formatTime(chartCursorDate)}
                </Text>
              </View>
            </>
          )}
        </View>
        {isInternetReachable ? (
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
              <Text style={styles.internetText}>
                You are offline.
                {'\n'}
                Connect to the internet.
              </Text>
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    </Animated.View>
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
    subview: {
      top: screenHeight < 701 ? screenHeight * 0.04 : screenHeight * 0.05,
      flexDirection: 'column',
      alignItems: 'center',
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
      paddingTop: screenHeight * 0.03,
    },
    internetContainer: {
      paddingTop: screenHeight * 0.06,
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
  });

export default NewAmountView;
