import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import SignUp, {SignUpNavigationOptions} from '../screens/GiftCardShop/SignUp';
import VerifyOTP, {
  VerifyOTPNavigationOptions,
} from '../screens/GiftCardShop/VerifyOTP';
import OTPVerified from '../screens/GiftCardShop/OTPVerified';
import PurchaseFormScreen, {
  PurchaseFormScreenOptions,
} from '../screens/GiftCardShop/PurchaseFormScreen';
import PayForGiftCardScreen, {
  PayForGiftCardScreenOptions,
} from '../screens/GiftCardShop/PayForGiftCardScreen';
import {Brand, InitiatePurchaseResponseData} from '../services/giftcards';

export type NexusShopStackParamList = {
  GiftCardShop: undefined;
  SignUp: undefined;
  VerifyOTP:
    | {
        otpCode?: string;
      }
    | undefined;
  OTPVerified: undefined;
  PurchaseForm: {
    brand: Brand;
    initialAmount?: number;
    currency: string;
    onPaymentSuccess: (txid: string) => void;
  };
  PayForGiftCard: {
    initiateResponse: InitiatePurchaseResponseData;
    onPaymentSuccess: (txid: string) => void;
  };
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
      <Stack.Screen
        name="PurchaseForm"
        component={PurchaseFormScreen}
        options={({navigation}) => PurchaseFormScreenOptions(navigation)}
      />
      <Stack.Screen
        name="PayForGiftCard"
        component={PayForGiftCardScreen}
        options={({navigation}) => PayForGiftCardScreenOptions(navigation)}
      />
    </Stack.Navigator>
  );
}

export default NexusShopStack;
