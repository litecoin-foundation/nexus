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
import Wallet from './src/screens/Wallet';
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

const WalletStack = createStackNavigator({
  Wallet: { screen: Wallet },
  Send: { screen: Send },
  Receive: { screen: Receive }
});

const AppStack = createBottomTabNavigator({
  Wallets: { screen: WalletStack }
});

const RootStack = createSwitchNavigator(
  {
    Auth,
    Loading,
    Onboarding: OnboardingStack,
    App: AppStack,
    Wallet: WalletStack
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
