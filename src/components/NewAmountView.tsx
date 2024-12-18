import React, {useContext} from 'react';
import {View, Text, StyleSheet, Platform, SafeAreaView} from 'react-native';

import {chartPercentageChangeSelector} from '../reducers/chart';
import {subunitSelector} from '../reducers/settings';
import {fiatValueSelector} from '../reducers/ticker';
import {useAppSelector} from '../store/hooks';
import PriceIndicatorButton from './Buttons/PriceIndictorButton';
import Animated from 'react-native-reanimated';
import {formatDate, formatTime} from '../lib/utils/date';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  children: React.ReactNode;
  animatedProps: any;
}

const NewAmountView: React.FC<Props> = props => {
  const {children, animatedProps} = props;

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useContext(ScreenSizeContext);
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
  const convertToSubunit = useAppSelector(state => subunitSelector(state));
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
            Platform.OS === 'android' ? {paddingTop: insets.top} : null,
          ]}>
          {!chartCursorSelected ? (
            <>
              <Text style={styles.amountText}>{subunitAmount}</Text>
              <View style={styles.fiat}>
                <Text style={styles.fiatText}>{fiatAmount}</Text>
                <PriceIndicatorButton value={Number(chartPercentageChange)} />
                <Text style={styles.fiatText}>{chartPercentageChange}</Text>
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
          <View style={styles.internetContainer}>
            <Text style={styles.internetText}>
              You are offline.
              {'\n'}
              Connect to the internet.
            </Text>
          </View>
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
      top: screenHeight * 0.045,
      flexDirection: 'column',
      alignItems: 'center',
    },
    amount: {
      height: screenHeight * 0.07,
    },
    amountText: {
      fontFamily:
        Platform.OS === 'ios'
          ? 'Satoshi Variable'
          : 'SatoshiVariable-Regular.ttf',
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
      fontFamily:
        Platform.OS === 'ios'
          ? 'Satoshi Variable'
          : 'SatoshiVariable-Regular.ttf',
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
      fontFamily:
        Platform.OS === 'ios'
          ? 'Satoshi Variable'
          : 'SatoshiVariable-Regular.ttf',
      fontStyle: 'normal',
      fontWeight: '500',
      color: 'white',
      fontSize: screenHeight * 0.025,
      textAlign: 'center',
    },
    internetBackground: {
      backgroundColor: '#F36F56',
    },
  });

export default NewAmountView;
