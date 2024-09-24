import React from 'react';
import {SafeAreaView} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useDispatch} from 'react-redux';

import {setSeedRecovery} from '../../reducers/onboarding';
import RecoveryField from '../../components/RecoveryField';

const Recover = props => {
  const dispatch = useDispatch();

  const attemptLogin = async seed => {
    await dispatch(setSeedRecovery(seed));
    props.navigation.navigate('Pin');
  };

  return (
    <LinearGradient colors={['#7E58FF', '#3649DF', '#003DB3']}>
      <SafeAreaView>
        <RecoveryField
          handleLogin={seed => attemptLogin(seed)}
          headerText="Enter your paper-key words below."
          isLitewalletRecovery={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

Recover.navigationOptions = {
  headerTitle: 'Login',
  headerTitleStyle: {
    fontWeight: 'bold',
    color: 'white',
  },
};

export default Recover;
