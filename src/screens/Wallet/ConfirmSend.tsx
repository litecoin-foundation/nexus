import React, {useState} from 'react';
import {
  Alert,
  DeviceEventEmitter,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import HeaderButton from '../../components/Buttons/HeaderButton';
import PinModal from '../../components/Modals/PinModal';
import GreenButton from '../../components/Buttons/GreenButton';

interface Props {}

const ConfirmSend: React.FC<Props> = () => {
  const [isPinModalTriggered, triggerPinModal] = useState(false);

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

  const handleSend = () => {
    handleAuthenticationRequired()
      .then(() => console.log('successfully authentication, handle sending'))
      .catch(() =>
        Alert.alert('Incorrect Pincode', undefined, [
          {
            text: 'Dismiss',
            onPress: () => triggerPinModal(false),
            style: 'cancel',
          },
        ]),
      );
  };

  return (
    <>
      <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
        <SafeAreaView>
          <Text>Send</Text>
          <Text>0.01LTC</Text>
          <Text>$182.03</Text>
        </SafeAreaView>

        <View style={styles.confirmButtonContainer}>
          <GreenButton value="Confirm and Send" onPress={() => handleSend()} />
        </View>
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
  },
  confirmButtonContainer: {
    flex: 1,
    position: 'absolute',
    bottom: 31,
    width: 335,
    alignSelf: 'center',
  },
});

export const ConfirmSendNavigationOptions = navigation => {
  return {
    headerTitle: '',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        title="CHANGE"
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
    headerRight: () => (
      <HeaderButton
        title="CANCEL"
        onPress={() => navigation.reset('Main')}
        rightPadding={true}
      />
    ),
  };
};

export default ConfirmSend;
