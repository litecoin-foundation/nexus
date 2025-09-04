import React, {useEffect, useContext, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {
  StackNavigationOptions,
  StackNavigationProp,
} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';

import Card from '../../components/Card';
import WhiteButton from '../../components/Buttons/WhiteButton';
import HeaderButton from '../../components/Buttons/HeaderButton';
import WarningModalContent from '../../components/Modals/WarningModalContent';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setTorEnabled} from '../../reducers/settings';
import {checkTorStatus} from '../../utils/tor';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  Tor: undefined;
  Settings: {
    updateHeader?: boolean;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Tor'>;
  route: RouteProp<RootStackParamList, 'Tor'>;
}

const Tor: React.FC<Props> = props => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();
  const {t} = useTranslation('settingsTab');
  const torEnabled = useAppSelector(state => state.settings!.torEnabled);

  const [torStatus, setTorStatus] = useState('');
  const [torSwitchInProcess, setTorSwitchInProcess] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);

  // 1s timer
  const [tick, setTick] = useState(Math.floor(Date.now() / 1000));
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const setStatus = async () => {
      try {
        const statusNumber = await checkTorStatus();
        if (abortController.signal.aborted) {
          return;
        }
        switch (statusNumber) {
          case -1:
            setTorStatus('tor_error');
            return;
          case 0:
            setTorStatus('tor_starting');
            return;
          case 1:
            setTorStatus('tor_running');
            return;
          case 2:
            setTorStatus('tor_stopped');
            return;
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Tor status check failed:', error);
        }
      }
    };

    if (!torSwitchInProcess) {
      setStatus();
    }

    return () => {
      abortController.abort();
    };
  }, [tick, torSwitchInProcess]);

  const handleTorSwitch = async () => {
    setTorSwitchInProcess(true);
    if (torEnabled) {
      setTorStatus('tor_stopping');
    } else {
      setTorStatus('tor_starting');
    }
    const processed = await dispatch(setTorEnabled(!torEnabled));
    if (processed) {
      setTorSwitchInProcess(false);
      setShowRestartModal(true);
    }
  };

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.container}>
      <View style={styles.cardContainer}>
        <Card
          titleText={t('enable_tor')}
          descTextKey="enable_tor_note"
          descTextDomain="settingsTab"
          imageSource={require('../../assets/icons/disguise-icon.png')}
        />
      </View>

      <View style={styles.buttonContainer}>
        <CustomSafeAreaView styles={styles.safeArea} edges={['bottom']}>
          <TranslateText
            textValue={
              t('tor_status_enabled') +
              ' ' +
              torEnabled +
              '          ' +
              t('tor_status') +
              ' ' +
              t(torStatus)
            }
            maxSizeInPixels={SCREEN_HEIGHT * 0.022}
            textStyle={styles.statusTitle}
            numberOfLines={1}
          />
          <WhiteButton
            textKey={torEnabled ? 'turn_tor_off' : 'turn_tor_on'}
            textDomain="settingsTab"
            customFontStyles={styles.buttonCustomStyle}
            small={false}
            active={true}
            onPress={handleTorSwitch}
            disabled={torSwitchInProcess}
          />
        </CustomSafeAreaView>
      </View>

      <WarningModalContent
        isVisible={showRestartModal}
        close={() => setShowRestartModal(false)}
        textDomain="settingsTab"
        textKey="restart_required_message"
      />
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.026,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    cardContainer: {
      flex: 1,
      justifyContent: 'center',
      marginTop: screenHeight * 0.05 * -1,
    },
    buttonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.01,
      width: '100%',
      paddingHorizontal: screenWidth * 0.06,
    },
    buttonCustomStyle: {
      textAlign: 'center',
    },
    safeArea: {
      width: '100%',
    },
    statusTitle: {
      textAlign: 'center',
      color: '#fff',
      fontSize: screenHeight * 0.017,
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '600',
      paddingBottom: screenHeight * 0.015,
    },
  });

export const TorNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <TranslateText
        textKey="enable_tor"
        domain="settingsTab"
        maxSizeInPixels={SCREEN_HEIGHT * 0.022}
        textStyle={styles.headerTitle}
        numberOfLines={1}
      />
    ),
    headerTitleAlign: 'left',
    headerTitleContainerStyle: {
      left: 7,
    },
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.popTo('Settings', {updateHeader: true})}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default Tor;
