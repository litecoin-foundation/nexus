import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Auth from '../screens/Auth/Auth';
import Forgot from '../screens/Auth/Forgot';
import ChangePincode from '../screens/Settings/ChangePincode';

const Stack = createStackNavigator();

function AuthStack(): JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="Auth"
      screenOptions={{
        headerTitleAlign: 'center',
        headerTransparent: true,
        headerBackTitleVisible: false,
        headerTintColor: 'white',
      }}>
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
        options={{
          headerTitle: 'Change Wallet PIN',
          headerTitleStyle: {
            fontWeight: 'bold',
            color: 'white',
          },
          headerLeftContainerStyle: {
            paddingLeft: 15,
            marginRight: -15,
          },
        }}
      />
    </Stack.Navigator>
  );
}

export default AuthStack;
