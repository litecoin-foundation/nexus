import React, {useContext} from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import PriceIndicatorButton from '../Buttons/PriceIndictorButton';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  colorStyle: string;
  walletName: string;
  balance: number;
  fiatBalance: number;
  priceRate: number;
  prevRate: number;
}

const WalletTabSimple: React.FC<Props> = (props: Props) => {
  const {colorStyle, walletName, balance, fiatBalance, priceRate, prevRate} =
    props;

  let isWhiteStyle = true;
  switch (colorStyle) {
    case 'White':
      isWhiteStyle = true;
      break;
    case 'Blue':
      isWhiteStyle = false;
      break;
    default:
      break;
  }

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, isWhiteStyle);

  const change: any = (priceRate / prevRate) * 100 - 100;
  const changeText =
    change < 0 ? '' : '+' + parseFloat(change).toFixed(2) + '%';

  const balanceTextSizeStyle = {
    fontSize:
      String(balance).length > 7 ? SCREEN_HEIGHT * 0.03 : SCREEN_HEIGHT * 0.04,
  };

  return (
    <View style={styles.walletTab}>
      <View style={styles.tab}>
        <Text style={styles.tabTitle}>{walletName}</Text>
        <Text style={[styles.tabBalance, balanceTextSizeStyle]}>
          {balance + ' LTC'}
        </Text>
        <View style={styles.tabWorthContainer}>
          <Text style={styles.tabWorth}>{fiatBalance}</Text>
          <PriceIndicatorButton value={Number(change)} />
          <Text style={styles.tabWorthChange}>{changeText}</Text>
        </View>
      </View>
    </View>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  isWhiteStyle?: boolean,
) =>
  StyleSheet.create({
    walletTab: {
      height: screenHeight * 0.14,
      minHeight: 100,
      width: '100%',
      borderRadius: screenHeight * 0.02,
      backgroundColor: isWhiteStyle ? '#fff' : '#193A72',
      flexDirection: 'row',
      alignItems: 'center',
      padding: screenHeight * 0.015,
    },
    tab: {
      flexBasis: '100%',
      height: '90%',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    tabTitle: {
      color: isWhiteStyle ? '#555' : '#ddd',
      fontStyle: 'normal',
      fontWeight: '600',
      fontSize: screenHeight * 0.018,
    },
    tabBalance: {
      color: isWhiteStyle ? '#000' : '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '400',
      fontSize: screenHeight * 0.04,
      marginTop: screenHeight * 0.008 * -1,
    },
    tabWorthContainer: {
      flexDirection: 'row',
      gap: screenHeight * 0.012,
    },
    tabWorth: {
      color: isWhiteStyle ? '#000' : '#fff',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: screenHeight * 0.016,
    },
    tabWorthChange: {
      color: isWhiteStyle ? '#000' : '#fff',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: screenHeight * 0.016,
    },
  });

export default WalletTabSimple;
