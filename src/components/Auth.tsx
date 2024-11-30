import React from 'react';
import {StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import AuthPad from './Numpad/AuthPad';

interface Props {
  handleValidationSuccess: () => Promise<void>;
  handleValidationFailure: () => void;
}

const Auth: React.FC<Props> = props => {
  const {handleValidationSuccess, handleValidationFailure} = props;

  return (
    <>
      <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
        <AuthPad
          handleValidationSuccess={handleValidationSuccess}
          handleValidationFailure={handleValidationFailure}
        />
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
