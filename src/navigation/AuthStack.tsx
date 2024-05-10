import React from 'react';
import {StyleSheet, View} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';

import Auth from '../screens/Auth/Auth';
import Forgot from '../screens/Auth/Forgot';
import ChangePincode from '../screens/Settings/ChangePincode';
import WhiteButton from '../components/Buttons/WhiteButton';

const Stack = createStackNavigator();

function AuthStack(): React.JSX.Element {
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
          headerRight: () => (
            <View style={styles.headerRight}>
              <WhiteButton
                value="FORGOT?"
                small={true}
                onPress={() => navigation.navigate('Forgot')}
                active={true}
              />
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="Forgot"
        component={Forgot}
        options={Forgot.navigationOptions}
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

const styles = StyleSheet.create({
  headerRight: {
    paddingRight: 18,
  },
});

export default AuthStack;
