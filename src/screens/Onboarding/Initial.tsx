import React, {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';

import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import {useAppDispatch} from '../../store/hooks';
import {detectCurrencyCode, setExplorer} from '../../reducers/settings';
import {startLnd} from '../../reducers/lightning';
import {subscribeAppState} from '../../reducers/authentication';

type RootStackParamList = {
  Initial: undefined;
  Pin: undefined;
  Recover: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Initial'>;
}

const Initial = (props: Props) => {
  const dispatch = useAppDispatch();
  const {navigation} = props;

  useEffect(() => {
    dispatch(detectCurrencyCode());
    dispatch(setExplorer('Litecoin Space'));
  }, [dispatch]);

  return (
    <LinearGradient colors={['#544FE6', '#1c44b4']} style={styles.container}>
      <WhiteButton
        value="Create Wallet"
        small={false}
        onPress={() => {
          dispatch(startLnd());
          dispatch(subscribeAppState());
          navigation.navigate('Pin');
        }}
        active={true}
      />
      <WhiteClearButton
        value="Already have a wallet? Log In"
        small={true}
        onPress={() => {
          dispatch(startLnd());
          dispatch(subscribeAppState());
          navigation.navigate('Recover');
        }}
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
  neutrinoCacheContainer: {
    height: 100,
    marginBottom: 70,
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  normalText: {
    fontWeight: 'normal',
  },
});

Initial.navigationOptions = {
  headerTransparent: true,
  headerBackTitleVisible: false,
  headerShown: false,
};

export default Initial;
