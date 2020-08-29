import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Alert from '../screens/Alert/Alert';
import Dial from '../screens/Alert/Dial';

const Stack = createStackNavigator();

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
        name="Alert"
        component={Alert}
        options={Alert.navigationOptions}
      />
      <Stack.Screen
        name="Dial"
        component={Dial}
        options={Dial.navigationOptions}
      />
    </Stack.Navigator>
  );
}

export default BuyStack;
