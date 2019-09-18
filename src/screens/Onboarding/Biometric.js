import React from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';
import {useNavigation} from 'react-navigation-hooks';
import {useDispatch, useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import WhiteButton from '../../components/WhiteButton';
import WhiteClearButton from '../../components/WhiteClearButton';
import {authenticate} from '../../lib/utils/biometric';

import {setBiometricEnabled} from '../../reducers/authentication';

const Biometric = () => {
  const dispatch = useDispatch();
  const {navigate} = useNavigation();
  const faceIDSupported = useSelector(
    state => state.authentication.faceIDSupported,
  );
  const biometryType = faceIDSupported ? 'Face ID' : 'Touch ID';

  return (
    <LinearGradient colors={['#544FE6', '#1c44b4']} style={styles.container}>
      <SafeAreaView />
      <View style={styles.cardContainer}>
        <Text>{biometryType}</Text>
      </View>

      <WhiteButton
        value={`Enable ${biometryType}`}
        small={false}
        onPress={async () => {
          try {
            await authenticate(`Enable ${biometryType}`);
            dispatch(setBiometricEnabled(true));
            navigate('Welcome');
          } catch (error) {
            console.log(error);
            return;
          }
        }}
      />
      <WhiteClearButton
        value="Maybe later"
        small={true}
        onPress={() => {
          dispatch(setBiometricEnabled(false));
          navigate('Welcome');
        }}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  cardContainer: {
    height: 450,
    width: 335,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: 'rgb(82,84,103);',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
});

Biometric.navigationOptions = {
  headerTransparent: true,
  headerBackTitle: null,
};

export default Biometric;
