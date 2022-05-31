import React, {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import {useAppDispatch} from '../../store/hooks';
import {detectCurrencyCode} from '../../reducers/settings';

const Initial = props => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(detectCurrencyCode());
  }, [dispatch]);

  return (
    <LinearGradient colors={['#544FE6', '#1c44b4']} style={styles.container}>
      <WhiteButton
        value="Create Wallet"
        small={false}
        onPress={() => props.navigation.navigate('Pin')}
        active={true}
      />
      <WhiteClearButton
        value="Already have a wallet? Log In"
        small={true}
        onPress={() => props.navigation.navigate('Recover')}
      />
    </LinearGradient>
  );
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

Initial.navigationOptions = {
  headerTransparent: true,
  headerBackTitleVisible: false,
  headerShown: false,
};

export default Initial;
