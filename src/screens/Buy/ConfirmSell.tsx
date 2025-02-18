import React, {useEffect} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useDispatch} from 'react-redux';
import {RouteProp, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

import HeaderButton from '../../components/Buttons/HeaderButton';
import TranslateText from '../../components/TranslateText';
import Header from '../../components/Header';
import {useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import {getSignedSellUrl} from '../../reducers/buy';

type RootStackParamList = {
  ConfirmSell: {
    queryString?: string;
  };
  WebPage: {
    uri: string;
    observeURL: string;
    returnRoute: string;
  };
};

interface Props {
  route: RouteProp<RootStackParamList, 'ConfirmSell'>;
  navigation: StackNavigationProp<RootStackParamList, 'ConfirmSell'>;
}

const ConfirmSell: React.FC<Props> = props => {
  const {route} = props;
  const dispatch = useDispatch();
  const navigation = useNavigation<Props['navigation']>();

  const {amount} = useAppSelector(state => state.input);
  const {address} = useAppSelector(state => state.address);

  const openSellWidget = async () => {
    try {
      // await is important!
      const url = await dispatch(getSignedSellUrl(address, amount));

      if (typeof url === 'string') {
        navigation.navigate('WebPage', {
          uri: url,
          observeURL: 'https://api.nexuswallet.com/moonpay/success_sell/',
          returnRoute: 'ConfirmSell',
        });
      } else {
        console.log(url);
        Alert.alert("Something's wrong!", `${url}`);
      }
    } catch (error) {
      Alert.alert("Something's wrong!", `err: ${error}`);
    }
  };

  useEffect(() => {
    dispatch(getAddress(false));
    openSellWidget();
  }, [dispatch]);

  // handle successful sale!
  useEffect(() => {
    if (route.params) {
      console.log(route.params.queryString);
      // ?transactionId={{id}}
      // &baseCurrencyCode={{code}}
      // &baseCurrencyAmount={{amount}}
      // &depositWalletAddress={{address}}
      // &depositWalletAddressTag={{tag}}
    }
  });

  return (
    <View style={styles.container}>
      <Header />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
});

export const ConfirmSellNavigationOptions = navigation => {
  return {
    headerTitle: () => (
      <TranslateText
        textKey={'sell_litecoin'}
        domain={'sellTab'}
        numberOfLines={1}
        textStyle={styles.headerTitle}
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
