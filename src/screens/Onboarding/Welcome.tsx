import React, {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';

import WhiteButton from '../../components/Buttons/WhiteButton';
import {initWallet, startLnd} from '../../reducers/lightning';
import {setSeed} from '../../reducers/onboarding';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {sleep} from '../../lib/utils/poll';
import HeaderButton from '../../components/Buttons/HeaderButton';

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

  const {task, isOnboarded} = useAppSelector(state => state.onboarding);
  const {lndActive} = useAppSelector(state => state.lightning);

  // calls initWallet() when LND has started!
  useEffect(() => {
    if (lndActive === true) {
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
      <Text style={styles.text}>Presyncing: {task}</Text>
    </View>
  );

  return (
    <>
      <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.container}>
        {task !== 'complete' ? cacheProgress : null}

        <View style={styles.buttonContainer}>
          <WhiteButton
            value="Tap Anywhere to Start"
            small={false}
            onPress={() => handlePress()}
            active={true}
            disabled={task === 'complete' ? false : true}
          />
        </View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  neutrinoCacheContainer: {
    position: 'absolute',
    bottom: 200,
    width: '100%',
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
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 15,
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
});

export const WelcomeNavigationOptions = navigation => {
  return {
    headerTitle: () => null,
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
        title="Back"
      />
    ),
  };
};

export default Welcome;
