import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import OnboardingStack from './OnboardingStack';
import Loading from '../screens/Loading';
import AuthScreen from '../screens/Auth';
import AppStack from './AppStack';

const Stack = createStackNavigator();

const Theme = {
  ...DefaultTheme,
  colors: {
    background: '#000000',
  },
};

function RootNavigator() {
  return (
    <NavigationContainer theme={Theme}>
      <Stack.Navigator initialRouteName="Loading">
        <Stack.Screen
          name="Loading"
          component={Loading}
          options={Loading.navigationOptions}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={AuthScreen.navigationOptions}
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
