import React, {useEffect, useLayoutEffect, useState, useContext} from 'react';
import {
  View,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {
  Notifications,
  Registered,
  RegistrationError,
  Notification,
  NotificationCompletion,
} from 'react-native-notifications';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {FlexaContext} from '@flexahq/flexa-react-native';
import {
  ScreenSizeProvider,
  ScreenSizeContext,
  deviceList,
} from './src/context/screenSize';

import {useAppDispatch, useAppSelector} from './src/store/hooks';
import {signupSigninToApi} from './src/reducers/onboarding';
import {setDeviceNotificationToken} from './src/reducers/settings';
import {
  updatedRatesInFiat,
  updateHistoricalRatesForAllPeriods,
} from './src/reducers/ticker';
import {
  getBuyTransactionHistory,
  getSellTransactionHistory,
} from './src/reducers/buy';
import {getTransactions} from './src/reducers/transaction';
import RootNavigator from './src/navigation/RootNavigator';
import {store, pStore} from './src/store';
import Error from './src/components/Error';

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
  dispatch(setDeviceNotificationToken(props.deviceToken));
  // Wallet only dispatches pollers when WalletState.RPC_ACTIVE = true,
  // resulting in missing rates even if the app is being used already.
  dispatch(updatedRatesInFiat());
  dispatch(updateHistoricalRatesForAllPeriods());
  dispatch(getBuyTransactionHistory());
  dispatch(getSellTransactionHistory());
  dispatch(getTransactions());

  const {isOnboarded} = useAppSelector(state => state.onboarding);
  const {deviceNotificationToken} = useAppSelector(state => state.settings);

  useEffect(() => {
    if (isOnboarded === true && deviceNotificationToken) {
      // signup/signin to nexus api
      dispatch(signupSigninToApi());
    }
  }, [isOnboarded, deviceNotificationToken]);

  return <></>;
}

const App: React.FC = () => {
  const [deviceToken, setDeviceToken] = useState('');

  useLayoutEffect(() => {
    Notifications.registerRemoteNotifications();

    Notifications.events().registerRemoteNotificationsRegistered(
      (event: Registered) => {
        console.log('Device Token Received', event.deviceToken);
        setDeviceToken(event.deviceToken);
      },
    );
    Notifications.events().registerRemoteNotificationsRegistrationFailed(
      (event: RegistrationError) => {
        // console.error(event);
      },
    );

    Notifications.events().registerNotificationReceivedForeground(
      (
        notification: Notification,
        completion: (response: NotificationCompletion) => void,
      ) => {
        // console.log('Notification Received - Foreground', notification.payload);
        // Calling completion on iOS with `alert: true` will present the native iOS inApp notification.
        completion({alert: true, sound: true, badge: false});
      },
    );

    Notifications.events().registerNotificationOpened(
      (notification: Notification, completion: () => void, action: any) => {
        // console.log('Notification opened by device user', notification.payload);
        // console.log(`Notification opened with an action identifier: ${action.identifier} and response text: ${action.text}`);
        completion();
      },
    );

    Notifications.events().registerNotificationReceivedBackground(
      (notification: Notification, completion: (response: any) => void) => {
        // console.log('Notification Received - Background', notification.payload);
        // Calling completion on iOS with `alert: true` will present the native iOS inApp notification.
        completion({alert: true, sound: true, badge: false});
      },
    );

    // Not supported on Android
    // Notifications.getInitialNotification()
    //   .then(notification => {
    //     // console.log('Initial notification was:', (notification ? notification.payload : 'N/A'));
    //   })
    //   .catch(err => console.error('getInitialNotifiation() failed', err));
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
                  <GestureHandlerRootView style={styles.gestureView}>
                    <RootNavigator />
                    <Error />
                  </GestureHandlerRootView>
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
