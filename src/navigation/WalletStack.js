import React from 'react';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';

import Wallet from '../screens/Wallet';
import Send from '../screens/Send';
import Account from '../screens/Account';
import LightningReceive from '../screens/LightningReceive';
import WebPage from '../screens/WebPage';
import Sent from '../screens/Sent';
import Fail from '../screens/Fail';
import Scan from '../screens/Scan';

const Stack = createStackNavigator();

function SendScanModalStack() {
  return (
    <Stack.Navigator mode="modal" initialRouteName="Send">
      <Stack.Screen
        name="Send"
        component={Send}
        options={{
          headerTitleAlign: 'center',
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
        name="Scan"
        component={Scan}
        options={{
          ...TransitionPresets.ModalPresentationIOS,
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

function WalletWebPageModalStack() {
  return (
    <Stack.Navigator
      mode="modal"
      initialRouteName="Wallet"
      screenOptions={{
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontWeight: 'bold',
          color: 'white',
        },
        headerTransparent: true,
        headerBackTitleVisible: true,
        headerTintColor: 'white',
      }}>
      <Stack.Screen
        name="Wallet"
        component={Wallet}
        options={Wallet.navigationOptions}
      />
      <Stack.Screen
        name="WebPage"
        component={WebPage}
        options={{
          ...TransitionPresets.ModalPresentationIOS,
          headerBackTitleVisible: false,
          headerTitle: null,
        }}
      />
    </Stack.Navigator>
  );
}

function WalletStack() {
  return (
    <Stack.Navigator
      initialRouteName="Account"
      screenOptions={{
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontWeight: 'bold',
          color: 'white',
        },
        headerTransparent: true,
        headerBackTitleVisible: true,
        headerTintColor: 'white',
      }}>
      <Stack.Screen
        name="Account"
        component={Account}
        options={{
          headerTitle: 'Your Wallet',
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletWebPageModalStack}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Send"
        component={SendScanModalStack}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="LightningReceive"
        component={LightningReceive}
        options={LightningReceive.navigationOptions}
      />
      <Stack.Screen
        name="WebPage"
        component={WebPage}
        options={WebPage.navigationOptions}
      />
      <Stack.Screen
        name="Sent"
        component={Sent}
        options={Sent.navigationOptions}
      />
      <Stack.Screen
        name="Fail"
        component={Fail}
        options={Fail.navigationOptions}
      />
    </Stack.Navigator>
  );
}

export default WalletStack;
