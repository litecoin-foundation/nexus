import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createDrawerNavigator,
  useDrawerStatus,
} from '@react-navigation/drawer';
import type {DrawerContentComponentProps} from '@react-navigation/drawer';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenSizeContext} from '../../context/screenSize';
import HeaderButton from '../../components/Buttons/HeaderButton';

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

const isHiddenDrawerItem = (style: object | undefined) =>
  !!style && 'display' in style && style.display === 'none';

let menuChoiceMade = false;

const DrawerContent = (props: DrawerContentComponentProps) => {
  const insets = useSafeAreaInsets();
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getDrawerStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );
  const {state, navigation, descriptors} = props;
  const drawerStatus = useDrawerStatus();
  const [choiceMade, setChoiceMade] = useState(menuChoiceMade);

  useEffect(() => {
    if (drawerStatus !== 'open') {
      return;
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.getParent()?.goBack();
        return true;
      },
    );
    return () => subscription.remove();
  }, [drawerStatus, navigation]);

  const items = state.routes.filter(
    route =>
      !isHiddenDrawerItem(
        descriptors[route.key].options.drawerItemStyle as object | undefined,
      ),
  );

  return (
    <LinearGradient
      style={styles.menu}
      colors={['#F2F8FD', '#F2F8FD']}>
      <View style={styles.menuHeader}>
        <HeaderButton
          onPress={() => navigation.getParent()?.goBack()}
          imageSource={require('../../assets/images/back-icon.png')}
          leftPadding
        />
        <Text style={styles.menuTitle}>Swap</Text>
      </View>
      <ScrollView
        contentContainerStyle={{paddingBottom: insets.bottom + 16}}
        showsVerticalScrollIndicator={false}>
        {items.map(route => {
          const focused =
            choiceMade && state.routes[state.index]?.key === route.key;
          const label = descriptors[route.key].options.title ?? route.name;
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.cell}
              onPress={() => {
                menuChoiceMade = true;
                setChoiceMade(true);
                navigation.navigate(route.name);
                navigation.closeDrawer();
              }}>
              <Text style={[styles.cellTitle, focused ? styles.cellTitleActive : null]}>
                {label}
              </Text>
              <Image source={require('../../assets/images/forward.png')} />
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={styles.cell}
          onPress={() => navigation.getParent()?.goBack()}>
          <Text style={styles.cellTitle}>Back to Nexus</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const MbsxNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  // Read at mount only: a change while mounted would run leave() and start()
  // back to back, and start() would see the core still up and do nothing.
  const torEnabled = useAppSelector(state => state.settings.torEnabled);
  const torRef = useRef(torEnabled);
  torRef.current = torEnabled;

  useEffect(() => {
    let left = false;
    menuChoiceMade = false;
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

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  return (
    <View style={flexOne}>
      <BridgeStatus />
      <Drawer.Navigator
        initialRouteName="CreateSwap"
        defaultStatus="closed"
        backBehavior="history"
        drawerContent={DrawerContent}
        screenOptions={{
          drawerType: 'front',
          drawerStyle: {
            width: SCREEN_WIDTH,
            backgroundColor: '#F7F7F7',
          },
          overlayColor: 'transparent',
          sceneStyle: {backgroundColor: '#F2F8FD'},
          headerStyle: {
            backgroundColor: '#1162E6',
            height: SCREEN_HEIGHT * 0.13,
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'left',
          headerTitleStyle: {
            fontFamily: 'Satoshi Variable',
            fontWeight: '700',
            fontSize: SCREEN_HEIGHT * 0.026,
            color: '#fff',
          },
        }}>
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

const flexOne = {flex: 1, backgroundColor: '#F2F8FD'} as const;

const getDrawerStyles = (_screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    menu: {
      flex: 1,
      backgroundColor: '#F7F7F7',
    },
    menuHeader: {
      height: screenHeight * 0.13,
      backgroundColor: '#1162E6',
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingBottom: screenHeight * 0.012,
    },
    menuTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.026,
      fontWeight: '700',
      marginStart: 11,
      marginBottom: screenHeight * 0.004,
    },
    cell: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: 25,
      paddingRight: 25,
      height: 50,
      borderTopWidth: 1,
      borderColor: '#9797974d',
      backgroundColor: 'white',
    },
    cellTitle: {
      fontFamily: 'Satoshi Variable',
      fontWeight: '700',
      color: '#484859',
      fontSize: 14,
    },
    cellTitleActive: {
      color: '#1162E6',
    },
  });

export default MbsxNavigator;
