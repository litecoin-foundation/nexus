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
import type {
  DrawerContentComponentProps,
  DrawerHeaderProps,
} from '@react-navigation/drawer';
import {getHeaderTitle, Header} from '@react-navigation/elements';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenSizeContext} from '../../context/screenSize';
import HeaderButton from '../../components/Buttons/HeaderButton';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  getInfo,
  onBridgeState,
  onMessage,
  onStartup,
  reconcileNow,
  revokeOpenRequests,
  setSectionMounted,
  start,
  stopIfIdle,
  swapInProgress,
} from './adapter';
import {readConfig} from './adapter/config';
import {startRateFetcher} from './rates';
import {
  pushMessage,
  setConnected,
  setError,
  setRunning,
  setStartupStep,
  setTorApplied,
} from './mbsxSlice';
import BasicSwapMark from './components/BasicSwapMark';
import {readMenuMarks} from './menuMarks';
import AnchorDispute from './components/AnchorDispute';
import BridgeStatus from './components/BridgeStatus';
import MbsxMenuButton from './components/MbsxMenuButton';
import StartingScreen from './components/StartingScreen';
import TorIndicator from './components/TorIndicator';
import CreateSwap from './screens/CreateSwap';
import SwapList from './screens/SwapList';
import SwapDetail from './screens/SwapDetail';
import RequestList from './screens/RequestList';
import RequestDetail from './screens/RequestDetail';
import PayInDetail from './screens/PayInDetail';
import AddressList from './screens/AddressList';
import CoinAddresses from './screens/CoinAddresses';
import MbsxSettings from './screens/MbsxSettings';
import ElectrumServers from './screens/ElectrumServers';
import ElectrumServer from './screens/ElectrumServer';
import CoinRateServices from './screens/CoinRateServices';
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
  const [showDebug, setShowDebug] = useState(false);
  const [activity, setActivity] = useState({swaps: '', requests: ''});

  useEffect(() => {
    let live = true;
    readConfig().then(config => {
      if (live) {
        setShowDebug(config?.show_debug === true);
      }
    });
    return () => {
      live = false;
    };
  }, [drawerStatus]);

  useEffect(() => {
    if (drawerStatus !== 'open') {
      return;
    }
    let live = true;
    const read = () => {
      const next = readMenuMarks();
      if (live) {
        setActivity(next);
      }
    };
    read();
    const timer = setInterval(read, 2000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [drawerStatus]);

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

  const items = state.routes.filter(route => {
    if (
      isHiddenDrawerItem(
        descriptors[route.key].options.drawerItemStyle as object | undefined,
      )
    ) {
      return false;
    }
    return route.name !== 'MbsxDebug' || showDebug;
  });

  return (
    <LinearGradient
      style={styles.menu}
      colors={['#F2F8FD', '#F2F8FD']}>
      <View style={styles.menuHeader}>
        <View style={{height: insets.top}} />
        <View style={styles.menuBar}>
          <HeaderButton
            onPress={() => navigation.getParent()?.goBack()}
            imageSource={require('../../assets/images/back-icon.png')}
            leftPadding
          />
          <Text style={styles.menuTitle}>Swap</Text>
        </View>
      </View>
      <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
        {items.map(route => {
          const focused =
            choiceMade && state.routes[state.index]?.key === route.key;
          const label = descriptors[route.key].options.title ?? route.name;
          const note =
            route.name === 'SwapList'
              ? activity.swaps
              : route.name === 'RequestList'
                ? activity.requests
                : '';
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
              <Text
                style={[
                  styles.cellTitle,
                  styles.cellTitleGrow,
                  focused ? styles.cellTitleActive : null,
                ]}
                numberOfLines={1}>
                {label}
              </Text>
              {note !== '' ? (
                <Text style={styles.cellValue} numberOfLines={1}>
                  {note}
                </Text>
              ) : null}
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
      <View
        style={[styles.mark, {paddingBottom: Math.max(insets.bottom, 16) + 28}]}>
        <BasicSwapMark />
      </View>
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
  // Before the start effect runs, which makes swapInProgress read false
  const [initialRoute] = useState<keyof MbsxDrawerParamList>(() =>
    swapInProgress() ? 'SwapList' : 'CreateSwap',
  );

  useEffect(() => {
    const subscription = onStartup(step => dispatch(setStartupStep(step)));
    return () => subscription.remove();
  }, [dispatch]);

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

    const begin = () => {
      const tor = torRef.current;
      dispatch(setError(null));
      dispatch(setStartupStep(null));
      dispatch(setTorApplied(null));
      start(tor)
        .then(() => {
          dispatch(setTorApplied(tor));
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
    };
    retryStart = begin;
    begin();

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

  useEffect(
    () => startRateFetcher(dispatch, () => torRef.current === true),
    [dispatch],
  );

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
      <Drawer.Navigator
        screenLayout={ScreenLayout}
        initialRouteName={initialRoute}
        defaultStatus="closed"
        backBehavior="history"
        drawerContent={DrawerContent}
        screenOptions={{
          header: MbsxScreenHeader,
          headerLeft: () => <MbsxMenuButton />,
          headerRight: renderTorIndicator,
          headerTitleContainerStyle: {left: 7},
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
            includeFontPadding: false,
            textAlignVertical: 'center',
          },
        }}>
        <Drawer.Screen
          name="CreateSwap"
          component={CreateSwap}
          options={{title: 'New Swap'}}
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
          name="PayInDetail"
          component={PayInDetail}
          options={{title: 'Pay-in', ...hidden}}
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
          name="ElectrumServers"
          component={ElectrumServers}
          options={{title: 'Electrum Servers', ...hidden}}
        />
        <Drawer.Screen
          name="ElectrumServer"
          component={ElectrumServer}
          options={{title: 'Electrum Server', ...hidden}}
        />
        <Drawer.Screen
          name="CoinRateServices"
          component={CoinRateServices}
          options={{title: 'Coin Rate Services', ...hidden}}
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

const renderTorIndicator = () => <TorIndicator />;

const flexOne = {flex: 1, backgroundColor: '#F2F8FD'} as const;
const contentLayout = {flex: 1} as const;

let retryStart = () => {};

const ScreenLayout = ({children}: {children: React.ReactNode}) => (
  <View style={contentLayout}>
    {children}
    <StartingScreen onRetry={() => retryStart()} />
  </View>
);

const MbsxScreenHeader = ({layout, options, route}: DrawerHeaderProps) => {
  const headerOptions = {...options};
  delete headerOptions.header;
  return (
    <View>
      <Header
        {...headerOptions}
        layout={layout}
        title={getHeaderTitle(options, route.name)}
      />
      <BridgeStatus />
      <AnchorDispute />
    </View>
  );
};

const getDrawerStyles = (_screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    menu: {
      flex: 1,
      backgroundColor: '#F7F7F7',
    },
    menuHeader: {
      height: screenHeight * 0.13,
      backgroundColor: '#1162E6',
    },
    menuBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuList: {
      flex: 1,
    },
    mark: {
      alignItems: 'center',
      paddingTop: 16,
    },
    menuTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.026,
      fontWeight: '700',
      marginStart: 11,
      includeFontPadding: false,
      textAlignVertical: 'center',
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
    cellTitleGrow: {
      flex: 1,
      marginRight: 12,
    },
    cellValue: {
      marginRight: 8,
      fontFamily: 'Satoshi Variable',
      color: '#747E87',
      fontSize: 14,
    },
    cellTitleActive: {
      color: '#2C72FF',
    },
  });

export default MbsxNavigator;
