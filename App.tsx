import React from 'react';
import {StatusBar, Platform} from 'react-native';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {store, pStore} from './src/store';

import RootNavigator from './src/navigation/RootNavigator';

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

const App = () => (
  <>
    <Provider store={store}>
      {Platform.OS === 'android' ? (
        <StatusBar hidden={true} backgroundColor="transparent" />
      ) : null}
      <PersistGate loading={null} persistor={pStore}>
        <RootNavigator />
      </PersistGate>
    </Provider>
  </>
);

export default App;
