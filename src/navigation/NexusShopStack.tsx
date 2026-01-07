import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import GiftCardShop, {
  GiftCardShopNavigationOptions,
} from '../screens/GiftCardShop/GiftCardShopDeprecated';
import VerifyOTP, {
  VerifyOTPNavigationOptions,
} from '../screens/GiftCardShop/VerifyOTP';
import OTPVerified from '../screens/GiftCardShop/OTPVerified';

export type NexusShopStackParamList = {
  GiftCardShop: undefined;
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
    <Stack.Navigator initialRouteName="GiftCardShop">
      <Stack.Screen
        name="GiftCardShop"
        component={GiftCardShop}
        options={({navigation}) => GiftCardShopNavigationOptions(navigation)}
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
