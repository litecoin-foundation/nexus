import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import OnboardingStack from './OnboardingStack';
import Loading from '../screens/Loading';
import AuthStack from './AuthStack';
import AppStack from './AppStack';

const Stack = createStackNavigator();

const Theme = {
  ...DefaultTheme,
  colors: {
    background: '#000000',
  },
};

const Linking = {
  prefixes: ['litecoin://', 'litecoin:'],
  config: {},
};

function RootNavigator() {
  return (
    <NavigationContainer theme={Theme} linking={Linking}>
      <Stack.Navigator initialRouteName="Loading">
        <Stack.Screen
          name="Loading"
          component={Loading}
          options={{
            headerTransparent: true,
            headerBackTitleVisible: false,
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
            animationEnabled: false,
          }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingStack}
          options={{
            headerTransparent: true,
            headerShown: false,
            animationEnabled: false,
          }}
        />
        <Stack.Screen
          name="AppStack"
          component={AppStack}
          options={{headerTransparent: true, headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigator;
