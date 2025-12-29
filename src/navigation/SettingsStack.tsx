import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Settings, {
  SettingsNavigationOptions,
} from '../screens/Settings/Settings';
import Explorer, {
  ExplorerNavigationOptions,
} from '../screens/Settings/Explorer';
import Language, {
  LanguageNavigationOptions,
} from '../screens/Settings/Language';
import ChangePincode from '../screens/Settings/ChangePincode';
import Seed, {SeedNavigationOptions} from '../screens/Settings/Seed';
import RootKey, {RootKeyNavigationOptions} from '../screens/Settings/RootKey';
import About, {AboutNavigationOptions} from '../screens/Settings/About';
import Currency, {
  CurrencyNavigationOptions,
} from '../screens/Settings/Currency';
import Scan, {ScanNavigationOptions} from '../screens/Scan';
import Import, {ImportNavigationOptions} from '../screens/Settings/Import';
import RecoverLitewallet, {
  RecoverLitewalletNavigationOptions,
} from '../screens/Settings/RecoverLitewallet';
import ImportSuccess, {
  ImportSuccessNavigationOptions,
} from '../screens/Settings/ImportSuccess';
import ImportDeeplink, {
  ImportDeeplinkNavigationOptions,
} from '../screens/Settings/ImportDeeplink';
import Support, {SupportNavigationOptions} from '../screens/Settings/Support';
import ResetWallet, {
  ResetWalletNavigationOptions,
} from '../screens/Settings/ResetWallet';
import RescanWallet, {
  RescanWalletNavigationOptions,
} from '../screens/Settings/RescanWallet';
import TestPayment, {
  TestPaymentNavigationOptions,
} from '../screens/Settings/TestPayment';
import Products from '../screens/Settings/Products';
import Tor, {TorNavigationOptions} from '../screens/Settings/Tor';
import ExportElectrum, {
  ExportElectrumNavigationOptions,
} from '../screens/Settings/ExportElectrum';
import {SettingsStackParamList} from './types';

const Stack = createStackNavigator<SettingsStackParamList>();

function SettingsStack() {
  return (
    <Stack.Navigator
      initialRouteName="Settings"
      screenOptions={{
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontWeight: 'bold',
          color: 'white',
        },
        headerTransparent: true,
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: 'white',
      }}>
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={({navigation}) => SettingsNavigationOptions(navigation)}
      />
      <Stack.Screen name="ChangePincode" component={ChangePincode} />
      <Stack.Screen
        name="Seed"
        component={Seed}
        options={({navigation}) => SeedNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="RootKey"
        component={RootKey}
        options={({navigation}) => RootKeyNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="About"
        component={About}
        options={({navigation}) => AboutNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="Currency"
        component={Currency}
        options={({navigation}) => CurrencyNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="Explorer"
        component={Explorer}
        options={({navigation}) => ExplorerNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="Language"
        component={Language}
        options={({navigation}) => LanguageNavigationOptions(navigation)}
      />
      <Stack.Screen name="Products" component={Products} />
      <Stack.Screen
        name="Scan"
        component={Scan}
        options={({navigation}) => ScanNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="Import"
        component={Import}
        options={({navigation}) => ImportNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="ImportSuccess"
        component={ImportSuccess}
        options={() => ImportSuccessNavigationOptions()}
      />
      <Stack.Screen
        name="ImportDeeplink"
        component={ImportDeeplink}
        options={() => ImportDeeplinkNavigationOptions()}
      />
      <Stack.Screen
        name="RecoverLitewallet"
        component={RecoverLitewallet}
        options={({navigation}) =>
          RecoverLitewalletNavigationOptions(navigation)
        }
      />
      <Stack.Screen
        name="Support"
        component={Support}
        options={({navigation}) => SupportNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="ResetWallet"
        component={ResetWallet}
        options={({navigation}) => ResetWalletNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="RescanWallet"
        component={RescanWallet}
        options={({navigation}) => RescanWalletNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="TestPayment"
        component={TestPayment}
        options={({navigation}) => TestPaymentNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="Tor"
        component={Tor}
        options={({navigation}) => TorNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="ExportElectrum"
        component={ExportElectrum}
        options={({navigation}) => ExportElectrumNavigationOptions(navigation)}
      />
    </Stack.Navigator>
  );
}

export default SettingsStack;
