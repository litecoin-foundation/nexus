import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Main, {navigationOptions} from '../screens/Main';
import Scan, {ScanNavigationOptions} from '../screens/Scan';
import SettingsStack from './SettingsStack';
import NexusShopStack from './NexusShopStack';
import WebPage, {WebPageNavigationOptions} from '../screens/WebPage';
import ConfirmSend, {
  ConfirmSendNavigationOptions,
} from '../screens/Wallet/ConfirmSend';
import SuccessSend, {
  SuccessSendNavigationOptions,
} from '../screens/Wallet/SuccessSend';
import ConfirmBuy, {
  ConfirmBuyNavigationOptions,
} from '../screens/Buy/ConfirmBuy';
import ConfirmBuyOnramper, {
  ConfirmBuyOnramperNavigationOptions,
} from '../screens/Buy/ConfirmBuyOnramper';
import AlertsStack from './AlertsStack';
import ConfirmSell, {
  ConfirmSellNavigationOptions,
} from '../screens/Buy/ConfirmSell';
import ConfirmSellOnramper, {
  ConfirmSellOnramperNavigationOptions,
} from '../screens/Buy/ConfirmSellOnramper';
import SearchTransaction, {
  SearchTransactionNavigationOptions,
} from '../screens/Wallet/SearchTransaction';
import {NewWalletStackParamList} from './types';
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
        component={Main}
        options={({navigation}) => navigationOptions(navigation)}
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
        options={({navigation}) => ScanNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="WebPage"
        component={WebPage}
        options={({navigation}) => WebPageNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="ConfirmSend"
        component={ConfirmSend}
        options={({navigation}) => ConfirmSendNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="SuccessSend"
        component={SuccessSend}
        options={({}) => SuccessSendNavigationOptions()}
      />
      <Stack.Screen
        name="ConfirmBuy"
        component={ConfirmBuy}
        options={({navigation}) => ConfirmBuyNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="ConfirmBuyOnramper"
        component={ConfirmBuyOnramper}
        options={({navigation}) =>
          ConfirmBuyOnramperNavigationOptions(navigation)
        }
      />
      <Stack.Screen
        name="ConfirmSell"
        component={ConfirmSell}
        options={({navigation}) => ConfirmSellNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="ConfirmSellOnramper"
        component={ConfirmSellOnramper}
        options={({navigation}) =>
          ConfirmSellOnramperNavigationOptions(navigation)
        }
      />
      <Stack.Screen
        name="SearchTransaction"
        component={SearchTransaction}
        options={({navigation}) =>
          SearchTransactionNavigationOptions(navigation)
        }
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
