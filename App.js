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

import Initial from './src/screens/Onboarding/Initial';
import Pin from './src/screens/Onboarding/Pin';
import Generate from './src/screens/Onboarding/Generate';
import Verify from './src/screens/Onboarding/Verify';
import Recover from './src/screens/Onboarding/Recover';
import ChannelBackup from './src/screens/Onboarding/ChannelBackup';
import Loading from './src/screens/Loading';
import Wallet from './src/screens/Wallet';
import Auth from './src/screens/Auth';
import Send from './src/screens/Send';
import Receive from './src/screens/Receive';
import Account from './src/screens/Account';
import Settings from './src/screens/Settings/Settings';
import LightningSend from './src/screens/LightningSend';
import LightningReceive from './src/screens/LightningReceive';
import LightningInvoice from './src/screens/LightningInvoice';
import Scanner from './src/screens/Scanner';
import Channel from './src/screens/Settings/Channel';
import OpenChannel from './src/screens/Settings/OpenChannel';

const OnboardingStack = createStackNavigator({
  Initial: { screen: Initial },
  Pin: { screen: Pin },
  Generate: { screen: Generate },
  Verify: { screen: Verify },
  Recover: { screen: Recover },
  ChannelBackup: { screen: ChannelBackup }
});

const WalletStack = createStackNavigator({
  Account: { screen: Account },
  Wallet: { screen: Wallet },
  Send: { screen: Send },
  Receive: { screen: Receive },
  LightningSend: { screen: LightningSend },
  LightningReceive: { screen: LightningReceive },
  LightningInvoice: { screen: LightningInvoice },
  Scanner: { screen: Scanner }
});

WalletStack.navigationOptions = ({ navigation }) => {
  let tabBarVisible = true;
  if (navigation.state.index > 0) {
    tabBarVisible = false;
  }
  return {
    tabBarVisible
  };
};

const SettingsStack = createStackNavigator({
  Settings: { screen: Settings },
  Channel: { screen: Channel },
  OpenChannel: { screen: OpenChannel }
});

SettingsStack.navigationOptions = ({ navigation }) => {
  let tabBarVisible = true;
  if (navigation.state.index > 0) {
    tabBarVisible = false;
  }
  return {
    tabBarVisible
  };
};

const AppStack = createBottomTabNavigator({
  Wallets: { screen: WalletStack },
  Settings: { screen: SettingsStack }
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
