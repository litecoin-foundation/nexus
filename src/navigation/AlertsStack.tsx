import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Alert, {AlertNavigationOptions} from '../screens/Alert/Alert';
import Dial from '../screens/Alert/Dial';

const Stack = createStackNavigator();

function AlertsStack() {
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
        name="Alert"
        component={Alert}
        options={({navigation}) => AlertNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="Dial"
        component={Dial}
        options={Dial.navigationOptions}
      />
    </Stack.Navigator>
  );
}

export default AlertsStack;
