import React from 'react';
import {View, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector} from 'react-redux';
import {Pagination} from 'react-native-snap-carousel';

import AuthPad from './Numpad/AuthPad';
import OnboardingHeader from './OnboardingHeader';

const Auth = (props) => {
  const {
    headerDescriptionText,
    handleValidationSuccess,
    handleValidationFailure,
    newPasscode,
    passcodeInitialSet,
  } = props;
  const pin = useSelector((state) => state.authpad.pin);

  return (
    <View style={styles.container}>
      <OnboardingHeader description={headerDescriptionText}>
        <Pagination
          dotStyle={styles.dotStyle}
          inactiveDotColor="#FFFFFF36"
          dotColor="white"
          dotsLength={6}
          activeDotIndex={pin.length - 1}
        />
      </OnboardingHeader>
      <LinearGradient colors={['#544FE6', '#003DB3']} style={styles.gradient}>
        <AuthPad
          handleValidationSuccess={handleValidationSuccess}
          handleValidationFailure={handleValidationFailure}
          newPasscode={newPasscode}
          passcodeInitialSet={passcodeInitialSet}
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
  dotStyle: {
    width: 9,
    height: 9,
    borderRadius: 9 / 2,
    marginHorizontal: 5,
  },
});

export default Auth;
