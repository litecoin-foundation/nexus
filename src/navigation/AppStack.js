import React from 'react';
import {Image} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import DeviceInfo from 'react-native-device-info';

import WalletStack from './WalletStack';
import BuyStack from './BuyStack';
import AlertsStack from './AlertsStack';
import SettingsStack from './SettingsStack';

const Tab = createBottomTabNavigator();

function AppStack() {
  return (
    <Tab.Navigator
      tabBarOptions={{
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
          height: DeviceInfo.hasNotch() ? 90 : 70,
        },
        labelStyle: {
          fontWeight: '500',
          letterSpacing: -0.5,
        },
        activeTintColor: '#2645CA',
        inactiveTintColor: '#9B9B9B',
      }}>
      <Tab.Screen
        name="Wallet"
        component={WalletStack}
        options={({route}) => ({
          tabBarLabel: 'WALLETS',
          tabBarIcon: ({focused}) => WalletTabBarIcon(focused),
          tabBarVisible: isTabBarVisible(route),
        })}
      />
      <Tab.Screen
        name="Buy"
        component={BuyStack}
        options={({route}) => ({
          tabBarLabel: 'BUY',
          tabBarIcon: ({focused}) => BuyTabBarIcon(focused),
          tabBarVisible: isTabBarVisible(route),
        })}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsStack}
        options={({route}) => ({
          tabBarLabel: 'ALERTS',
          tabBarIcon: ({focused}) => AlertsTabBarIcon(focused),
          tabBarVisible: isTabBarVisible(route),
        })}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={({route}) => ({
          tabBarLabel: 'SETTINGS',
          tabBarIcon: ({focused}) => SettingsTabBarIcon(focused),
          tabBarVisible: isTabBarVisible(route),
        })}
      />
    </Tab.Navigator>
  );
}

const isTabBarVisible = route => {
  if (route.state === undefined || route.state === null) {
    return;
  } else {
    if (route.state.index > 0) {
      return false;
    } else {
      return true;
    }
  }
};

const WalletTabBarIcon = focused => {
  return (
    <Image
      source={
        focused
          ? require('../assets/icons/wallet-selected-icon.png')
          : require('../assets/icons/wallet-icon.png')
      }
    />
  );
};

const BuyTabBarIcon = focused => {
  return (
    <Image
      source={
        focused
          ? require('../assets/icons/buy-selected-icon.png')
          : require('../assets/icons/buy-icon.png')
      }
    />
  );
};

const AlertsTabBarIcon = focused => {
  return (
    <Image
      source={
        focused
          ? require('../assets/icons/alerts-selected-icon.png')
          : require('../assets/icons/alerts-icon.png')
      }
    />
  );
};

const SettingsTabBarIcon = focused => {
  return (
    <Image
      source={
        focused
          ? require('../assets/icons/settings-selected-icon.png')
          : require('../assets/icons/settings-icon.png')
      }
    />
  );
};

export default AppStack;
