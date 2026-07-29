import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Auth from '../screens/Auth/Auth';
import Forgot, {ForgotNavigationOptions} from '../screens/Auth/Forgot';
import ChangePincode from '../screens/Settings/ChangePincode';

const Stack = createStackNavigator();

function AuthStack(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="Auth"
      screenOptions={{
        headerTitleAlign: 'center',
        headerTransparent: true,
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: 'white',
      }}>
      {/* The Auth screen owns its header via navigation.setOptions. */}
      <Stack.Screen name="Auth" component={Auth} />
      <Stack.Screen
        name="Forgot"
        component={Forgot}
        options={({navigation}) => ForgotNavigationOptions(navigation)}
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
