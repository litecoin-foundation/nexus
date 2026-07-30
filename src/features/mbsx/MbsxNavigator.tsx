import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import SwapList from './screens/SwapList';
import SwapDetail from './screens/SwapDetail';
import type {MbsxStackParamList} from './types';

const Stack = createStackNavigator<MbsxStackParamList>();

const MbsxNavigator: React.FC = () => (
  <Stack.Navigator initialRouteName="SwapList">
    <Stack.Screen
      name="SwapList"
      component={SwapList}
      options={{title: 'Swaps'}}
    />
    <Stack.Screen
      name="SwapDetail"
      component={SwapDetail}
      options={{title: 'Swap'}}
    />
  </Stack.Navigator>
);

export default MbsxNavigator;
