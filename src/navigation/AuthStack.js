import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Auth from '../screens/Auth/Auth';
import Forgot from '../screens/Auth/Forgot';
import ChangePincode from '../screens/Settings/ChangePincode';

const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Auth">
      <Stack.Screen
        name="Auth"
        component={Auth}
        options={Auth.navigationOptions}
      />
      <Stack.Screen
        name="Forgot"
        component={Forgot}
        options={Forgot.navigationOptions}
      />
      <Stack.Screen
        name="ChangePincode"
        component={ChangePincode}
        options={ChangePincode.navigationOptions}
      />
    </Stack.Navigator>
  );
}

export default AuthStack;
