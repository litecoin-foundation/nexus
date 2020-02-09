import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Settings from '../screens/Settings/Settings';
import Channel from '../screens/Settings/Channel';
import OpenChannel from '../screens/Settings/OpenChannel';
import General from '../screens/Settings/General';
import ChangePincode from '../screens/Settings/ChangePincode';

const Stack = createStackNavigator();

function SettingsStack() {
  return (
    <Stack.Navigator initialRouteName="Settings">
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
    </Stack.Navigator>
  );
}

export default SettingsStack;
