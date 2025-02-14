import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {useMoonPaySdk} from '@moonpay/react-native-moonpay-sdk';
import {useDispatch} from 'react-redux';

import HeaderButton from '../../components/Buttons/HeaderButton';
import Header from '../../components/Header';
import {useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import {showError} from '../../reducers/errors';

import TranslateText from '../../components/TranslateText';

interface Props {}

const ConfirmSell: React.FC<Props> = props => {
  const dispatch = useDispatch();
  const {uniqueId} = useAppSelector(state => state.onboarding);
  const {amount} = useAppSelector(state => state.input);
  const {address} = useAppSelector(state => state.address);

  useEffect(() => {
    dispatch(getAddress(false));
  }, [dispatch]);

  const {MoonPayWebViewComponent, generateUrlForSigning, updateSignature} =
    useMoonPaySdk({
      sdkConfig: {
        flow: 'sell',
        environment: 'production',
        params: {
          apiKey: 'pk_live_wnYzNcex8iKfXSUVwn4FoHDiJlX312',
          baseCurrencyCode: 'ltc',
          baseCurrencyAmount: amount,
          externalCustomerId: uniqueId,
          refundWalletAddress: address,
          redirectURL: 'https://api.nexuswallet.com/moonpay/success_sell/',
        },
      },
    });

  useEffect(() => {
    const fetchSignedURL = async () => {
      try {
        const req = await fetch(
          'https://mobile.litecoin.com/api/sell/moonpay/sign',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              unsignedURL: generateUrlForSigning({variant: 'webview'}),
            }),
          },
        );

        if (!req.ok) {
          const error = await req.json();
          throw new Error(error);
        }

        const data = await req.json();
        console.log(data);
        const {urlWithSignature} = data;
        console.log(urlWithSignature);
        updateSignature(urlWithSignature);
      } catch (error) {
        dispatch(showError(String(error)));
      }
    };

    fetchSignedURL();
  }, [dispatch, generateUrlForSigning, updateSignature]);

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
    headerTitle: () => (
      <TranslateText
        textKey={'sell_litecoin'}
        domain={'sellTab'}
        numberOfLines={1}
      />
    ),
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
