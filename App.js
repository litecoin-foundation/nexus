import React from 'react';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {createSwitchNavigator, createAppContainer} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import {createBottomTabNavigator} from 'react-navigation-tabs';
import {store, pStore} from './store';
import {Image} from 'react-native';

import Initial from './src/screens/Onboarding/Initial';
import Pin from './src/screens/Onboarding/Pin';
import Generate from './src/screens/Onboarding/Generate';
import Verify from './src/screens/Onboarding/Verify';
import Recover from './src/screens/Onboarding/Recover';
import ChannelBackup from './src/screens/Onboarding/ChannelBackup';
import Biometric from './src/screens/Onboarding/Biometric';
import Welcome from './src/screens/Onboarding/Welcome';
import Loading from './src/screens/Loading';
import Wallet from './src/screens/Wallet';
import Auth from './src/screens/Auth';
import Send from './src/screens/Send';
import Receive from './src/screens/Receive';
import Account from './src/screens/Account';
import Settings from './src/screens/Settings/Settings';
import LightningReceive from './src/screens/LightningReceive';
import Channel from './src/screens/Settings/Channel';
import OpenChannel from './src/screens/Settings/OpenChannel';
import Buy from './src/screens/Buy/Buy';
import Confirm from './src/screens/Buy/Confirm';
import Processing from './src/screens/Buy/Processing';
import WebPage from './src/screens/WebPage';

const OnboardingStack = createStackNavigator({
  Initial: {screen: Initial},
  Pin: {screen: Pin},
  Generate: {screen: Generate},
  Verify: {screen: Verify},
  Recover: {screen: Recover},
  ChannelBackup: {screen: ChannelBackup},
  Biometric: {screen: Biometric},
  Welcome: {screen: Welcome},
});

const WalletStack = createStackNavigator({
  Account: {screen: Account},
  Wallet: {screen: Wallet},
  Send: {screen: Send},
  Receive: {screen: Receive},
  LightningReceive: {screen: LightningReceive},
  WebPage: {screen: WebPage},
});

WalletStack.navigationOptions = ({navigation}) => {
  let tabBarVisible = true;
  if (navigation.state.index > 0) {
    tabBarVisible = false;
  }
  return {
    tabBarVisible,
    tabBarLabel: 'WALLETS',
    tabBarIcon: ({focused}) =>
      focused ? (
        <Image
          source={require('./src/assets/icons/wallet-selected-icon.png')}
        />
      ) : (
        <Image source={require('./src/assets/icons/wallet-icon.png')} />
      ),
  };
};

const SettingsStack = createStackNavigator({
  Settings: {screen: Settings},
  Channel: {screen: Channel},
  OpenChannel: {screen: OpenChannel},
});

SettingsStack.navigationOptions = ({navigation}) => {
  let tabBarVisible = true;
  if (navigation.state.index > 0) {
    tabBarVisible = false;
  }
  return {
    tabBarVisible,
    tabBarLabel: 'SETTINGS',
    tabBarIcon: ({focused}) =>
      focused ? (
        <Image
          source={require('./src/assets/icons/settings-selected-icon.png')}
        />
      ) : (
        <Image source={require('./src/assets/icons/settings-icon.png')} />
      ),
  };
};

const BuyStack = createStackNavigator({
  Buy: {screen: Buy},
  Confirm: {screen: Confirm},
  Processing: {screen: Processing},
});

BuyStack.navigationOptions = {
  tabBarLabel: 'BUY',
  tabBarIcon: ({focused}) =>
    focused ? (
      <Image source={require('./src/assets/icons/buy-selected-icon.png')} />
    ) : (
      <Image source={require('./src/assets/icons/buy-icon.png')} />
    ),
};

const AppStack = createBottomTabNavigator(
  {
    Wallets: {screen: WalletStack},
    Buy: {screen: BuyStack},
    Settings: {screen: SettingsStack},
  },
  {
    tabBarOptions: {
      style: {
        backgroundColor: '#FBFCFE',
        borderTopWidth: 0,
        shadowColor: 'black',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: {
          height: 0,
          width: 0,
        },
        height: 60,
      },
      labelStyle: {
        fontWeight: '500',
        letterSpacing: -0.5,
      },
      activeTintColor: '#2645CA',
      inactiveTintColor: '#9B9B9B',
    },
  },
);

const RootStack = createSwitchNavigator(
  {
    Auth,
    Loading,
    Onboarding: OnboardingStack,
    App: AppStack,
    Wallet: WalletStack,
  },
  {
    initialRouteName: 'Loading',
  },
);

const Navigation = createAppContainer(RootStack);

const App: () => React$Node = () => {
  return (
    <>
      <Provider store={store}>
        <PersistGate loading={null} persistor={pStore}>
          <Navigation />
        </PersistGate>
      </Provider>
    </>
  );
};

export default App;
