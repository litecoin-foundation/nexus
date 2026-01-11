import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import SignUp, {SignUpNavigationOptions} from '../screens/GiftCardShop/SignUp';
import VerifyOTP, {
  VerifyOTPNavigationOptions,
} from '../screens/GiftCardShop/VerifyOTP';
import OTPVerified from '../screens/GiftCardShop/OTPVerified';

export type NexusShopStackParamList = {
  GiftCardShop: undefined;
  SignUp: undefined;
  VerifyOTP:
    | {
        otpCode?: string;
      }
    | undefined;
  OTPVerified: undefined;
};

const Stack = createStackNavigator<NexusShopStackParamList>();

function NexusShopStack(): React.JSX.Element {
  return (
    <Stack.Navigator initialRouteName="SignUp">
      <Stack.Screen
        name="SignUp"
        component={SignUp}
        options={({navigation}) => SignUpNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="VerifyOTP"
        component={VerifyOTP}
        options={({navigation}) => VerifyOTPNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="OTPVerified"
        component={OTPVerified}
        options={{
          headerShown: false,
          gestureEnabled: false,
          gestureResponseDistance: 0,
        }}
      />
    </Stack.Navigator>
  );
}

export default NexusShopStack;
