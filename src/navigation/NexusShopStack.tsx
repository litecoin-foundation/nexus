import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import GiftCardShop, {navigationOptions as GiftCardShopNavigationOptions} from '../screens/GiftCardShop/GiftCardShop';
import VerifyOTP, {navigationOptions as VerifyOTPNavigationOptions} from '../screens/GiftCardShop/VerifyOTP';

export type NexusShopStackParamList = {
  GiftCardShop: undefined;
  VerifyOTP: {
    otpCode?: string;
  };
};

const Stack = createStackNavigator<NexusShopStackParamList>();


function NexusShopStack(): React.JSX.Element {
  return (
    <Stack.Navigator initialRouteName="GiftCardShop">
      <Stack.Screen
        name="GiftCardShop"
        component={GiftCardShop}
        options={GiftCardShopNavigationOptions}
      />
      <Stack.Screen
        name="VerifyOTP"
        component={VerifyOTP}
        options={VerifyOTPNavigationOptions}
      />
    </Stack.Navigator>
  );
}

export default NexusShopStack;
