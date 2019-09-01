import React from 'react';
import {View, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector} from 'react-redux';
import PropTypes from 'prop-types';
import {Pagination} from 'react-native-snap-carousel';

import AuthPad from './Numpad/AuthPad';
import OnboardingHeader from './OnboardingHeader';

const Auth = props => {
  const {headerTitleText, headerDescriptionText} = props;
  const pin = useSelector(state => state.authpad.pin);

  return (
    <View>
      <OnboardingHeader
        title={headerTitleText}
        description={headerDescriptionText}>
        <Pagination dotsLength={6} activeDotIndex={pin.length - 1} />
      </OnboardingHeader>

      <View style={styles.padContainer}>
        <LinearGradient colors={['#544FE6', '#003DB3']} style={styles.gradient}>
          <AuthPad type="auth" currentValue={pin} />
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  padContainer: {
    textAlign: 'center',
    flexGrow: 1,
  },
  gradient: {
    height: '100%',
    paddingTop: 100,
  },
});

Auth.propTypes = {
  headerTitleText: PropTypes.string.isRequired,
  headerDescriptionText: PropTypes.string.isRequired,
};

export default Auth;
