import React, {useState, useRef} from 'react';
import {
  StyleSheet,
  ScrollView,
  DeviceEventEmitter,
  Alert,
  View,
  Text,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SegmentedControl from '@react-native-segmented-control/segmented-control';

import PlasmaModal from '../../components/Modals/PlasmaModal';
import Header from '../../components/Header';
import SettingCell from '../../components/Cells/SettingCell';
import {resetPincode, setBiometricEnabled} from '../../reducers/authentication';
import PinModalContent from '../../components/Modals/PinModalContent';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {StackNavigationProp} from '@react-navigation/stack';
import {stopLnd} from '../../reducers/lightning';
import {sleep} from '../../lib/utils/poll';
import {purgeStore} from '../../store';
import {deleteLNDDir} from '../../lib/utils/file';
import {updateSubunit} from '../../reducers/settings';
import HeaderButton from '../../components/Buttons/HeaderButton';
import SupportCell from '../../components/Cells/SupportCell';

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
  Support: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'General'>;
}

const Settings: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();

  const [isPinModalOpened, setIsPinModalOpened] = useState(false);
  const pinModalAction = useRef<string>('view-seed-auth');
  function openPinModal(action: string) {
    pinModalAction.current = action;
    setIsPinModalOpened(true);
  }

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

  const handleAuthenticationRequired = (action: string) => {
    return new Promise<void>((resolve, reject) => {
      openPinModal(action);
      const subscription = DeviceEventEmitter.addListener(action, bool => {
        if (bool === true) {
          setIsPinModalOpened(false);
          subscription.remove();
          resolve();
        } else if (bool === false) {
          subscription.remove();
          reject();
        }
      });
    });
  };

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
          <SupportCell onPress={() => navigation.navigate('Support')} />

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
              handleAuthenticationRequired('view-seed-auth')
                .then(() => props.navigation.navigate('Seed'))
                .catch(() =>
                  Alert.alert('Incorrect Pincode', undefined, [
                    {
                      text: 'Dismiss',
                      onPress: () => setIsPinModalOpened(false),
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
            title="RESET WALLET?"
            onPress={() => {
              handleAuthenticationRequired('reset-wallet-auth').then(() =>
                Alert.alert(
                  'Reset Wallet?',
                  'Are you absolutely sure you would like to reset your wallet? Backup your seed phrase before resetting.',
                  [
                    {
                      text: 'Cancel',
                      onPress: () => setIsPinModalOpened(false),
                      style: 'cancel',
                    },
                    {text: 'OK', onPress: () => handleReset()},
                  ],
                ),
              );
            }}
          />

          {!__DEV__ ? null : (
            <SettingCell
              title="stopLnd()"
              onPress={() => {
                dispatch(stopLnd());
              }}
              forward
            />
          )}
        </ScrollView>
      </LinearGradient>

      <PlasmaModal
        isOpened={isPinModalOpened}
        close={() => setIsPinModalOpened(false)}
        isFromBottomToTop={true}
        animDuration={250}
        gapInPixels={0}
        backSpecifiedStyle={{backgroundColor: 'rgba(19,58,138, 0.6)'}}
        renderBody={(_, __, ___, ____, cardTranslateAnim: any) => (
          <PinModalContent
            cardTranslateAnim={cardTranslateAnim}
            close={() => setIsPinModalOpened(false)}
            handleValidationFailure={() =>
              DeviceEventEmitter.emit(pinModalAction.current, false)
            }
            handleValidationSuccess={() =>
              DeviceEventEmitter.emit(pinModalAction.current, true)
            }
          />
        )}
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
    fontFamily: 'Satoshi Variable',
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
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#484859',
    fontSize: 14,
  },
});

export const SettingsNavigationOptions = (navigation: any) => {
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
