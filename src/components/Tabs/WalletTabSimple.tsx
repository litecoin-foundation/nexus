import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import PriceIndicatorButton from '../Buttons/PriceIndictorButton';

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

  const change: any = (priceRate / prevRate) * 100 - 100;
  const changeText =
    change < 0 ? '' : '+' + parseFloat(change).toFixed(2) + '%';

  const balanceTextSizeStyle = {
    fontSize: String(balance).length > 7 ? Dimensions.get('screen').height * 0.03 : Dimensions.get('screen').height * 0.04,
  };

  return (
    <View style={styles(isWhiteStyle).walletTab}>
      <View style={styles(isWhiteStyle).tab}>
        <Text style={styles(isWhiteStyle).tabTitle}>{walletName}</Text>
        <Text style={[styles(isWhiteStyle).tabBalance, balanceTextSizeStyle]}>
          {balance + ' LTC'}
        </Text>
        <View style={styles(isWhiteStyle).tabWorthContainer}>
          <Text style={styles(isWhiteStyle).tabWorth}>{fiatBalance}</Text>
          <PriceIndicatorButton value={Number(change)} />
          <Text style={styles(isWhiteStyle).tabWorthChange}>
            {changeText}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = (isWhiteStyle?: boolean) =>
  StyleSheet.create({
    walletTab: {
      height: Dimensions.get('screen').height * 0.14,
      minHeight: 100,
      width: '100%',
      borderRadius: Dimensions.get('screen').height * 0.02,
      backgroundColor: isWhiteStyle ? '#fff' : '#193A72',
      flexDirection: 'row',
      alignItems: 'center',
      padding: Dimensions.get('screen').height * 0.015,
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
      fontSize: Dimensions.get('screen').height * 0.018,
    },
    tabBalance: {
      color: isWhiteStyle ? '#000' : '#fff',
      fontFamily:
        Platform.OS === 'ios'
          ? 'Satoshi Variable'
          : 'SatoshiVariable-Regular.ttf',
      fontStyle: 'normal',
      fontWeight: '400',
      fontSize: Dimensions.get('screen').height * 0.04,
      marginTop: Dimensions.get('screen').height * 0.008 * -1,
    },
    tabWorthContainer: {
      flexDirection: 'row',
      gap: Dimensions.get('screen').height * 0.012,
    },
    tabWorth: {
      color: isWhiteStyle ? '#000' : '#fff',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: Dimensions.get('screen').height * 0.016,
    },
    tabWorthChange: {
      color: isWhiteStyle ? '#000' : '#fff',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: Dimensions.get('screen').height * 0.016,
    },
  });

export default WalletTabSimple;
