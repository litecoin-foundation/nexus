import React from 'react';
import {StyleSheet} from 'react-native';
import {useNavigation} from 'react-navigation-hooks';
import LinearGradient from 'react-native-linear-gradient';

import WhiteButton from '../../components/WhiteButton';
import WhiteClearButton from '../../components/WhiteClearButton';

const Initial = () => {
  const {navigate} = useNavigation();

  return (
    <LinearGradient colors={['#544FE6', '#1c44b4']} style={styles.container}>
      <WhiteButton
        value="Create Wallet"
        small={false}
        onPress={() => navigate('Pin')}
      />
      <WhiteClearButton
        value="Already have a wallet? Log In"
        small={true}
        onPress={() => navigate('Recover')}
      />
    </LinearGradient>
  );
};

Initial.navigationOptions = {
  headerTransparent: true,
  headerBackTitle: null,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    paddingBottom: 50,
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
