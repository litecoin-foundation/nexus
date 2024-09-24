import React, {useEffect} from 'react';
import {SafeAreaView} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {sweepLitewallet} from '../../lib/utils/sweep';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import {showError} from '../../reducers/errors';

import RecoveryField from '../../components/RecoveryField';

const RecoverLitewallet = props => {

  const dispatch = useAppDispatch();
  const {address} = useAppSelector(state => state.address);

  useEffect(() => {
    dispatch(getAddress());
  }, [dispatch]);

  const handleLWRecovery = async seed => {
    sweepLitewallet(seed, address)
    .then(rawTxs => {
      console.log('successfully created raw txs, time to broadcast!');
      console.log(rawTxs);
    })
    .catch(error => {
      dispatch(showError(String(error)));
    });

    props.navigation.navigate('Settings');
  };

  return (
    <LinearGradient colors={['#7E58FF', '#3649DF', '#003DB3']}>
      <SafeAreaView>
        <RecoveryField
          headerText="Enter your paper-key words below."
          isLitewalletRecovery={true}
          handleLWRecovery={seed => handleLWRecovery(seed)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

RecoverLitewallet.navigationOptions = {
  headerTitle: 'Recover Litewallet Seed',
  headerTitleStyle: {
    fontWeight: 'bold',
    color: 'white',
  },
};

export default RecoverLitewallet;
