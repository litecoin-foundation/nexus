import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {navigationRef} from './NavigationService';

import OnboardingStack from './OnboardingStack';
import Loading from '../screens/Loading';
import AuthStack from './AuthStack';
import Unlocking from '../screens/Unlocking';
import NewWalletStack from './NewWalletStack';
import {RootStackParamList} from './types';

const Stack = createStackNavigator<RootStackParamList>();

const Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#000000',
  },
};

const Linking = {
  prefixes: ['litecoin://', 'litecoin:'],
  config: {
    screens: {
      Loading: '*', // catch all
    },
  },
};

function RootNavigator() {
  return (
    <NavigationContainer
      ref={navigationRef}
      theme={Theme}
      linking={Linking}
      navigationInChildEnabled={true}>
      <Stack.Navigator initialRouteName="Loading">
        <Stack.Screen
          name="Loading"
          component={Loading}
          options={{
            headerTransparent: true,
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: 'white',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="AuthStack"
          component={AuthStack}
          options={{
            headerTransparent: true,
            headerShown: false,
            animation: 'none',
          }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingStack}
          options={{
            headerTransparent: true,
            headerShown: false,
            animation: 'none',
          }}
        />
        <Stack.Screen
          name="Unlocking"
          component={Unlocking}
          options={{
            headerShown: false,
            gestureEnabled: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="NewWalletStack"
          component={NewWalletStack}
          options={{
            headerTransparent: true,
            headerShown: false,
            animation: 'fade',
            detachPreviousScreen: false,
            cardStyle: {backgroundColor: '#0F55C7'},
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigator;
