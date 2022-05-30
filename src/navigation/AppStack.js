import React from 'react';
import {Image} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';

import WalletStack from './WalletStack';
import BuyStack from './BuyStack';
import AlertsStack from './AlertsStack';
import SettingsStack from './SettingsStack';

const Tab = createBottomTabNavigator();

function AppStack() {
  return (
    <Tab.Navigator
      screenOptions={{
        labelStyle: {
          fontWeight: '500',
          letterSpacing: -0.5,
        },
        tabBarActiveTintColor: '#2645CA',
        tabBarInactiveTintColor: '#9B9B9B',
        tabBarLabelStyle: {
          fontWeight: '500',
          letterSpacing: -0.5,
        },
      }}>
      <Tab.Screen
        name="WalletStack"
        component={WalletStack}
        options={({route}) => ({
          tabBarLabel: 'WALLETS',
          tabBarIcon: ({focused}) => WalletTabBarIcon(focused),
          tabBarStyle: [
            tabBarStyle,
            {
              display: isTabBarVisible(route) === true ? 'flex' : 'none',
            },
          ],
          headerShown: false,
        })}
      />
      <Tab.Screen
        name="Buy"
        component={BuyStack}
        options={({route}) => ({
          tabBarLabel: 'BUY',
          tabBarIcon: ({focused}) => BuyTabBarIcon(focused),
          tabBarStyle: [
            tabBarStyle,
            {
              display: isTabBarVisible(route) === true ? 'flex' : 'none',
            },
          ],
          headerShown: false,
        })}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsStack}
        options={({route}) => ({
          tabBarLabel: 'ALERTS',
          tabBarIcon: ({focused}) => AlertsTabBarIcon(focused),
          tabBarStyle: [
            tabBarStyle,
            {
              display: isTabBarVisible(route) === true ? 'flex' : 'none',
            },
          ],
          headerShown: false,
        })}
      />
      <Tab.Screen
        name="SettingsStack"
        component={SettingsStack}
        options={({route}) => ({
          tabBarLabel: 'SETTINGS',
          tabBarIcon: ({focused}) => SettingsTabBarIcon(focused),
          tabBarStyle: [
            tabBarStyle,
            {
              display: isTabBarVisible(route) === true ? 'flex' : 'none',
            },
          ],
          headerShown: false,
        })}
      />
    </Tab.Navigator>
  );
}

const tabBarStyle = {
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
};

const isTabBarVisible = route => {
  const routes = [
    'Wallet',
    'Send',
    'Receive',
    'LightningReceive',
    'WebPage',
    'Sent',
    'Fail',
    'Dial',
    'Confirm',
    'ConfirmStack',
    'History',
    'Channel',
    'OpenChannel',
    'General',
    'ChangePincode',
    'Seed',
    'About',
    'Wallets',
    'Currency',
  ];

  if (routes.includes(getFocusedRouteNameFromRoute(route))) {
    return false;
  } else {
    return true;
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
