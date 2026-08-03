import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Settings from '../screens/Settings/Settings';
import Explorer from '../screens/Settings/Explorer';
import Language from '../screens/Settings/Language';
import ChangePincode from '../screens/Settings/ChangePincode';
import Seed from '../screens/Settings/Seed';
import RootKey from '../screens/Settings/RootKey';
import About from '../screens/Settings/About';
import Currency from '../screens/Settings/Currency';
import Scan, {ScanNavigationOptions} from '../screens/Scan';
import Import from '../screens/Settings/Import';
import RecoverLitewallet from '../screens/Settings/RecoverLitewallet';
import ImportSuccess, {
  ImportSuccessNavigationOptions,
} from '../screens/Settings/ImportSuccess';
import ImportDeeplink, {
  ImportDeeplinkNavigationOptions,
} from '../screens/Settings/ImportDeeplink';
import Support, {SupportNavigationOptions} from '../screens/Settings/Support';
import ResetWallet from '../screens/Settings/ResetWallet';
import RescanWallet from '../screens/Settings/RescanWallet';
import TestPayment from '../screens/Settings/TestPayment';
import TestMigration from '../screens/Settings/TestMigration';
import Products from '../screens/Settings/Products';
import Tor from '../screens/Settings/Tor';
import ExportElectrum from '../screens/Settings/ExportElectrum';
import {ScreenHeaderNavigationOptions} from '../components/ScreenHeader';
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
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="ChangePincode"
        component={ChangePincode}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="Seed"
        component={Seed}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="RootKey"
        component={RootKey}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="About"
        component={About}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="Currency"
        component={Currency}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="Explorer"
        component={Explorer}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="Language"
        component={Language}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="Products"
        component={Products}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="Scan"
        component={Scan}
        options={ScanNavigationOptions}
      />
      <Stack.Screen
        name="Import"
        component={Import}
        options={ScreenHeaderNavigationOptions}
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
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="Support"
        component={Support}
        options={SupportNavigationOptions}
      />
      <Stack.Screen
        name="ResetWallet"
        component={ResetWallet}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="RescanWallet"
        component={RescanWallet}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="TestPayment"
        component={TestPayment}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="TestMigration"
        component={TestMigration}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="Tor"
        component={Tor}
        options={ScreenHeaderNavigationOptions}
      />
      <Stack.Screen
        name="ExportElectrum"
        component={ExportElectrum}
        options={ScreenHeaderNavigationOptions}
      />
    </Stack.Navigator>
  );
}

export default SettingsStack;
