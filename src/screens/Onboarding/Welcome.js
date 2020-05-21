import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useDispatch} from 'react-redux';

import BlueButton from '../../components/Buttons/BlueButton';
import {initWallet} from '../../reducers/lightning';

const Welcome = (props) => {
  const dispatch = useDispatch();

  const handlePress = () => {
    dispatch(initWallet());
    props.navigation.navigate('AppStack');
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
