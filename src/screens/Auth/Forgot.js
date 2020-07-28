import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

import Header from '../../components/Header';

const Forgot = () => {
  return (
    <View style={styles.container}>
      <Header />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
});

Forgot.navigationOptions = () => {
  return {
    headerTitle: 'Unlock Wallet',
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
  };
};

export default Forgot;
