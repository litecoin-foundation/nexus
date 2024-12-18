import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Auth from '../screens/Auth/Auth';
import Forgot, {ForgotNavigationOptions} from '../screens/Auth/Forgot';
import ChangePincode from '../screens/Settings/ChangePincode';
import HeaderButton from '../components/Buttons/HeaderButton';

const Stack = createStackNavigator();

function AuthStack(): React.JSX.Element {
  const headerRightComponent = (navigation: any) => (
    <HeaderButton
      title="Forgot Pincode?"
      onPress={() => navigation.navigate('Forgot')}
      rightPadding={true}
    />
  );
  return (
    <Stack.Navigator
      initialRouteName="Auth"
      screenOptions={{
        headerTitleAlign: 'center',
        headerTransparent: true,
        headerBackTitleVisible: false,
        headerTintColor: 'white',
      }}>
      <Stack.Screen
        name="Auth"
        component={Auth}
        options={({navigation}) => ({
          headerTitle: 'Unlock Wallet',
          headerRight: () => headerRightComponent(navigation),
        })}
      />
      <Stack.Screen
        name="Forgot"
        component={Forgot}
        options={({navigation}) => ForgotNavigationOptions(navigation)}
      />
      <Stack.Screen
        name="ChangePincode"
        component={ChangePincode}
        options={{
          headerTitle: 'Change Wallet PIN',
          headerTitleStyle: {
            fontWeight: 'bold',
            color: 'white',
          },
          headerLeftContainerStyle: {
            paddingLeft: 15,
            marginRight: -15,
          },
        }}
      />
    </Stack.Navigator>
  );
}

export default AuthStack;
