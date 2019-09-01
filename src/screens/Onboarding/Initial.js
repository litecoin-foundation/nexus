import React from 'react';
import {StyleSheet, View, Button} from 'react-native';
import {useNavigation} from 'react-navigation-hooks';

const Initial = () => {
  const {navigate} = useNavigation();

  return (
    <View style={styles.container}>
      <Button onPress={() => navigate('Pin')} title="Create Wallet" />
      <Button
        onPress={() => navigate('Recover')}
        title="Already have a wallet? Log In"
      />
    </View>
  );
};

Initial.navigationOptions = {
  headerTransparent: true,
  headerBackTitle: null,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

export default Initial;
