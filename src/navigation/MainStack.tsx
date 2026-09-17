import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {ScreenSizeContext} from '../context/screenSize';
import NewMain from '../screens/NewMain';
import NexusShop from '../screens/NexusShop';
import SearchTransaction from '../screens/Wallet/SearchTransaction';
import ShopAccountDrawerContent from '../components/Drawers/ShopAccountDrawerContent';
import GlassChrome from '../components/GlassChrome';
import {GlassChromeProvider} from '../components/glassChromeFeeds';
import {CardUnderlayProvider} from '../components/cardUnderlay';
import {MainStackParamList, ShopDrawerParamList} from './types';

// The Main route: a transparent stack so the shop and the transaction search
// can present over the LIVE wallet — each plays its own hand-off against it,
// so both must stay attached and visible (a drawer or plain stack hides its
// blurred scene). The glass tab bar + canvas render once here, above every
// screen; pushed NewWalletStack screens cover the whole route, chrome
// included.

const Stack = createStackNavigator<MainStackParamList>();
const Drawer = createDrawerNavigator<ShopDrawerParamList>();

// the account drawer belongs to the shop alone, so it wraps just that screen
function ShopDrawer(): React.JSX.Element {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerType: 'slide',
        drawerStyle: {
          width: SCREEN_WIDTH * 0.7,
          borderTopLeftRadius: SCREEN_HEIGHT * 0.012,
          borderBottomLeftRadius: SCREEN_HEIGHT * 0.012,
          backgroundColor: 'white',
        },
        swipeEnabled: false, // Only open via button
        overlayColor: 'rgba(17, 74, 175, 0.8)',
        sceneStyle: {
          backgroundColor: 'transparent',
        },
      }}
      drawerContent={props => <ShopAccountDrawerContent {...props} />}>
      <Drawer.Screen name="NexusShopScreen" component={NexusShop} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  transparentCard: {
    backgroundColor: 'transparent',
  },
});

// The screen drives its own hand-off; the navigator must not animate, dim,
// or detach the wallet underneath.
const overLiveWallet: StackNavigationOptions = {
  presentation: 'transparentModal',
  animation: 'none',
  cardOverlayEnabled: false,
  detachPreviousScreen: false,
  cardStyle: styles.transparentCard,
  gestureEnabled: false,
};

function MainStack(): React.JSX.Element {
  return (
    <CardUnderlayProvider>
      <GlassChromeProvider>
        <View style={styles.host}>
          <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen name="MainScreen" component={NewMain} />
            <Stack.Screen
              name="NexusShop"
              component={ShopDrawer}
              options={overLiveWallet}
            />
            <Stack.Screen
              name="SearchTransaction"
              component={SearchTransaction}
              options={overLiveWallet}
            />
          </Stack.Navigator>
          <GlassChrome />
        </View>
      </GlassChromeProvider>
    </CardUnderlayProvider>
  );
}

export default MainStack;
