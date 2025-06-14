import React, {useLayoutEffect, useState, useContext} from 'react';
import {
  View,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Text,
  PermissionsAndroid,
  NativeModules,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import notifee, {AuthorizationStatus} from '@notifee/react-native';
import * as Notifications from 'expo-notifications';
import {FlexaContext} from '@flexa/flexa-react-native';
import {
  ScreenSizeProvider,
  ScreenSizeContext,
  deviceList,
} from './src/context/screenSize';
import {PopUpProvider, PopUpContext} from './src/context/popUpContext';

import {useAppDispatch, useAppSelector} from './src/store/hooks';
import {loginToNexusApi} from './src/reducers/onboarding';
import {
  updatedRatesInFiat,
  updateHistoricalRatesForAllPeriods,
} from './src/reducers/ticker';
import {
  getBuyTransactionHistory,
  getSellTransactionHistory,
  checkFlexaCustomer,
} from './src/reducers/buy';
import RootNavigator from './src/navigation/RootNavigator';
import {store, pStore} from './src/store';
import Error from './src/components/Error';

import initI18N from './src/utils/i18n';

const {APNSTokenModule} = NativeModules;

const flexaPublishableTestKey =
  'publishable_test_5xJh36PJj2xw97G9MGgMpfW82QPvp2jPjp4r6925XQgpr9QWp2WWjjc9J8h665mHfHr6pXx4fwm674w83H2x44';
const flexaPublishableLiveKey =
  'publishable_live_5gXmfxGQ65vqcv99W6XqPg3HGR8CvGw8cpMpPwp7Hfcrr7jRM5MrF425gcCw4mg33Wwww2gmMRpXC4PM67VjWM';
const flexaPublishableKey = __DEV__
  ? flexaPublishableTestKey
  : flexaPublishableLiveKey;

type RootStackParamList = {
  Scan: {
    returnRoute: any;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

const RESIZE_DEACTIVATED = __DEV__ ? false : true;

function ResizedView(props: any) {
  const {children} = props;
  const {width, height} = useContext(ScreenSizeContext);
  return <View style={{width: width, height: height}}>{children}</View>;
}

function ContextExecutable(props: any) {
  const dispatch = useAppDispatch();
  const {languageCode} = useAppSelector(state => state.settings);

  useLayoutEffect(() => {
    initI18N(languageCode);
    dispatch(loginToNexusApi(props.deviceToken, Platform.OS === 'ios'));
    // Wallet only dispatches pollers when WalletState.RPC_ACTIVE = true,
    // resulting in missing rates even if the app is being used already.
    dispatch(updatedRatesInFiat());
    dispatch(updateHistoricalRatesForAllPeriods());
    dispatch(getBuyTransactionHistory());
    dispatch(getSellTransactionHistory());
    dispatch(checkFlexaCustomer());
  }, [dispatch, languageCode, props.deviceToken]);

  return <></>;
}

const App: React.FC = () => {
  function RenderPopUp() {
    const {PopUp} = useContext(PopUpContext);
    return PopUp;
  }

  const [deviceToken, setDeviceToken] = useState('');

  async function requestIOSUserPermission() {
    const settings = await notifee.requestPermission();

    if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
      // console.log('Permission granted:', settings);
    } else {
      // console.log('Permission denied');
    }

    APNSTokenModule.getToken().then((token: string) => {
      if (token) {
        // console.log('APNS Device Token Received', token);
        setDeviceToken(token || '');
      } else {
        // console.log('No token yet');
      }
    });
  }

  async function requestAndroidUserPermission() {
    PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    const token = (await Notifications.getDevicePushTokenAsync()).data;
    // console.log('FCM Device Token Received', token);
    setDeviceToken(token || '');
  }

  useLayoutEffect(() => {
    if (Platform.OS === 'ios') {
      requestIOSUserPermission();
    } else {
      requestAndroidUserPermission();
    }
  }, []);

  // seamless Flexa login requires extra libs
  // useEffect(() => {
  //   const handleUrlEvents = (urlEvent: any) => {
  //     if (urlEvent.url) {
  //       processUniversalLink(urlEvent.url);
  //     }
  //   };
  //   const linkSubscription = Linking.addEventListener('url', handleUrlEvents);

  //   Linking.getInitialURL().then(url => url && processUniversalLink(url));
  //   return () => linkSubscription.remove();
  // }, []);

  const [deviceIndex, setDeviceIndex] = useState(0);

  return (
    <>
      <SafeAreaProvider>
        <TouchableOpacity
          style={styles.floatBtn}
          onPress={() => {
            if (deviceIndex === deviceList.length - 1) {
              setDeviceIndex(0);
            } else {
              setDeviceIndex(deviceIndex + 1);
            }
          }}>
          <Text style={styles.btnText}>{deviceList[deviceIndex]}</Text>
        </TouchableOpacity>
        <ScreenSizeProvider
          specifiedWidth={300}
          specifiedHeight={700}
          deviceName={deviceList[deviceIndex]}>
          <ResizedView>
            <Provider store={store}>
              {Platform.OS === 'android' ? (
                <StatusBar hidden={true} backgroundColor="transparent" />
              ) : null}
              <PersistGate loading={null} persistor={pStore}>
                <FlexaContext.FlexaContextProvider
                  publishableKey={flexaPublishableKey}>
                  <ContextExecutable deviceToken={deviceToken} />
                  <PopUpProvider>
                    <GestureHandlerRootView style={styles.gestureView}>
                      <RenderPopUp />
                      <RootNavigator />
                      <Error />
                    </GestureHandlerRootView>
                  </PopUpProvider>
                </FlexaContext.FlexaContextProvider>
              </PersistGate>
            </Provider>
          </ResizedView>
        </ScreenSizeProvider>
      </SafeAreaProvider>
    </>
  );
};

export default App;

const styles = StyleSheet.create({
  floatBtn: {
    display: RESIZE_DEACTIVATED ? 'none' : 'flex',
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [
      {
        translateX: -100,
      },
    ],
    width: 200,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
  },
  gestureView: {
    flex: 1,
  },
});
