import React, {useContext} from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {ScreenSizeContext} from '../context/screenSize';
import Main from '../screens/Main';
import ShopAccountDrawerContent from '../components/Drawers/ShopAccountDrawerContent';
import {MainDrawerParamList} from './types';

const Drawer = createDrawerNavigator<MainDrawerParamList>();

function MainDrawer(): React.JSX.Element {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  return (
    <Drawer.Navigator
      screenOptions={{
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
        sceneContainerStyle: {
          backgroundColor: 'transparent',
        },
      }}
      drawerContent={props => <ShopAccountDrawerContent {...props} />}>
      <Drawer.Screen
        name="MainScreen"
        component={Main}
        options={{headerShown: false}}
      />
    </Drawer.Navigator>
  );
}

export default MainDrawer;
