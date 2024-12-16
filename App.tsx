import React, {useLayoutEffect, useState, useContext} from 'react';
import {View, Platform, StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {
  Notifications,
  Registered,
  RegistrationError,
  Notification,
  NotificationCompletion,
  NotificationBackgroundFetchResult,
} from 'react-native-notifications';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ScreenSizeProvider, ScreenSizeContext} from './src/context/screenSize';

import {useAppDispatch} from './src/store/hooks';
import {setDeviceNotificationToken} from './src/reducers/settings';
import {updateHistoricalRatesForAllPeriods} from './src/reducers/ticker';
import {
  getBuyTransactionHistory,
  getSellTransactionHistory,
} from './src/reducers/buy';
import {getTransactions} from './src/reducers/transaction';
import RootNavigator from './src/navigation/RootNavigator';
import {store, pStore} from './src/store';
import Error from './src/components/Error';

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

function ResizedView(props: any) {
  const { children } = props;
  const { width, height, isDeviceRotated } = useContext(ScreenSizeContext);
  return <View style={{width: width, height: height}}>
    {children}
  </View>;
}

function ContextExecutable(props: any) {
  const dispatch = useAppDispatch();
  dispatch(setDeviceNotificationToken(props.deviceToken));
  dispatch(updateHistoricalRatesForAllPeriods());
  dispatch(getBuyTransactionHistory());
  dispatch(getSellTransactionHistory());
  dispatch(getTransactions());
  return <></>;
}

const App: React.FC = () => {
  const [deviceToken, setDeviceToken] = useState('');

  useLayoutEffect(() => {
    Notifications.registerRemoteNotifications();

    Notifications.events().registerRemoteNotificationsRegistered(
      (event: Registered) => {
        // TODO: Send the token to my server so it could send back push notifications...
        // console.log('Device Token Received', event.deviceToken);
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
      (
        notification: Notification,
        completion: (response: NotificationBackgroundFetchResult) => void,
      ) => {
        // console.log('Notification Received - Background', notification.payload);

        // Calling completion on iOS with `alert: true` will present the native iOS inApp notification.
        completion({alert: true, sound: true, badge: false});
      },
    );

    Notifications.getInitialNotification()
      .then(notification => {
        // console.log('Initial notification was:', (notification ? notification.payload : 'N/A'));
      })
      .catch(err => console.error('getInitialNotifiation() failed', err));
  }, []);

  return (
    <>
      <SafeAreaProvider>
        <ScreenSizeProvider specifiedWidth={300} specifiedHeight={700} deviceName="iphone 13">
          <ResizedView>
            <Provider store={store}>
              {Platform.OS === 'android' ? (
                <StatusBar hidden={true} backgroundColor="transparent" />
              ) : null}
              <PersistGate loading={null} persistor={pStore}>
                <ContextExecutable deviceToken={deviceToken} />
                <GestureHandlerRootView style={{flex: 1}}>
                  <RootNavigator deviceToken={deviceToken} />
                  <Error />
                </GestureHandlerRootView>
              </PersistGate>
            </Provider>
          </ResizedView>
        </ScreenSizeProvider>
      </SafeAreaProvider>
    </>
  );
};

export default App;
