import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import {
  createSwitchNavigator,
  createStackNavigator,
  createBottomTabNavigator,
  createAppContainer
} from 'react-navigation';
import { store, pStore } from './store';

import { Initial, Pin, Generate, Verify, Recover } from './src/screens/Onboarding';
import Loading from './src/screens/Loading';
import Wallets from './src/screens/Wallets';
import Auth from './src/screens/Auth';
import Send from './src/screens/Send';
import Receive from './src/screens/Receive';

const OnboardingStack = createStackNavigator({
  Initial: { screen: Initial },
  Pin: { screen: Pin },
  Generate: { screen: Generate },
  Verify: { screen: Verify },
  Recover: { screen: Recover }
});

const AppStack = createBottomTabNavigator({
  Wallets: { screen: Wallets },
  Send: { screen: Send },
  Receive: { screen: Receive }
});

const RootStack = createSwitchNavigator(
  {
    Auth,
    Loading,
    Onboarding: OnboardingStack,
    App: AppStack
  },
  {
    initialRouteName: 'Loading'
  }
);

const Navigation = createAppContainer(RootStack);

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <PersistGate loading={null} persistor={pStore}>
          <Navigation />
        </PersistGate>
      </Provider>
    );
  }
}

export default App;
