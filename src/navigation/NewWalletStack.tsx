import React from 'react';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';

import Main, {navigationOptions} from '../screens/Main';
import Scan from '../screens/Scan';
import SettingsStack from './SettingsStack';

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
    </Stack.Navigator>
  );
}

export default NewWalletStack;
