import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';

import * as FileSystem from 'expo-file-system';

import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import {useAppDispatch} from '../../store/hooks';
import {detectCurrencyCode, setExplorer} from '../../reducers/settings';
import {genSeed, getNeutrinoCache} from '../../reducers/onboarding';

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

  console.log(FileSystem.documentDirectory);

  useEffect(() => {
    dispatch(detectCurrencyCode());
    dispatch(setExplorer('Litecoin Space'));
  }, [dispatch]);

  // fetch neutrino cache!
  useEffect(() => {
    dispatch(getNeutrinoCache());
  }, [dispatch]);

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.container}>
      <View style={styles.subcontainer}>
        <WhiteButton
          value="Create Wallet"
          small={false}
          onPress={() => {
            dispatch(genSeed());
            navigation.navigate('Pin');
          }}
          active={true}
        />
        <WhiteClearButton
          value="Already have a wallet? Log In"
          small={true}
          onPress={() => {
            navigation.navigate('Recover');
          }}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  subcontainer: {
    paddingBottom: 50,
  },
});

Initial.navigationOptions = {
  headerTransparent: true,
  headerBackTitleVisible: false,
  headerShown: false,
};

export default Initial;
