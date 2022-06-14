import React, {useEffect} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {detectCurrencyCode} from '../../reducers/settings';
import {getNeutrinoCache} from '../../reducers/onboarding';
import ProgressBar from '../../components/ProgressBar';
import {startLnd} from '../../reducers/lightning';
import {subscribeAppState} from '../../reducers/authentication';

const Initial = props => {
  const dispatch = useAppDispatch();

  const {task, downloadProgress, unzipProgress} = useAppSelector(
    state => state.onboarding,
  );

  useEffect(() => {
    dispatch(detectCurrencyCode());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getNeutrinoCache());
  });

  const cacheProgress = (
    <View style={styles.neutrinoCacheContainer}>
      <Text>Presyncing...</Text>
      <Text>Status: {task}</Text>
      <ProgressBar
        progress={task === 'downloading' ? downloadProgress : unzipProgress}
      />
    </View>
  );

  return (
    <LinearGradient colors={['#544FE6', '#1c44b4']} style={styles.container}>
      {task !== 'complete' ? cacheProgress : null}

      <WhiteButton
        value="Create Wallet"
        small={false}
        onPress={() => {
          dispatch(startLnd());
          dispatch(subscribeAppState());
          props.navigation.navigate('Pin');
        }}
        active={true}
        disabled={task === 'complete' ? false : true}
      />
      <WhiteClearButton
        value="Already have a wallet? Log In"
        small={true}
        onPress={() => {
          dispatch(startLnd());
          dispatch(subscribeAppState());
          props.navigation.navigate('Recover');
        }}
        disabled={task === 'complete' ? false : true}
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
    height: 300,
    width: 300,
    marginBottom: 100,
    borderRadius: 15,
    backgroundColor: 'rgb(238,244,249)',
  },
});

Initial.navigationOptions = {
  headerTransparent: true,
  headerBackTitleVisible: false,
  headerShown: false,
};

export default Initial;
