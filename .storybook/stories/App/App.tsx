import React, {useLayoutEffect, useState} from 'react';
import {Platform, StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';

import {useAppDispatch} from '../../../src/store/hooks';
import {setDeviceNotificationToken} from '../../../src/reducers/settings';
import {updateHistoricalRatesForAllPeriods} from '../../../src/reducers/ticker';
import {
  getBuyTransactionHistory,
  getSellTransactionHistory,
} from '../../../src/reducers/buy';
import {getTransactions} from '../../../src/reducers/transaction';

import RootNavigator from '../../../src/navigation/RootNavigator';
import {store, pStore} from '../../../src/store';
import Error from '../../../src/components/Error';

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

  return (
    <>
      {/* <View style={{height: Dimensions.get('screen').height * 0.8, width: Dimensions.get('screen').width * 0.8}}> */}
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
      {/* </View> */}
    </>
  );
};

export default App;
