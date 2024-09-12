import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';

import WhiteButton from '../../components/Buttons/WhiteButton';
import {initWallet} from '../../reducers/lightning';
import {setSeed} from '../../reducers/onboarding';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import ProgressBar from '../../components/ProgressBar';

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

  const {task, downloadProgress, unzipProgress, seed} = useAppSelector(
    state => state.onboarding,
  );

  const handlePress = () => {
    dispatch(setSeed());
    dispatch(initWallet());

    navigation.reset({
      index: 0,
      routes: [{name: 'NewWalletStack'}],
    });
  };

  const cacheProgress = (
    <View style={styles.neutrinoCacheContainer}>
      <Text style={styles.text}>Your wallet is currently Presyncing.</Text>
      <Text style={styles.text}>{task}</Text>
      <ProgressBar
        progress={
          task === 'downloading'
            ? Number(downloadProgress)
            : Number(unzipProgress)
        }
      />
    </View>
  );

  return (
    <LinearGradient colors={['#544FE6', '#1c44b4']} style={styles.container}>
      {/* <Text style={styles.text}>Welcome!</Text> */}
      <Text style={styles.text}>{seed}</Text>
      {/* {task !== 'complete' ? cacheProgress : null} */}
      {/* {cacheProgress} */}

      <WhiteButton
        value="Tap Anywhere to Start"
        small={false}
        onPress={() => handlePress()}
        active={true}
        // disabled={task === 'complete' ? false : true}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
  },
  neutrinoCacheContainer: {
    height: 100,
    marginBottom: 70,
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.18,
    lineHeight: 34,
    paddingBottom: 556,
    textShadowColor: 'rgba(0, 0, 0, 0.11)',
    textShadowOffset: {width: 0, height: 3},
    textShadowRadius: 2,
  },
});

Welcome.navigationOptions = {
  headerTitle: null,
};

export default Welcome;
