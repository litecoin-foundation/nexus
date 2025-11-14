import React, {
  useLayoutEffect,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Text,
  PermissionsAndroid,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import notifee, {AuthorizationStatus, EventType} from '@notifee/react-native';
import * as Notifications from 'expo-notifications';
import BootSplash from 'react-native-bootsplash';
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
  setDeviceNotificationToken,
  setOpenedNotification,
} from './src/reducers/settings';
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
import Error from './src/components/Error';
import {store, pStore} from './src/store';

import {startTor} from './src/utils/tor';
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
  const {languageCode, torEnabled} = useAppSelector(state => state.settings!);
  const {uniqueId} = useAppSelector(state => state.onboarding!);
  useLayoutEffect(() => {
    initI18N(languageCode);
    // Wallet only dispatches pollers when WalletState.RPC_ACTIVE = true,
    // resulting in missing rates even if the app is being used already.
    // Do not call anything until user is initialized
    if (uniqueId) {
      dispatch(updatedRatesInFiat());
      dispatch(updateHistoricalRatesForAllPeriods());
      dispatch(getBuyTransactionHistory());
      dispatch(getSellTransactionHistory());
      dispatch(checkFlexaCustomer());
    }
  }, [dispatch, languageCode, uniqueId, props.deviceToken]);

  useEffect(() => {
    if (uniqueId && torEnabled) {
      if (__DEV__) {
        console.log('startTor');
      }

      startTor();
    }
  }, [dispatch, torEnabled, uniqueId]);
  return <></>;
}

function DeviceTokenHandler(props: any) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (props.deviceToken) {
      dispatch(setDeviceNotificationToken(props.deviceToken));
      dispatch(
        loginToNexusApi(
          props.deviceToken,
          Platform.OS === 'ios',
          String(Platform.Version),
        ),
      );
    }
  }, [dispatch, props.deviceToken]);

  return null;
}

function OpenNotificationHandler(props: any) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (props.notification) {
      dispatch(
        setOpenedNotification({
          title: props.notification?.title,
          body: props.notification?.body,
          data: props.notification?.data,
        }),
      );
    } else {
      dispatch(setOpenedNotification(null));
    }
  }, [dispatch, props.notification]);

  return null;
}

const App: React.FC = () => {
  function RenderPopUps() {
    const {PopUps} = useContext(PopUpContext);
    const renderPopUps = PopUps.map(popUp => (
      <View key={popUp.id}>{popUp.component}</View>
    ));
    return renderPopUps;
  }

  const [deviceToken, setDeviceToken] = useState('');
  const [openedNotificationData, setOpenedNotificationData] =
    useState<any>(null);

  // Function to update token and notify server
  const updateDeviceToken = useCallback(
    (newToken: string) => {
      if (newToken && newToken !== deviceToken) {
        setDeviceToken(newToken);
      }
    },
    [deviceToken],
  );

  const requestIOSUserPermission = useCallback(async () => {
    const settings = await notifee.requestPermission();

    if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
    } else {
      // console.log('Permission denied');
    }

    APNSTokenModule.getToken().then((token: string) => {
      if (token) {
        updateDeviceToken(token);
      } else {
        // console.log('No token yet');
      }
    });
  }, [updateDeviceToken]);

  const requestAndroidUserPermission = useCallback(async () => {
    PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    const token = (await Notifications.getDevicePushTokenAsync()).data;
    updateDeviceToken(token || '');
  }, [updateDeviceToken]);

  useLayoutEffect(() => {
    if (Platform.OS === 'ios') {
      requestIOSUserPermission();
    } else {
      requestAndroidUserPermission();
    }
  }, [requestIOSUserPermission, requestAndroidUserPermission]);

  // Set up token refresh listeners
  useEffect(() => {
    let subscription: any;
    if (Platform.OS === 'ios') {
      // iOS token refresh listener
      const eventEmitter = new NativeEventEmitter(APNSTokenModule);
      subscription = eventEmitter.addListener('onTokenRefresh', event => {
        updateDeviceToken(event.token);
      });
    } else {
      // Android token refresh listener
      subscription = Notifications.addPushTokenListener(event => {
        updateDeviceToken(event.data);
      });
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [deviceToken, updateDeviceToken]);

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

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec loading
      } catch (e) {
        console.warn(e);
      } finally {
        await BootSplash.hide({fade: true});
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      return notifee.onForegroundEvent(({type, detail}) => {
        switch (type) {
          case EventType.DISMISSED:
            setOpenedNotificationData(null);
            break;
          case EventType.PRESS:
            if (detail.notification) {
              setOpenedNotificationData(detail.notification);
            } else {
              setOpenedNotificationData(null);
            }
            break;
          default:
            setOpenedNotificationData(null);
            break;
        }
      });
    }

    if (Platform.OS === 'android') {
      // Handle FCM notification tap when app was closed
      Notifications.getLastNotificationResponseAsync().then(response => {
        if (response) {
          const data = response.notification.request.content.data;
          setOpenedNotificationData({
            title: data.title,
            body: data.body,
            data: data,
          });
        }
      });
    }
  }, []);

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
                  <DeviceTokenHandler deviceToken={deviceToken} />
                  <OpenNotificationHandler
                    notification={openedNotificationData}
                  />
                  <PopUpProvider>
                    <GestureHandlerRootView style={styles.gestureView}>
                      <RenderPopUps />
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
