import React, {useEffect} from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';

import WhiteButton from '../../components/Buttons/WhiteButton';
import {initWallet, startLnd} from '../../reducers/lightning';
import {setSeed} from '../../reducers/onboarding';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import ProgressBar from '../../components/ProgressBar';
import {sleep} from '../../lib/utils/poll';

type RootStackParamList = {
  Welcome: undefined;
  NewWalletStack: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Welcome'>;
}

const Welcome: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();

  const {task, downloadProgress, unzipProgress, isOnboarded} = useAppSelector(
    state => state.onboarding,
  );
  const {lndActive} = useAppSelector(state => state.lightning);

  // calls initWallet() when LND has started!
  useEffect(() => {
    console.log(`MPOOPY: lndActive is ${lndActive ? 'true' : 'false'}`);
    if (lndActive === true) {
      console.log('LOSHY: INIT WALLET! BELOW');
      // TODO
      // ATM we sleep for 1500ms to make sure LND returns valid subscribeState
      // values. This should hopefully be fixed in the future.
      sleep(1500).then(() => {
        dispatch(initWallet());
      });
    }
  }, [dispatch, lndActive]);

  // when finishOnboarding() is called isOnboarded is true
  // we know to navigate user to the wallet
  useEffect(() => {
    if (isOnboarded === true) {
      navigation.reset({
        index: 0,
        routes: [{name: 'NewWalletStack'}],
      });
    }
  }, [isOnboarded, navigation]);

  const handlePress = () => {
    dispatch(setSeed());
    dispatch(startLnd());
  };

  const cacheProgress = (
    <View style={styles.neutrinoCacheContainer}>
      <>
        <Text style={styles.text}>
          Your wallet is currently {task} Presyncing. {downloadProgress}{' '}
          {unzipProgress}
        </Text>
        <Text>{downloadProgress}</Text>
        <ProgressBar
          progress={
            task === 'downloading'
              ? Number(downloadProgress)
              : Number(unzipProgress)
          }
        />
      </>
    </View>
  );

  return (
    <>
      <LinearGradient colors={['#544FE6', '#1c44b4']} style={styles.container}>
        <SafeAreaView style={{flex: 1}}>
          <Text style={styles.text}>Welcome!</Text>

          {cacheProgress}

          <View style={styles.buttonContainer}>
            <WhiteButton
              value="Tap Anywhere to Start"
              small={false}
              onPress={() => handlePress()}
              active={true}
              disabled={task === 'complete' ? false : true}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  neutrinoCacheContainer: {
    // height: 300,
    // marginBottom: 70,
    // justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.18,
    lineHeight: 34,
    paddingBottom: 556,
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
  },
});

Welcome.navigationOptions = {
  headerTitle: null,
};

export default Welcome;
