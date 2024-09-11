import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useMoonPaySdk} from '@moonpay/react-native-moonpay-sdk';

import HeaderButton from '../../components/Buttons/HeaderButton';
import Header from '../../components/Header';

interface Props {}

const ConfirmSell: React.FC<Props> = props => {
  const {MoonPayWebViewComponent} = useMoonPaySdk({
    sdkConfig: {
      flow: 'sell',
      environment: 'production',
      params: {
        apiKey: 'pk_live_oh73eavK2ZIRR7wxHjWD7HrkWk2nlSr',
        baseCurrencyCode: 'ltc',
      },
      handlers: {
        async onInitiateDeposit(properties: OnInitiateDepositProps) {
          console.log('intiate deposit is being called!!!');

          const {cryptoCurrency, cryptoCurrencyAmount, depositWalletAddress} =
            properties;

          // handle

          //   return { depositId };
        },
      },
    },
  });
  return (
    <View style={styles.container}>
      <Header />
      <MoonPayWebViewComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export const ConfirmSellNavigationOptions = navigation => {
  return {
    headerTitle: '',
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default ConfirmSell;
