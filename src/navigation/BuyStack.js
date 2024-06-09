import React from 'react';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';

import Confirm from '../screens/Buy/ConfirmBuy';
import WebPage from '../screens/WebPage';
import History from '../screens/Buy/BuyHistory';

const Stack = createStackNavigator();

// function ConfirmWebPageModalStack() {
//   return (
//     <Stack.Navigator
//       mode="modal"
//       initialRouteName="Confirm"
//       screenOptions={{
//         headerTitleAlign: 'center',
//       }}>
//       <Stack.Screen
//         name="Confirm"
//         component={Confirm}
//         options={Confirm.navigationOptions}
//       />
//       <Stack.Screen
//         name="WebPage"
//         component={WebPage}
//         options={{
//           ...TransitionPresets.ModalPresentationIOS,
//           cardOverlayEnabled: true,
//           headerTitleStyle: {
//             fontWeight: 'bold',
//             color: 'white',
//           },
//           headerTitle: '',
//           headerTransparent: true,
//           headerBackTitleVisible: false,
//           headerTintColor: 'white',
//         }}
//       />
//     </Stack.Navigator>
//   );
// }

function BuyStack() {
  return (
    <Stack.Navigator
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
      {/* <Stack.Screen
        name="ConfirmStack"
        component={ConfirmWebPageModalStack}
        options={{headerShown: false}}
      /> */}
      {/* <Stack.Screen
        name="History"
        component={History}
        options={History.navigationOptions}
      /> */}
    </Stack.Navigator>
  );
}

export default BuyStack;
