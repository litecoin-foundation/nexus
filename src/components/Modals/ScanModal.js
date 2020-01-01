import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Vibration,
  TouchableOpacity,
  Text,
  Image,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import {RNCamera} from 'react-native-camera';
import LinearGradient from 'react-native-linear-gradient';

import Switch from '../Buttons/Switch';
import Header from '../Header';

const ScanModal = props => {
  const {isVisible, close, handleQRRead} = props;
  const [flashEnabled, triggerFlash] = useState(false);

  const handleRead = event => {
    Vibration.vibrate();
    handleQRRead(event.data);
  };

  return (
    <Modal isVisible={isVisible} swipeDirection="down" style={styles.noMargin}>
      <View style={styles.container}>
        <Header>
          <TouchableOpacity style={styles.closeButton} onPress={() => close()}>
            <Image source={require('../../assets/images/close-white.png')} />
          </TouchableOpacity>
        </Header>

        <RNCamera
          style={styles.camera}
          captureAudio={false}
          onBarCodeRead={e => handleRead(e)}
          type={RNCamera.Constants.Type.back}
          barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
          videoStabilizationMode={
            Platform.OS === 'android'
              ? null
              : RNCamera.Constants.VideoStabilization.auto
          }
          androidCameraPermissionOptions={{
            title: 'Permission to use Camera',
            message:
              'App will use your camera to scan QR codes for Litecoin Payments',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          notAuthorizedView={
            <View>
              <Text style={styles.textAlign}>
                Camera not enabled. Go to Settings and enable your Camera for
                settings to scan QR codes.
              </Text>
            </View>
          }
          flashMode={
            flashEnabled
              ? RNCamera.Constants.FlashMode.torch
              : RNCamera.Constants.FlashMode.off
          }>
          <View style={styles.qrFrameContainer}>
            <Image source={require('../../assets/images/qr-frame.png')} />
          </View>
        </RNCamera>
        <LinearGradient
          colors={['#7E58FFF2', '#003DB3F2']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.bottomContainer}>
          <View style={styles.bottomContentContainer}>
            <Text style={styles.bottomText}>Enable Flash</Text>
            <Switch onPress={flashStatus => triggerFlash(flashStatus)} />
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  noMargin: {
    margin: 0,
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  bottomContainer: {
    height: 90,
    width: '100%',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
  },
  bottomText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: -0.39,
  },
  textAlign: {
    textAlign: 'center',
  },
  closeButton: {
    height: '100%',
    justifyContent: 'center',
    left: 15,
  },
  qrFrameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 140,
  },
  bottomContentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 20,
  },
});

export default ScanModal;
