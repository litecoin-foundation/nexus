import React, {useEffect, useRef} from 'react';
import {View} from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from '@react-navigation/drawer';
import type {DrawerContentComponentProps} from '@react-navigation/drawer';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  getInfo,
  onBridgeState,
  onMessage,
  reconcileNow,
  revokeOpenRequests,
  setSectionMounted,
  start,
  stopIfIdle,
} from './adapter';
import {readConfig} from './adapter/config';
import {pushMessage, setConnected, setError, setRunning} from './mbsxSlice';
import BridgeStatus from './components/BridgeStatus';
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

const revokeOnExit = async () => {
  const config = await readConfig();
  if (!config?.revoke_open_requests_on_exit) {
    return;
  }
  try {
    const revoked = await revokeOpenRequests();
    if (revoked.length > 0) {
      console.log(`mbsx revoked ${revoked.length} open request(s) on exit`);
    }
  } catch (e) {
    console.warn('mbsx could not revoke open requests:', (e as Error).message);
  }
};

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
  // Read at mount only: a change while mounted would run leave() and start()
  // back to back, and start() would see the core still up and do nothing.
  const torEnabled = useAppSelector(state => state.settings.torEnabled);
  const torRef = useRef(torEnabled);
  torRef.current = torEnabled;

  useEffect(() => {
    let left = false;
    setSectionMounted(true);

    // Revoked first: the requests' coins are what would keep the core up.
    const leave = () => {
      setSectionMounted(false);
      revokeOnExit()
        .then(stopIfIdle)
        .then(stopped => {
          if (stopped) {
            dispatch(setRunning(false));
          }
        });
    };

    dispatch(setError(null));
    start(torRef.current)
      .then(() => {
        dispatch(setRunning(true));
        // Unmounted while starting: nothing else will call this now.
        if (left) {
          leave();
          return;
        }
        // A wake may have ended a swap with lnd down; its leases wait for this.
        void reconcileNow();
      })
      .catch((error: Error) => dispatch(setError(error.message)));

    return () => {
      left = true;
      leave();
    };
  }, [dispatch]);

  useEffect(() => {
    const subscription = onMessage((payload: {type: string; data: string}) => {
      if (payload.type === 'event') {
        try {
          if (JSON.parse(payload.data).visible === false) {
            return;
          }
        } catch {
          // Unreadable, so shown.
        }
      }
      dispatch(pushMessage(String(payload.data)));
    });
    return () => subscription.remove();
  }, [dispatch]);

  // Seeded first: the event fires only on a change, never on the current state.
  useEffect(() => {
    dispatch(setConnected(getInfo()?.connected === true));
    const subscription = onBridgeState((connected: boolean) =>
      dispatch(setConnected(connected)),
    );
    return () => subscription.remove();
  }, [dispatch]);

  return (
    <View style={flexOne}>
      <BridgeStatus />
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
    </View>
  );
};

const flexOne = {flex: 1} as const;

export default MbsxNavigator;
