import React from 'react';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';

import Buy from '../screens/Buy/Buy';
import Confirm from '../screens/Buy/Confirm';
import WebPage from '../screens/WebPage';
import History from '../screens/Buy/History';

const Stack = createStackNavigator();

function ConfirmWebPageModalStack() {
  return (
    <Stack.Navigator
      mode="modal"
      initialRouteName="Confirm"
      screenOptions={{
        headerTitleAlign: 'center',
      }}>
      <Stack.Screen
        name="Confirm"
        component={Confirm}
        options={Confirm.navigationOptions}
      />
      <Stack.Screen
        name="WebPage"
        component={WebPage}
        options={{
          ...TransitionPresets.ModalPresentationIOS,
          cardOverlayEnabled: true,
          headerTitleStyle: {
            fontWeight: 'bold',
            color: 'white',
          },
          headerTitle: '',
          headerTransparent: true,
          headerBackTitleVisible: false,
          headerTintColor: 'white',
        }}
      />
    </Stack.Navigator>
  );
}

function BuyStack() {
  return (
    <Stack.Navigator
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
        name="Buy"
        component={Buy}
        options={Buy.navigationOptions}
      />
      <Stack.Screen
        name="ConfirmStack"
        component={ConfirmWebPageModalStack}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="History"
        component={History}
        options={History.navigationOptions}
      />
    </Stack.Navigator>
  );
}

export default BuyStack;
