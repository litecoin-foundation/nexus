import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Settings from '../screens/Settings/Settings';
import Channel from '../screens/Settings/Channel';
import OpenChannel from '../screens/Settings/OpenChannel';
import General from '../screens/Settings/General';
import Explorer from '../screens/Settings/Explorer';
import ChangePincode from '../screens/Settings/ChangePincode';
import Seed from '../screens/Settings/Seed';
import About from '../screens/Settings/About';
import Wallet from '../screens/Settings/Wallet';
import Currency from '../screens/Settings/Currency';

const Stack = createStackNavigator();

function SettingsStack() {
  return (
    <Stack.Navigator
      initialRouteName="Settings"
      screenOptions={{
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontWeight: 'bold',
          color: 'white',
        },
        headerTransparent: true,
        headerBackTitleVisible: false,
        headerTintColor: 'white',
      }}>
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={Settings.navigationOptions}
      />
      <Stack.Screen
        name="Channel"
        component={Channel}
        options={Channel.navigationOptions}
      />
      <Stack.Screen
        name="OpenChannel"
        component={OpenChannel}
        options={OpenChannel.navigationOptions}
      />
      <Stack.Screen
        name="General"
        component={General}
        options={General.navigationOptions}
      />
      <Stack.Screen
        name="ChangePincode"
        component={ChangePincode}
        options={ChangePincode.navigationOptions}
      />
      <Stack.Screen
        name="Seed"
        component={Seed}
        options={Seed.navigationOptions}
      />
      <Stack.Screen
        name="About"
        component={About}
        options={About.navigationOptions}
      />
      <Stack.Screen
        name="Wallets"
        component={Wallet}
        options={Wallet.navigationOptions}
      />
      <Stack.Screen
        name="Currency"
        component={Currency}
        options={{
          headerTitle: 'Currency',
          headerTitleStyle: {
            fontWeight: 'bold',
            color: 'white',
          },
          headerTransparent: true,
          headerBackTitleVisible: false,
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen
        name="Explorer"
        component={Explorer}
        options={{
          headerTitle: 'Select Default Explorer',
          headerTitleStyle: {
            fontWeight: 'bold',
            color: 'white',
          },
          headerTransparent: true,
          headerBackTitleVisible: false,
          headerTintColor: 'white',
        }}
      />
    </Stack.Navigator>
  );
}

export default SettingsStack;
