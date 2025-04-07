import React, {useEffect, useContext, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';

import ProgressBar from '../../components/ProgressBar';
import LoadingIndicator from '../../components/LoadingIndicator';
import TranslateText from '../../components/TranslateText';
import {initWallet, startLnd} from '../../reducers/lightning';
import {setSeed} from '../../reducers/onboarding';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {sleep} from '../../lib/utils/poll';

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

  const [loading, setLoading] = useState(false);
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
      setLoading(false);
      navigation.reset({
        index: 0,
        routes: [{name: 'NewWalletStack'}],
      });
    }
  }, [isOnboarded, navigation]);

  // startup wallet after presyncing is over!
  useEffect(() => {
    if (task === 'complete' || task === 'failed') {
      setLoading(true);
      dispatch(setSeed());
      dispatch(startLnd());
    }
  }, [dispatch, task]);

  const cacheProgress = (
    <View style={styles.neutrinoCacheContainer}>
      <View style={styles.titleContainer}>
        <TranslateText
          textKey="presync"
          domain="onboarding"
          textStyle={styles.titleText}
        />

        <TranslateText
          textKey="presync_description"
          domain="onboarding"
          textStyle={styles.descriptionText}
        />
      </View>

      <View style={styles.progressBarContainer}>
        {task === 'downloading' ? (
          <ProgressBar progress={downloadProgress! * 100} />
        ) : (
          <ProgressBar progress={unzipProgress! * 100} />
        )}
      </View>
      <Text style={styles.descriptionText}>{task}</Text>
    </View>
  );

  return (
    <>
      <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.container}>
        {task !== 'complete' ? cacheProgress : null}
      </LinearGradient>

      <LoadingIndicator visible={loading} />
    </>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
    },
    neutrinoCacheContainer: {
      alignSelf: 'center',
      height: screenHeight * 0.225,
      width: screenWidth - 60,
      borderRadius: screenHeight * 0.02,
      backgroundColor: 'white',
      shadowColor: 'rgb(82,84,103);',
      shadowOpacity: 0.12,
      shadowRadius: screenHeight * 0.015,
      elevation: screenHeight * 0.015,
      shadowOffset: {
        height: 0,
        width: 0,
      },
      alignItems: 'center',
    },
    progressBarContainer: {
      width: (screenWidth - 60) * 0.8,
      minWidth: (screenWidth - 60) * 0.8,
      paddingHorizontal: screenHeight * 0.01,
      paddingVertical: screenHeight * 0.015,
    },
    titleContainer: {
      paddingLeft: screenHeight * 0.025,
      paddingRight: screenHeight * 0.025,
      paddingTop: screenHeight * 0.025,
    },
    titleText: {
      textAlign: 'center',
      color: '#2C72FF',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.03,
      fontWeight: 'bold',
      paddingBottom: screenHeight * 0.025,
    },
    descriptionText: {
      textAlign: 'center',
      color: '#4A4A4A',
      fontSize: screenHeight * 0.017,
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export const WelcomeNavigationOptions = () => {
  return {
    headerTitle: () => null,
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => null,
    gestureEnabled: false,
  };
};

export default Welcome;
