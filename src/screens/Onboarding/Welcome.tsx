import React from 'react';
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

  const {task, downloadProgress, unzipProgress} = useAppSelector(
    state => state.onboarding,
  );

  // TODO (LOSHY!)
  const handlePress = () => {
    dispatch(setSeed());
    dispatch(startLnd());
    sleep(4000).then(() => {
      dispatch(initWallet());
      navigation.reset({
        index: 0,
        routes: [{name: 'NewWalletStack'}],
      });
    });
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
