import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import GiftCardShop, {
  GiftCardShopNavigationOptions,
} from '../screens/GiftCardShop/GiftCardShop';
import VerifyOTP, {
  VerifyOTPNavigationOptions,
} from '../screens/GiftCardShop/VerifyOTP';

export type NexusShopStackParamList = {
  GiftCardShop: undefined;
  VerifyOTP:
    | {
        otpCode?: string;
      }
    | undefined;
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
    </Stack.Navigator>
  );
}

export default NexusShopStack;
