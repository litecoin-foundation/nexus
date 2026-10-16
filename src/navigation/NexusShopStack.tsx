import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import SignUp from '../screens/GiftCardShop/SignUp';
import VerifyOTP from '../screens/GiftCardShop/VerifyOTP';
import OTPVerified from '../screens/GiftCardShop/OTPVerified';
import PurchaseFormScreen from '../screens/GiftCardShop/PurchaseFormScreen';
import PayForGiftCardScreen from '../screens/GiftCardShop/PayForGiftCardScreen';
import PendingGCDetails, {
  PendingGCDetailsNavigationOptions,
  PendingGCDetailsParams,
} from '../screens/GiftCardShop/PendingGCDetails';
import {ScreenHeaderNavigationOptions} from '../components/ScreenHeader';
import {Brand, InitiatePurchaseResponseData} from '../services/giftcards';

export type NexusShopStackParamList = {
  GiftCardShop: undefined;
  SignUp: {returnTo?: boolean} | undefined;
  VerifyOTP:
    | {
        otpCode?: string;
        returnTo?: boolean;
      }
    | undefined;
  OTPVerified: undefined;
  PurchaseForm: {
    brand: Brand;
    initialAmount?: number;
    onPaymentSuccess?: (txid: string) => void;
  };
  PayForGiftCard: {
    initiateResponse: InitiatePurchaseResponseData;
    brandName: string;
    onPaymentSuccess?: (txid: string) => void;
  };
  PendingGCDetails: PendingGCDetailsParams;
};

const Stack = createStackNavigator<NexusShopStackParamList>();

function NexusShopStack(): React.JSX.Element {
  return (
    <Stack.Navigator initialRouteName="SignUp">
      <Stack.Screen
        name="SignUp"
        component={SignUp}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="VerifyOTP"
        component={VerifyOTP}
        options={ScreenHeaderNavigationOptions}
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
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="PayForGiftCard"
        component={PayForGiftCardScreen}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="PendingGCDetails"
        component={PendingGCDetails}
        options={PendingGCDetailsNavigationOptions}
      />
    </Stack.Navigator>
  );
}

export default NexusShopStack;
