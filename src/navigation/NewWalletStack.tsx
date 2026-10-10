import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import {navigationOptions} from '../screens/NewMain';
import MainStack from './MainStack';
import Scan, {ScanNavigationOptions} from '../screens/Scan';
import SettingsStack from './SettingsStack';
import NexusShopStack from './NexusShopStack';
import WebPage, {WebPageNavigationOptions} from '../screens/WebPage';
import ConfirmSend from '../screens/Wallet/ConfirmSend';
import SuccessSend, {
  SuccessSendNavigationOptions,
} from '../screens/Wallet/SuccessSend';
import ConfirmBuy from '../screens/Buy/ConfirmBuy';
import ConfirmBuyOnramper from '../screens/Buy/ConfirmBuyOnramper';
import AlertsStack from './AlertsStack';
import ConfirmSell from '../screens/Buy/ConfirmSell';
import ConfirmSellOnramper from '../screens/Buy/ConfirmSellOnramper';
import {NewWalletStackParamList} from './types';
import {ScreenHeaderNavigationOptions} from '../components/ScreenHeader';
import ConfirmConvert, {
  ConfirmConvertNavigationOptions,
} from '../screens/Wallet/ConfirmConvert';
import SuccessConvert, {
  SuccessConvertNavigationOptions,
} from '../screens/Wallet/SuccessConvert';

const Stack = createStackNavigator<NewWalletStackParamList>();

function NewWalletStack(): React.JSX.Element {
  return (
    <Stack.Navigator initialRouteName="Main">
      <Stack.Screen
        name="Main"
        component={MainStack}
        options={() => navigationOptions()}
      />
      <Stack.Screen
        name="SettingsStack"
        component={SettingsStack}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="NexusShopStack"
        component={NexusShopStack}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AlertsStack"
        component={AlertsStack}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Scan"
        component={Scan}
        options={ScanNavigationOptions}
      />
      <Stack.Screen
        name="WebPage"
        component={WebPage}
        options={WebPageNavigationOptions}
      />
      <Stack.Screen
        name="ConfirmSend"
        component={ConfirmSend}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="SuccessSend"
        component={SuccessSend}
        options={({}) => SuccessSendNavigationOptions()}
      />
      <Stack.Screen
        name="ConfirmBuy"
        component={ConfirmBuy}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="ConfirmBuyOnramper"
        component={ConfirmBuyOnramper}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="ConfirmSell"
        component={ConfirmSell}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="ConfirmSellOnramper"
        component={ConfirmSellOnramper}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="ConfirmConvert"
        component={ConfirmConvert}
        options={({navigation}) => ConfirmConvertNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="SuccessConvert"
        component={SuccessConvert}
        options={({}) => SuccessConvertNavigationOptions()}
      />
    </Stack.Navigator>
  );
}

export default NewWalletStack;
