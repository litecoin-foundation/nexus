import React, {useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  DeviceEventEmitter,
  Alert,
  View,
  Text,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SegmentedControl from '@react-native-community/segmented-control';
import {StackScreenProps} from '@react-navigation/stack';

import Header from '../../components/Header';
import SettingCell from '../../components/Cells/SettingCell';
import PinModal from '../../components/Modals/PinModal';
import {updateSubunit} from '../../reducers/settings';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {purgeStore} from '../../store';
import {resetPincode} from '../../reducers/authentication';
import {deleteLNDDir} from '../../lib/utils/file';
import {sleep} from '../../lib/utils/poll';

type RootStackParamList = {
  Wallet: undefined;
  Explorer: undefined;
  Currency: undefined;
  Seed: undefined;
  Import: undefined;
  Litewallet: undefined;
  Loading: undefined;
};

type Props = StackScreenProps<RootStackParamList, 'Wallet'>;

const Wallet: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();
  const [isPinModalTriggered, triggerPinModal] = useState(false);
  const {subunit} = useAppSelector(state => state.settings);

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
            title="Import Private Key"
            onPress={() => navigation.navigate('Import')}
            forward
          />
          <SettingCell
            title="Import Litewallet"
            onPress={() => navigation.navigate('Litewallet')}
            forward
          />
          <SettingCell
            title="Block Explorer"
            onPress={() => navigation.navigate('Explorer')}
            forward
          />
          <SettingCell
            title="Currency Code"
            onPress={() => navigation.navigate('Currency')}
            forward
          />
          <View style={styles.cellContainer}>
            <Text style={styles.title}>Litecoin Denomination</Text>
            <SegmentedControl
              values={['LTC', 'Lites', 'Photons']}
              selectedIndex={subunit}
              tintColor="#20BB74"
              activeFontStyle={styles.text}
              backgroundColor="#FFFFFF"
              onChange={event =>
                dispatch(updateSubunit(event.nativeEvent.selectedSegmentIndex))
              }
            />
          </View>

          <SettingCell
            title="View Paper Key"
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
    backgroundColor: 'rgb(238,244,249)',
  },
  cellContainer: {
    flex: 1,
    flexDirection: 'column',
    height: 90,
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#9797974d',
    backgroundColor: 'white',
  },
  title: {
    color: '#7c96ae',
    fontSize: 16,
    fontWeight: '500',
  },
  text: {
    color: 'white',
  },
});

export default Wallet;
