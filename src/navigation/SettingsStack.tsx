import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Settings, {
  SettingsNavigationOptions,
} from '../screens/Settings/Settings';
import Explorer from '../screens/Settings/Explorer';
import ChangePincode from '../screens/Settings/ChangePincode';
import Seed, {SeedNavigationOptions} from '../screens/Settings/Seed';
import About from '../screens/Settings/About';
import Currency from '../screens/Settings/Currency';
import Scan, {ScanNavigationOptions} from '../screens/Scan';
import Import, {ImportNavigationOptions} from '../screens/Settings/Import';
import RecoverLitewallet, {
  RecoverLitewalletNavigationOptions,
} from '../screens/Settings/RecoverLitewallet';
import ImportSuccess, {
  ImportSuccessNavigationOptions,
} from '../screens/Settings/ImportSuccess';

const Stack = createStackNavigator();

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
        headerBackTitleVisible: false,
        headerTintColor: 'white',
      }}>
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={({navigation}) => SettingsNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="ChangePincode"
        component={ChangePincode}
        options={ChangePincode.navigationOptions}
      />
      <Stack.Screen
        name="Seed"
        component={Seed}
        options={({navigation}) => SeedNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="About"
        component={About}
        options={About.navigationOptions}
      />
      <Stack.Screen
        name="Currency"
        component={Currency}
        options={{
          headerTitle: 'Currency',
          headerTitleStyle: {
            fontWeight: 'bold',
            color: 'white',
          },
          headerTransparent: true,
          headerBackTitleVisible: false,
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen
        name="Explorer"
        component={Explorer}
        options={{
          headerTitle: 'Select Default Explorer',
          headerTitleStyle: {
            fontWeight: 'bold',
            color: 'white',
          },
          headerTransparent: true,
          headerBackTitleVisible: false,
          headerTintColor: 'white',
        }}
      />
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
        name="RecoverLitewallet"
        component={RecoverLitewallet}
        options={({navigation}) =>
          RecoverLitewalletNavigationOptions(navigation)
        }
      />
      <Stack.Screen
        name="ImportSuccess"
        component={ImportSuccess}
        options={({navigation}) => ImportSuccessNavigationOptions(navigation)}
      />
    </Stack.Navigator>
  );
}

export default SettingsStack;
