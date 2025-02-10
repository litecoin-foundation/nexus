import React, {useEffect} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';

import TableCell from '../../components/Cells/TableCell';
import {getSignedUrl} from '../../reducers/buy';
import {getAddress} from '../../reducers/address';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import GreenButton from '../../components/Buttons/GreenButton';

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
    totalAmount,
    baseCurrencyAmount,
    networkFeeAmount,
    feeAmount,
  } = quote;

  const address = useAppSelector(state => state.address.address);

  useEffect(() => {
    dispatch(getAddress());
  }, [dispatch]);

  const onPress = async () => {
    try {
      // await is important!
      const url = await dispatch(getSignedUrl(address, baseCurrencyAmount));

      if (typeof url === 'string') {
        navigation.navigate('WebPage', {uri: url});
      } else {
        console.log(url);
        Alert.alert("Something's wrong!", `${url}`);
      }
    } catch (error) {
      Alert.alert("Something's wrong!", `err: ${error}`);
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: '#1162E6'}}>
      <SafeAreaView>
        <View style={{paddingTop: 108, paddingLeft: 20}}>
          <Text style={styles.titleText}>You are purchasing</Text>
          <Text style={styles.amountText}>{quoteCurrencyAmount} LTC</Text>
          <View style={styles.fiatAmount}>
            <Text style={styles.fiatAmountText}>
              {currencySymbol}
              {totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.bottomSheetContainer}>
        <View style={styles.bottomSheetSubContainer}>
          <TableCell
            title="RATE"
            value={`${currencySymbol}${quoteCurrencyPrice.toFixed(
              2,
            )} per 1 LTC`}
            noBorder
          />
          <TableCell title="FEE" value={feeAmount} />
          <TableCell title="NETWORK FEE" value={networkFeeAmount} />
          <TableCell
            title="YOU WILL SPEND"
            value={`${currencySymbol}${totalAmount.toFixed(2)}`}
            valueStyle={{color: '#20BB74'}}
          />
        </View>

        <View style={{height: 30}} />

        <View style={styles.confirmButtonContainer}>
          <GreenButton value="Continue Purchase" onPress={onPress} />
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
    width: '100%',
  },
  bottomSheetSubContainer: {
    height: 330,
    paddingTop: 26,
  },
  titleText: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 24,
  },
  amountText: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '400',
    color: 'white',
    fontSize: 48,
  },
  headerLeftMargin: {
    marginLeft: 22,
  },
  confirmButtonContainer: {
    marginHorizontal: 24,
    bottom: 44,
    position: 'absolute',
    width: Dimensions.get('screen').width - 48,
  },
  fiatAmount: {
    borderRadius: Dimensions.get('screen').height * 0.01,
    backgroundColor: '#0F4CAD',
    paddingTop: Dimensions.get('screen').height * 0.01,
    paddingBottom: Dimensions.get('screen').height * 0.01,
    paddingLeft: Dimensions.get('screen').height * 0.015,
    paddingRight: Dimensions.get('screen').height * 0.015,
    height: 42,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  fiatAmountText: {
    color: '#fff',
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: Dimensions.get('screen').height * 0.02,
    opacity: 0.4,
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
