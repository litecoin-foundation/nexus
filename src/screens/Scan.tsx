import React, {useState, useContext, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Vibration,
  Image,
  Alert,
  Platform,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import LinearGradient from 'react-native-linear-gradient';
import {
  StackNavigationOptions,
  StackScreenProps,
  TransitionPresets,
} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import Switch from '../components/Buttons/Switch';
import Header from '../components/Header';
import HeaderButton from '../components/Buttons/HeaderButton';
import BlueButton from '../components/Buttons/BlueButton';

import TranslateText from '../components/TranslateText';
import {ScreenSizeContext} from '../context/screenSize';

type RootStackParamList = {
  Scan: {
    returnRoute: any;
  };
};

const Scan = ({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'Scan'>) => {
  const insets = useSafeAreaInsets();
  const [flashEnabled, triggerFlash] = useState(false);
  const [scanned, triggerScanned] = useState(false);

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (codes.length > 0 && scanned === false) {
        triggerScanned(true);
        for (const code of codes) {
          if (code.value !== '') {
            Vibration.vibrate();
            navigation.popTo(route.params.returnRoute, {
              scanData: code.value,
              updateHeader: true,
            });
          }
        }
      }
    },
  });

  useEffect(() => {
    async function checkCameraPermissions() {
      const cameraPermission = await Camera.getCameraPermissionStatus();
      return cameraPermission;
    }

    async function handlePermissions() {
      const permission = await checkCameraPermissions();
      switch (permission) {
        case 'granted':
          break;
        case 'not-determined':
          await Camera.requestCameraPermission();
          break;
        case 'denied':
          // TODO
          Alert.alert('camera disabled');
          // The user explicitly denied the permission request alert.
          // You cannot use the request functions again, but you can
          // use the Linking API to redirect the user to the Settings
          // App where he can manually grant the permission.
          break;
        case 'restricted':
          Alert.alert('camera disabled');
          // iOS only - camera restricted
          // handle same as denied?
          break;
        default:
          break;
      }
    }

    handlePermissions();
  }, []);

  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();

  const PermissionsView = (
    <View style={styles.container}>
      <Header modal={true} />
      <View style={styles.permissionsContainer}>
        <BlueButton
          textKey="enable_camera"
          textDomain="sendTab"
          onPress={() => requestPermission()}
        />
      </View>
    </View>
  );

  if (!hasPermission) {
    return PermissionsView;
  }
  if (device == null) {
    return <View />;
  }

  return (
    <View
      style={[
        styles.container,
        Platform.OS === 'android' ? {marginBottom: insets.bottom} : null,
      ]}>
      <Header modal={true} />
      <View style={styles.container}>
        <Camera
          codeScanner={codeScanner}
          style={styles.camera}
          device={device}
          isActive={true}
          torch={flashEnabled === false ? 'off' : 'on'}
          audio={false}
        />
      </View>
      <Image
        style={styles.qrFrameContainer}
        source={require('../assets/images/qr-frame.png')}
      />

      <LinearGradient
        colors={['#1162E6', '#0F55C7']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.bottomContainer}>
        <View style={styles.bottomContentContainer}>
          <TranslateText
            textKey="enable_flash"
            domain="sendTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
            textStyle={styles.bottomText}
            numberOfLines={1}
          />
          <Switch
            onPress={flashStatus => triggerFlash(flashStatus)}
            initialValue={false}
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noMargin: {
    margin: 0,
    flex: 1,
  },
  camera: {
    flex: 1,
    marginTop: -37,
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
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
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
    position: 'absolute',
    top: 270,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
  },
  bottomContentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 20,
  },
  headerTitle: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
  permissionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'center',
    width: '80%',
  },
});

export const ScanNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);

  return {
    ...TransitionPresets.ModalPresentationIOS,
    headerTitle: () => (
      <TranslateText
        textKey="scan_qr"
        domain="sendTab"
        maxSizeInPixels={SCREEN_HEIGHT * 0.02}
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
        onPress={() => navigation.goBack()}
        imageSource={require('../assets/images/close-white.png')}
        textKey="close"
        textDomain="sendTab"
      />
    ),
  };
};

export default Scan;
