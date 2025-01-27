import React, {useEffect, useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';

import WhiteButton from '../../components/Buttons/WhiteButton';
import {initWallet, startLnd} from '../../reducers/lightning';
import {setSeed} from '../../reducers/onboarding';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {sleep} from '../../lib/utils/poll';
import HeaderButton from '../../components/Buttons/HeaderButton';

import ProgressBar from '../../components/ProgressBar';

import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  Welcome: undefined;
  NewWalletStack: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Welcome'>;
}

const Welcome: React.FC<Props> = props => {
  const {navigation} = props;

  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  const dispatch = useAppDispatch();

  const {task, isOnboarded, downloadProgress, unzipProgress} = useAppSelector(
    state => state.onboarding,
  );
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
      <View style={styles.progressBarContainer}>
        {task === 'downloading' ? (
          <ProgressBar white progress={downloadProgress! * 100} />
        ) : (
          <ProgressBar white progress={unzipProgress! * 100} />
        )}
      </View>
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

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    neutrinoCacheContainer: {
      position: 'absolute',
      bottom: '50%',
      width: '100%',
    },
    text: {
      color: '#fff',
      fontSize: screenHeight * 0.03,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: -0.18,
    },
    progressBarContainer: {
      width: screenWidth,
      paddingVertical: screenHeight * 0.01,
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

export const WelcomeNavigationOptions = (navigation: any) => {
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
