import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Initial from '../screens/Onboarding/Initial';
import InitialWithSeed from '../screens/Onboarding/InitialWithSeed';
import Pin from '../screens/Onboarding/Pin';
import Generate from '../screens/Onboarding/Generate';
import Verify from '../screens/Onboarding/Verify';
import Recover, {RecoverNavigationOptions} from '../screens/Onboarding/Recover';
import Biometric, {
  BiometricNavigationOptions,
} from '../screens/Onboarding/Biometric';
import Welcome, {WelcomeNavigationOptions} from '../screens/Onboarding/Welcome';
import {OnboardingStackParamList} from './types';

const Stack = createStackNavigator<OnboardingStackParamList>();

function OnboardingStack() {
  return (
    <Stack.Navigator
      initialRouteName="Initial"
      screenOptions={{
        headerTitleAlign: 'center',
        headerTransparent: true,
        headerBackTitleVisible: false,
        headerTintColor: 'white',
      }}>
      <Stack.Screen
        name="Initial"
        component={Initial}
        options={Initial.navigationOptions}
      />
      <Stack.Screen
        name="InitialWithSeed"
        component={InitialWithSeed}
        options={InitialWithSeed.navigationOptions}
      />
      <Stack.Screen name="Pin" component={Pin} />
      <Stack.Screen name="Generate" component={Generate} />
      <Stack.Screen name="Verify" component={Verify} />
      <Stack.Screen
        name="Recover"
        component={Recover}
        options={({navigation}) => RecoverNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="Biometric"
        component={Biometric}
        options={({navigation}) => BiometricNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="Welcome"
        component={Welcome}
        options={({}) => WelcomeNavigationOptions()}
      />
    </Stack.Navigator>
  );
}

export default OnboardingStack;
