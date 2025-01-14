import React, {useEffect} from 'react';
import {StyleSheet, SafeAreaView, Text, Platform, Alert} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {sweepLitewallet} from '../../lib/utils/sweep';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {publishTransaction} from '../../reducers/transaction';
import {txHashFromRaw} from '../../lib/utils/txHashFromRaw';
import RecoveryField from '../../components/RecoveryField';

type RootStackParamList = {
  Import: {
    scanData?: string;
  };
  ImportSuccess: {
    txHash: string;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Import'>;
  navigationOptions: any;
}

const RecoverLitewallet: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const {address} = useAppSelector(state => state.address);

  useEffect(() => {
    dispatch(getAddress());
  }, [dispatch]);

  const handleLWRecovery = async (seed: string[]) => {
    sweepLitewallet(seed, address)
      .then(rawTxs => {
        rawTxs.map((rawTx, index) => {
          if (rawTx.length === 0) {
            // no utxo to sweep
          } else {
            publishTransaction(rawTx[0])
              .then(() => {
                // handle successful publish!
                if (index === rawTxs.length - 1) {
                  navigation.replace('ImportSuccess', {
                    txHash: txHashFromRaw(rawTx[0]),
                  });
                }
              })
              .catch(error => Alert.alert(String(error.message)));
          }
        });
      })
      .catch(error => {
        Alert.alert(String(error.message));
      });
  };

  return (
    <LinearGradient
      colors={['#1162E6', '#0F55C7']}
      style={Platform.OS === 'android' ? {paddingTop: insets.top} : null}>
      <SafeAreaView>
        <RecoveryField
          handleLogin={() => {}}
          headerText="Litewallet users can import their coins into Nexus Wallet. Entering your paper key below will permanently move your coins from Litewallet into Nexus."
          isLitewalletRecovery={true}
          handleLWRecovery={seed => handleLWRecovery(seed)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
});

export const RecoverLitewalletNavigationOptions = navigation => {
  return {
    headerTitle: () => (
      <Text style={styles.headerTitle}>Import Litewallet Paper Key</Text>
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

export default RecoverLitewallet;
