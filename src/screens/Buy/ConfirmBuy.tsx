import React, {useEffect} from 'react';
import {View, Text, SafeAreaView, StyleSheet, Platform} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';

import TableCell from '../../components/Cells/TableCell';
import {getSignedUrl} from '../../reducers/buy';
import {getAddress} from '../../reducers/address';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

type RootStackParamList = {
  ConfirmBuy: undefined;
  WebPage: {
    uri: string;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'ConfirmBuy'>;
}

const ConfirmBuy: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();

  const {quote} = useAppSelector(state => state.buy);
  const {currencySymbol} = useAppSelector(state => state.settings);
  const {
    quoteCurrencyAmount,
    quoteCurrencyPrice,
    feeAmount,
    extraFeeAmount,
    networkFeeAmount,
    totalAmount,
  } = quote;
  const paymentRate = useAppSelector(state => state.ticker.paymentRate);

  const {address} = useAppSelector(state => state.address);
  const {uniqueId} = useAppSelector(state => state.onboarding);

  useEffect(() => {
    dispatch(getAddress());
  }, [dispatch]);

  const onPress = async () => {
    const {urlWithSignature} = await getSignedUrl(
      address,
      parseFloat(
        quoteCurrencyAmount * paymentRate +
          feeAmount +
          extraFeeAmount +
          networkFeeAmount,
      ).toFixed(2),
      uniqueId,
    );
    navigation.navigate('WebPage', {
      uri: urlWithSignature,
    });
  };

  return (
    <View style={{flex: 1, backgroundColor: '#1162E6'}}>
      <SafeAreaView>
        <View style={{paddingTop: 108, paddingLeft: 20}}>
          <Text style={styles.titleText}>You are purchasing</Text>
          <Text style={styles.amountText}>10 LTC</Text>
          <View>
            <Text>{currencySymbol}69.42</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.bottomSheetContainer}>
        <View style={{height: 180, paddingTop: 20}}>
          <TableCell title="AVAILABLE" value="INSTANTLY" />
          <TableCell title="RATE" value="$84/1LTC" />
          <TableCell title="FEE" value="$3.99" />
          <TableCell title="YOU WILL SPEND" value="$155.32" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '40%',
    width: '100%',
  },
  titleText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 24,
  },
  amountText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '400',
    color: 'white',
    fontSize: 48,
  },
  headerLeftMargin: {
    marginLeft: 22,
  },
});

export const ConfirmBuyNavigationOptions = navigation => {
  return {
    headerTitle: '',
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
        title="CHANGE"
      />
    ),
  };
};

export default ConfirmBuy;
