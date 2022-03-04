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
import {useDispatch, useSelector} from 'react-redux';
import SegmentedControl from '@react-native-community/segmented-control';

import Header from '../../components/Header';
import SettingCell from '../../components/Cells/SettingCell';
import PinModal from '../../components/Modals/PinModal';
import {updateSubunit} from '../../reducers/settings';

const Wallet = props => {
  const dispatch = useDispatch();
  const [isPinModalTriggered, triggerPinModal] = useState(false);

  const {subunit} = useSelector(state => state.settings);

  const handleAuthenticationRequired = () => {
    return new Promise((resolve, reject) => {
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

  return (
    <>
      <LinearGradient
        style={styles.container}
        colors={['#F2F8FD', '#d2e1ef00']}>
        <Header />
        <ScrollView>
          <SettingCell
            title="Block Explorer"
            onPress={() => props.navigation.navigate('Explorer')}
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
                  Alert.alert('Incorrect Pincode', null, [
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

Wallet.navigationOptions = () => {
  return {
    headerTitle: 'Wallet',
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white',
    },
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
  };
};

export default Wallet;
