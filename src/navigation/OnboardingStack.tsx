import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Initial from '../screens/Onboarding/Initial';
import InitialWithSeed from '../screens/Onboarding/InitialWithSeed';
import Pin from '../screens/Onboarding/Pin';
import RecoverPin from '../screens/Onboarding/RecoverPin';
import Generate from '../screens/Onboarding/Generate';
import Verify from '../screens/Onboarding/Verify';
import Recover from '../screens/Onboarding/Recover';
import Biometric from '../screens/Onboarding/Biometric';
import Welcome, {WelcomeNavigationOptions} from '../screens/Onboarding/Welcome';
import {ScreenHeaderNavigationOptions} from '../components/ScreenHeader';
import {OnboardingStackParamList} from './types';

const Stack = createStackNavigator<OnboardingStackParamList>();

function OnboardingStack() {
  return (
    <Stack.Navigator
      initialRouteName="Initial"
      screenOptions={{
        headerTitleAlign: 'center',
        headerTransparent: true,
        headerBackButtonDisplayMode: 'minimal',
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
      <Stack.Screen
        name="Pin"
        component={Pin}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="RecoverPin"
        component={RecoverPin}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="Generate"
        component={Generate}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="Verify"
        component={Verify}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="Recover"
        component={Recover}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="Biometric"
        component={Biometric}
        options={ScreenHeaderNavigationOptions}
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
