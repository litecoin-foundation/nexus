import React from 'react';
import {Platform, StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';

import RootNavigator from './src/navigation/RootNavigator';
import {store, pStore} from './src/store';

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

const App: React.FC = () => (
  <>
    <Provider store={store}>
      {Platform.OS === 'android' ? (
        <StatusBar hidden={true} backgroundColor="transparent" />
      ) : null}
      <PersistGate loading={null} persistor={pStore}>
        <GestureHandlerRootView style={{flex: 1}}>
          <RootNavigator />
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  </>
);

export default App;
