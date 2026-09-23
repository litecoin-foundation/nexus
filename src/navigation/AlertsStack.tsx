import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Alert from '../screens/Alert/Alert';
import {ScreenHeaderNavigationOptions} from '../components/ScreenHeader';
import Dial from '../screens/Alert/Dial';

const Stack = createStackNavigator();

function AlertsStack() {
  return (
    <Stack.Navigator
    // screenOptions={{
    //   headerTitleAlign: 'center',
    //   headerTitleStyle: {
    //     fontWeight: 'bold',
    //     color: 'white',
    //   },
    //   headerTransparent: true,
    //   headerBackButtonDisplayMode: 'minimal',
    //   headerTintColor: 'white',
    // }}
    >
      <Stack.Screen
        name="Alert"
        component={Alert}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="Dial"
        component={Dial}
        options={ScreenHeaderNavigationOptions}
      />
    </Stack.Navigator>
  );
}

export default AlertsStack;
