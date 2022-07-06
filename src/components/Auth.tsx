import React from 'react';
import {StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {useAppSelector} from '../store/hooks';
import Dots from './Dots';
import AuthPad from './Numpad/AuthPad';
import OnboardingHeader from './OnboardingHeader';

interface Props {
  headerDescriptionText: string;
  handleValidationSuccess: void;
  handleValidationFailure: void;
}

const Auth: React.FC<Props> = props => {
  const {
    headerDescriptionText,
    handleValidationSuccess,
    handleValidationFailure,
  } = props;
  const pin = useAppSelector(state => state.authpad.pin);

  return (
    <View style={styles.container}>
      <OnboardingHeader description={headerDescriptionText}>
        <Dots dotsLength={6} activeDotIndex={pin.length - 1} />
      </OnboardingHeader>
      <LinearGradient colors={['#544FE6', '#003DB3']} style={styles.gradient}>
        <AuthPad
          handleValidationSuccess={handleValidationSuccess}
          handleValidationFailure={handleValidationFailure}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerDescriptionText: {
    color: '#FFFFFF',
    fontSize: 15,
    paddingBottom: 40,
  },
  gradient: {
    flexGrow: 1,
  },
});

export default Auth;
