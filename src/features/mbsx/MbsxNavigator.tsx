import React, {useEffect} from 'react';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from '@react-navigation/drawer';
import type {DrawerContentComponentProps} from '@react-navigation/drawer';

import {useAppDispatch} from '../../store/hooks';
import {onMessage, setSectionMounted, start, stopIfIdle} from './adapter';
import {pushMessage, setError, setRunning} from './mbsxSlice';
import CreateSwap from './screens/CreateSwap';
import SwapList from './screens/SwapList';
import SwapDetail from './screens/SwapDetail';
import RequestList from './screens/RequestList';
import RequestDetail from './screens/RequestDetail';
import AddressList from './screens/AddressList';
import CoinAddresses from './screens/CoinAddresses';
import MbsxSettings from './screens/MbsxSettings';
import MbsxDebug from './screens/MbsxDebug';
import type {MbsxDrawerParamList} from './types';

const Drawer = createDrawerNavigator<MbsxDrawerParamList>();

// Detail screens are reachable only from their list, so they stay out of the
// drawer itself.
const hidden = {drawerItemStyle: {display: 'none' as const}};

const DrawerContent = (props: DrawerContentComponentProps) => (
  <DrawerContentScrollView {...props}>
    <DrawerItemList {...props} />
    <DrawerItem
      label="Back to wallet"
      onPress={() => props.navigation.getParent()?.goBack()}
    />
  </DrawerContentScrollView>
);

const MbsxNavigator: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let left = false;
    setSectionMounted(true);

    const leave = () => {
      setSectionMounted(false);
      stopIfIdle().then(stopped => {
        if (stopped) {
          dispatch(setRunning(false));
        }
      });
    };

    dispatch(setError(null));
    start()
      .then(() => {
        dispatch(setRunning(true));
        // Unmounted while starting: nothing else will call this now.
        if (left) {
          leave();
        }
      })
      .catch((error: Error) => dispatch(setError(error.message)));

    return () => {
      left = true;
      leave();
    };
  }, [dispatch]);

  useEffect(() => {
    const subscription = onMessage((payload: {type: string; data: string}) =>
      dispatch(pushMessage(String(payload.data))),
    );
    return () => subscription.remove();
  }, [dispatch]);

  return (
    <Drawer.Navigator
      initialRouteName="SwapList"
      backBehavior="history"
      drawerContent={DrawerContent}>
      <Drawer.Screen
        name="CreateSwap"
        component={CreateSwap}
        options={{title: 'New swap'}}
      />
      <Drawer.Screen
        name="SwapList"
        component={SwapList}
        options={{title: 'Swaps'}}
      />
      <Drawer.Screen
        name="SwapDetail"
        component={SwapDetail}
        options={{title: 'Swap', ...hidden}}
      />
      <Drawer.Screen
        name="RequestList"
        component={RequestList}
        options={{title: 'Requests'}}
      />
      <Drawer.Screen
        name="RequestDetail"
        component={RequestDetail}
        options={{title: 'Request', ...hidden}}
      />
      <Drawer.Screen
        name="AddressList"
        component={AddressList}
        options={{title: 'Addresses'}}
      />
      <Drawer.Screen
        name="CoinAddresses"
        component={CoinAddresses}
        options={{title: 'Addresses', ...hidden}}
      />
      <Drawer.Screen
        name="MbsxSettings"
        component={MbsxSettings}
        options={{title: 'Settings'}}
      />
      <Drawer.Screen
        name="MbsxDebug"
        component={MbsxDebug}
        options={{title: 'Debug'}}
      />
    </Drawer.Navigator>
  );
};

export default MbsxNavigator;
