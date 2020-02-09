import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Initial from '../screens/Onboarding/Initial';
import Pin from '../screens/Onboarding/Pin';
import Generate from '../screens/Onboarding/Generate';
import Verify from '../screens/Onboarding/Verify';
import Recover from '../screens/Onboarding/Recover';
import ChannelBackup from '../screens/Onboarding/ChannelBackup';
import Biometric from '../screens/Onboarding/Biometric';
import Welcome from '../screens/Onboarding/Welcome';

const Stack = createStackNavigator();

function OnboardingStack() {
  return (
    <Stack.Navigator initialRouteName="Initial">
      <Stack.Screen
        name="Initial"
        component={Initial}
        options={Initial.navigationOptions}
      />
      <Stack.Screen
        name="Pin"
        component={Pin}
        options={Pin.navigationOptions}
      />
      <Stack.Screen
        name="Generate"
        component={Generate}
        options={Generate.navigationOptions}
      />
      <Stack.Screen
        name="Verify"
        component={Verify}
        options={Verify.navigationOptions}
      />
      <Stack.Screen
        name="Recover"
        component={Recover}
        options={Recover.navigationOptions}
      />
      <Stack.Screen
        name="ChannelBackup"
        component={ChannelBackup}
        options={ChannelBackup.navigationOptions}
      />
      <Stack.Screen
        name="Biometric"
        component={Biometric}
        options={Biometric.navigationOptions}
      />
      <Stack.Screen
        name="Welcome"
        component={Welcome}
        options={Welcome.navigationOptions}
      />
    </Stack.Navigator>
  );
}

export default OnboardingStack;
