import React, {useEffect} from 'react';
import {StyleSheet, View, SafeAreaView, Text, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import Card from '../../components/Card';
import WhiteButton from '../../components/Buttons/WhiteButton';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {sweepQrKey} from '../../lib/utils/sweep';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import {showError} from '../../reducers/errors';
import HeaderButton from '../../components/Buttons/HeaderButton';

type RootStackParamList = {
  Import: {
    scanData?: string;
  };
  Scan: {returnRoute: string};
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Import'>;
  route: RouteProp<RootStackParamList, 'Import'>;
}

const Import: React.FC<Props> = props => {
  const {navigation, route} = props;
  const dispatch = useAppDispatch();
  const {address} = useAppSelector(state => state.address);

  useEffect(() => {
    dispatch(getAddress());
  }, [dispatch]);

  // handle scanned QR code
  useEffect(() => {
    if (route.params?.scanData) {
      console.log(route.params?.scanData);
      sweepQrKey(route.params.scanData, address)
        .then(rawTxs => {
          console.log('successfully created raw txs, time to broadcast!');
          console.log(rawTxs);
        })
        .catch(error => {
          dispatch(showError(String(error)));
        });
    }
  }, [address, route.params?.scanData, dispatch]);

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.container}>
      <SafeAreaView />

      <Card
        titleText="Import Private Key"
        descriptionText={
          'Importing a Litecoin private key moves any Litecoin in that wallet into Plasma.\n\nYou will no longer be able to access Litecoin using the private key.'
        }
        imageSource={require('../../assets/images/qr-frame.png')}
      />

      <View>
        <WhiteButton
          value="Scan Private Key"
          small={false}
          active={true}
          onPress={() => {
            navigation.navigate('Scan', {returnRoute: 'Import'});
          }}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  headerTitle: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
});

export const ImportNavigationOptions = navigation => {
  return {
    headerTitle: () => (
      <Text style={styles.headerTitle}>Import Private Key</Text>
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

export default Import;
