import React, {useState} from 'react';
import {
  StyleSheet,
  ScrollView,
  DeviceEventEmitter,
  Alert,
  View,
  Text,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SegmentedControl from '@react-native-segmented-control/segmented-control';

import Header from '../../components/Header';
import SettingCell from '../../components/Cells/SettingCell';
import {resetPincode, setBiometricEnabled} from '../../reducers/authentication';
import PinModal from '../../components/Modals/PinModal';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {StackNavigationProp} from '@react-navigation/stack';
import {startLnd, stopLnd} from '../../reducers/lightning';
import {poll, sleep} from '../../lib/utils/poll';
import {purgeStore} from '../../store';
import {deleteLNDDir} from '../../lib/utils/file';
import {updateSubunit} from '../../reducers/settings';
import HeaderButton from '../../components/Buttons/HeaderButton';

type RootStackParamList = {
  General: undefined;
  About: undefined;
  ChangePincode: {
    type: null;
  };
  Wallet: undefined;
  Explorer: undefined;
  Currency: undefined;
  Seed: undefined;
  Import: undefined;
  RecoverLitewallet: undefined;
  Loading: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'General'>;
}

const Settings: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();
  const [isPinModalTriggered, triggerPinModal] = useState(false);

  const biometricsAvailable = useAppSelector(
    state => state.authentication.biometricsAvailable,
  );
  const biometricsEnabled = useAppSelector(
    state => state.authentication.biometricsEnabled,
  );
  const faceIDSupported = useAppSelector(
    state => state.authentication.faceIDSupported,
  );
  const {subunit} = useAppSelector(state => state.settings);

  const handleBiometricSwitch = () => {
    dispatch(setBiometricEnabled(!biometricsEnabled));
  };

  const handleAuthenticationRequired = () => {
    return new Promise<void>((resolve, reject) => {
      triggerPinModal(true);
      const subscription = DeviceEventEmitter.addListener('auth', bool => {
        if (bool === true) {
          triggerPinModal(false);
          subscription.remove();
          resolve();
        } else if (bool === false) {
          subscription.remove();
          reject();
        }
      });
    });
  };

  // TODO: prompt and confirm if reset is wanted
  const handleReset = async () => {
    dispatch(resetPincode());
    purgeStore();
    await deleteLNDDir();
    await sleep(4000);
    navigation.reset({
      index: 0,
      routes: [{name: 'Loading'}],
    });
  };

  return (
    <>
      <LinearGradient
        style={styles.container}
        colors={['#F2F8FD', '#d2e1ef00']}>
        <Header />
        <ScrollView>
          <SettingCell
            title="About"
            onPress={() => navigation.navigate('About')}
            forward
          />
          <SettingCell
            title="Change Wallet Pin"
            onPress={() => navigation.navigate('ChangePincode', {type: null})}
            forward
          />
          {biometricsAvailable ? (
            <SettingCell
              title={`Enable ${faceIDSupported ? 'Face ID' : 'Touch ID'}`}
              switchEnabled
              switchValue={biometricsEnabled}
              handleSwitch={handleBiometricSwitch}
            />
          ) : null}

          <SettingCell
            title="Rescan for missing coins?"
            onPress={() => {
              dispatch(stopLnd());
              sleep(10000).then(() => {
                console.warn('LOSHY: looking to start lnd');
                poll(dispatch(startLnd()), 1000, 1000);
              });
            }}
            forward
          />

          <SettingCell
            title="Import Private Key"
            onPress={() => navigation.navigate('Import')}
            forward
          />
          <SettingCell
            title="Import Litewallet"
            onPress={() => navigation.navigate('RecoverLitewallet')}
            forward
          />
          <SettingCell
            title="Block Explorer"
            onPress={() => navigation.navigate('Explorer')}
            forward
          />
          <SettingCell
            title="Change Currency"
            onPress={() => navigation.navigate('Currency')}
            forward
          />

          <SettingCell
            title="View Seed Phrase"
            onPress={() => {
              handleAuthenticationRequired()
                .then(() => props.navigation.navigate('Seed'))
                .catch(() =>
                  Alert.alert('Incorrect Pincode', undefined, [
                    {
                      text: 'Dismiss',
                      onPress: () => triggerPinModal(false),
                      style: 'cancel',
                    },
                  ]),
                );
            }}
            forward
          />

          <View style={styles.switchContainer}>
            <Text style={styles.switchTitleText}>Litecoin Denomination</Text>
            <SegmentedControl
              values={['LTC', 'Lites', 'Photons']}
              selectedIndex={subunit}
              tintColor="#20BB74"
              backgroundColor="white"
              onChange={event =>
                dispatch(updateSubunit(event.nativeEvent.selectedSegmentIndex))
              }
            />
          </View>

          <SettingCell
            title="RESET"
            onPress={() => {
              handleAuthenticationRequired().then(() =>
                Alert.alert(
                  'Reset Wallet?',
                  'Are you absolutely sure you would like to reset your wallet? Backup your seed phrase before resetting.',
                  [
                    {
                      text: 'Cancel',
                      onPress: () => triggerPinModal(false),
                      style: 'cancel',
                    },
                    {text: 'OK', onPress: () => handleReset()},
                  ],
                ),
              );
            }}
          />
        </ScrollView>
      </LinearGradient>

      <PinModal
        isVisible={isPinModalTriggered}
        close={() => triggerPinModal(false)}
        handleValidationFailure={() => DeviceEventEmitter.emit('auth', false)}
        handleValidationSuccess={() => DeviceEventEmitter.emit('auth', true)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  headerTitle: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
  switchContainer: {
    flex: 1,
    gap: 8,
    paddingLeft: 25,
    paddingTop: 10,
    paddingRight: 25,
    paddingBottom: 14,

    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#9797974d',
    backgroundColor: 'white',
  },
  switchTitleText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#484859',
    fontSize: 14,
  },
});

export const SettingsNavigationOptions = navigation => {
  return {
    headerTitle: () => <Text style={styles.headerTitle}>Settings</Text>,
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default Settings;
