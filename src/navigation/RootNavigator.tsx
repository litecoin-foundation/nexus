import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import OnboardingStack from './OnboardingStack';
import Loading from '../screens/Loading';
import AuthStack from './AuthStack';
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
          name="NewWalletStack"
          component={NewWalletStack}
          options={{headerTransparent: true, headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigator;
