import React from 'react';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';

import Wallet from '../screens/Wallet';
import Send from '../screens/Send';
import Receive from '../screens/Receive';
import Account from '../screens/Account';
import LightningReceive from '../screens/LightningReceive';
import WebPage from '../screens/WebPage';
import Sent from '../screens/Sent';
import Fail from '../screens/Fail';

const Stack = createStackNavigator();

function WalletWebPageModalStack() {
  return (
    <Stack.Navigator mode="modal" initialRouteName="Wallet">
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

function WalletStack() {
  return (
    <Stack.Navigator initialRouteName="Account">
      <Stack.Screen
        name="Account"
        component={Account}
        options={Account.navigationOptions}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletWebPageModalStack}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Send"
        component={Send}
        options={Send.navigationOptions}
      />
      <Stack.Screen
        name="Receive"
        component={Receive}
        options={Receive.navigationOptions}
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
