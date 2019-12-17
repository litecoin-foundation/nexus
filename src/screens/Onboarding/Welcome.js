import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useDispatch} from 'react-redux';
import {useNavigation} from 'react-navigation-hooks';

import BlueButton from '../../components/Buttons/BlueButton';
import {initWallet} from '../../reducers/lightning';

const Welcome = () => {
  const dispatch = useDispatch();
  const {navigate} = useNavigation();

  const handlePress = () => {
    dispatch(initWallet());
    navigate('App');
  };

  return (
    <View style={styles.container}>
      <BlueButton value="Welcome" onPress={handlePress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
});

export default Welcome;
