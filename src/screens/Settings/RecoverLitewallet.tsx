import React, {useEffect} from 'react';
import {StyleSheet, SafeAreaView, Text, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {StackNavigationProp} from '@react-navigation/stack';
import {sweepLitewallet} from '../../lib/utils/sweep';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import {showError} from '../../reducers/errors';
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
  const {address} = useAppSelector(state => state.address);

  useEffect(() => {
    dispatch(getAddress());
  }, [dispatch]);

  const handleLWRecovery = async (seed: string[]) => {
    sweepLitewallet(seed, address)
      .then(rawTxs => {
        rawTxs.map((rawTx, index) => {
          // console.log(rawTx);
          publishTransaction(rawTx).then(() => {
            // handle successful publish!
            if (index === rawTxs.length - 1) {
              navigation.replace('ImportSuccess', {
                txHash: txHashFromRaw(rawTx),
              });
            }
          });
        });
      })
      .catch(error => {
        dispatch(showError(String(error)));
      });
  };

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']}>
      <SafeAreaView>
        <RecoveryField
          handleLogin={() => {}}
          headerText="Litewallet users can import their coins into Plasma Wallet. Entering your paper key below will permanently move your coins from Litewallet into Plasma."
          isLitewalletRecovery={true}
          handleLWRecovery={seed => handleLWRecovery(seed)}
        />
      </SafeAreaView>
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
