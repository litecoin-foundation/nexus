import React from 'react';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';

import Main, {navigationOptions} from '../screens/Main';
import Scan from '../screens/Scan';
import SettingsStack from './SettingsStack';
import WebPage from '../screens/WebPage';
import ConfirmSend from '../screens/Wallet/ConfirmSend';
import ConfirmBuy from '../screens/Buy/ConfirmBuy';
import BuyHistory, {
  BuyHistoryNavigationOptions,
} from '../screens/Buy/BuyHistory';

const Stack = createStackNavigator();

function NewWalletStack(): React.JSX.Element {
  return (
    <Stack.Navigator initialRouteName="Main">
      <Stack.Screen
        name="Main"
        component={Main}
        options={({navigation}) => navigationOptions(navigation)}
      />
      <Stack.Screen
        name="SettingsStack"
        component={SettingsStack}
        options={{headerShown: false}}
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
      <Stack.Screen
        name="WebPage"
        component={WebPage}
        options={{
          ...TransitionPresets.ModalPresentationIOS,
          headerBackTitleVisible: false,
          headerTransparent: true,
          headerTitle: '',
        }}
      />
      <Stack.Screen name="ConfirmSend" component={ConfirmSend} />
      <Stack.Screen
        name="ConfirmBuy"
        component={ConfirmBuy}
        options={{
          headerTitle: 'Buy',
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
        name="BuyHistory"
        component={BuyHistory}
        options={({navigation}) => BuyHistoryNavigationOptions(navigation)}
      />
    </Stack.Navigator>
  );
}

export default NewWalletStack;
