import React, {useEffect} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Platform,
  Button,
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
    try {
      const url = await getSignedUrl(address, 69, uniqueId);
      if (typeof url === 'string') {
        navigation.navigate('WebPage', {uri: url});
      } else {
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
          <View>
            <Text>
              {currencySymbol}
              {quoteCurrencyPrice.toFixed(2)}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.bottomSheetContainer}>
        <View style={{height: 220, paddingTop: 26}}>
          <TableCell title="RATE" value="$84/1LTC" />
          <TableCell title="FEE" value={feeAmount + extraFeeAmount} />
          <TableCell title="NETWORK FEE" value={networkFeeAmount} />
          <TableCell title="YOU WILL SPEND" value={totalAmount} />
        </View>

        <View style={styles.confirmButtonContainer}>
          <GreenButton value="Confirm Purchase" onPress={() => onPress()} />
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
  confirmButtonContainer: {
    marginHorizontal: 24,
    bottom: 44,
    position: 'absolute',
    width: Dimensions.get('screen').width - 48,
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
