import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Main, {navigationOptions} from '../screens/Main';
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
    </Stack.Navigator>
  );
}

export default NewWalletStack;
