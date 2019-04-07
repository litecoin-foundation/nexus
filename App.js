import React, { Component } from 'react';
import { Provider } from 'react-redux';
import {
  createSwitchNavigator,
  createStackNavigator,
  createBottomTabNavigator,
  createAppContainer
} from 'react-navigation';
import store from './store';

import { Initial, Pin, GenerateWallet, VerifyWallet } from './src/screens/Onboarding';
import Loading from './src/screens/Loading';
import Wallets from './src/screens/Wallets';

const OnboardingStack = createStackNavigator({
  initial: { screen: Initial },
  createPin: { screen: Pin },
  generateWallet: { screen: GenerateWallet },
  verifyWallet: { screen: VerifyWallet }
});

const AppStack = createBottomTabNavigator({
  Wallets: { screen: Wallets }
});

const RootStack = createSwitchNavigator(
  {
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
        <Navigation />
      </Provider>
    );
  }
}

export default App;
