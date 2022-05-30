import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Vibration, Text, Image} from 'react-native';
import {Camera, useCameraDevices} from 'react-native-vision-camera';
import {useScanBarcodes, BarcodeFormat} from 'vision-camera-code-scanner';
import LinearGradient from 'react-native-linear-gradient';

import Switch from '../components/Buttons/Switch';
import Header from '../components/Header';

const Scan = props => {
  const {navigation} = props;
  const [flashEnabled, triggerFlash] = useState(false);
  const [scanned, triggerScanned] = useState(false);

  const [frameProcessor, barcodes] = useScanBarcodes([
    BarcodeFormat.ALL_FORMATS, // You can only specify a particular format
  ]);

  const toggleActiveState = async () => {
    if (barcodes && barcodes.length > 0 && scanned === false) {
      triggerScanned(true);
      barcodes.forEach(async qr => {
        if (qr.rawValue !== '') {
          Vibration.vibrate();
          navigation.navigate('Send', {scanData: qr.rawValue});
        }
      });
    }
  };

  React.useEffect(() => {
    toggleActiveState();
    return () => {
      barcodes;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcodes]);

  useEffect(() => {
    async function checkCameraPermissions() {
      const cameraPermission = await Camera.getCameraPermissionStatus();
      return cameraPermission;
    }

    async function handlePermissions() {
      const permission = await checkCameraPermissions();
      switch (permission) {
        case 'authorized':
          break;
        case 'not-determined':
          // TODO test this
          await Camera.requestCameraPermission();
          break;
        case 'denied':
          // TODO
          alert('camera disabled');
          // The user explicitly denied the permission request alert.
          // You cannot use the request functions again, but you can
          // use the Linking API to redirect the user to the Settings
          // App where he can manually grant the permission.
          break;
        case 'restricted':
          alert('camera disabled');
          // iOS only - camera restricted
          // handle same as denied?
          break;
        default:
          break;
      }
    }

    handlePermissions();
  }, []);

  const devices = useCameraDevices();
  const device = devices.back;

  if (device == null) {
    return <View />;
  }

  return (
    <View style={styles.container}>
      <Header modal={true} />
      <Camera
        style={styles.camera}
        device={device}
        isActive={true}
        torch={flashEnabled === false ? 'off' : 'on'}
        frameProcessor={frameProcessor}
        frameProcessorFps={5}
        audio={false}>
        <View style={styles.qrFrameContainer}>
          <Image source={require('../assets/images/qr-frame.png')} />
        </View>
      </Camera>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
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

export default Scan;
