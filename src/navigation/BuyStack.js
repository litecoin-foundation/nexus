import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Buy from '../screens/Buy/Buy';
import Confirm from '../screens/Buy/Confirm';
import Processing from '../screens/Buy/Processing';

const Stack = createStackNavigator();

function BuyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Buy"
        component={Buy}
        options={Buy.navigationOptions}
      />
      <Stack.Screen
        name="Confirm"
        component={Confirm}
        options={Confirm.navigationOptions}
      />
      <Stack.Screen
        name="Processing"
        component={Processing}
        options={Processing.navigationOptions}
      />
    </Stack.Navigator>
  );
}

export default BuyStack;
