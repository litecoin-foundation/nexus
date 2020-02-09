import React from 'react';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {store, pStore} from './store';

import RootNavigator from './src/navigation/RootNavigator';

const App = () => {
  return (
    <>
      <Provider store={store}>
        <PersistGate loading={null} persistor={pStore}>
          <RootNavigator />
        </PersistGate>
      </Provider>
    </>
  );
};

export default App;
