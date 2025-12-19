import React, {
  useState,
  useRef,
  useContext,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  StyleSheet,
  DeviceEventEmitter,
  Alert,
  View,
  Platform,
  PermissionsAndroid,
  Linking,
  AppState,
} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {RouteProp} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import {
  StackNavigationOptions,
  StackNavigationProp,
} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import notifee, {AuthorizationStatus} from '@notifee/react-native';

import PlasmaModal from '../../components/Modals/PlasmaModal';
import Header from '../../components/Header';
import SettingCell from '../../components/Cells/SettingCell';
import PinModalContent from '../../components/Modals/PinModalContent';
import HeaderButton from '../../components/Buttons/HeaderButton';
import SupportCell from '../../components/Cells/SupportCell';
import SectionHeader from '../../components/SectionHeader';
import {setBiometricEnabled} from '../../reducers/authentication';
import {canUseTorOnThisDevice} from '../../utils/tor';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  updateSubunit,
  setNotificationsEnabled,
  setManualCoinSelectionEnabled,
} from '../../reducers/settings';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  Settings: {
    updateHeader?: boolean;
  };
  About: undefined;
  ChangePincode: {
    type: null;
  };
  Wallet: undefined;
  Explorer: undefined;
  Currency: undefined;
  Language: undefined;
  Products: undefined;
  Seed: undefined;
  RootKey: undefined;
  Import: undefined;
  RecoverLitewallet: undefined;
  Loading: undefined;
  Support: undefined;
  ResetWallet: undefined;
  RescanWallet: undefined;
  TestPayment: undefined;
  Tor: undefined;
  ExportElectrum: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Settings'>;
  route: RouteProp<RootStackParamList, 'Settings'>;
}

const Settings: React.FC<Props> = props => {
  const {navigation, route} = props;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const {t} = useTranslation('settingsTab');

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  const [torDeviceCompatible, setTorDeviceCompatible] = useState(false);
  const [isPinModalOpened, setIsPinModalOpened] = useState(false);
  const pinModalAction = useRef<string>('view-seed-auth');
  function openPinModal(action: string) {
    pinModalAction.current = action;
    setIsPinModalOpened(true);
  }

  const {biometricsAvailable, biometricsEnabled, faceIDSupported} =
    useAppSelector(state => state.authentication!);
  const {subunit, notificationsEnabled, manualCoinSelectionEnabled} =
    useAppSelector(state => state.settings!);

  const openSystemSettings = async () => {
    Linking.openSettings();
  };

  const handleNotificationSwitch = async () => {
    let enabled = true;
    if (Platform.OS === 'ios') {
      const settings = await notifee.requestPermission();
      enabled = settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
    } else {
      enabled = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    }
    dispatch(setNotificationsEnabled(enabled));
  };

  useEffect(() => {
    handleNotificationSwitch();
    const subscription = AppState.addEventListener('change', () =>
      setTimeout(() => {
        handleNotificationSwitch();
      }, 200),
    );
    return () => subscription.remove();
    /* eslint-disable react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    canUseTorOnThisDevice().then(setTorDeviceCompatible);
  }, []);

  const handleBiometricSwitch = () => {
    dispatch(setBiometricEnabled(!biometricsEnabled));
  };

  const handleManualCoinSelectionSwitch = () => {
    dispatch(setManualCoinSelectionEnabled(!manualCoinSelectionEnabled));
  };

  const handleAuthenticationRequired = (action: string) => {
    return new Promise<void>((resolve, reject) => {
      openPinModal(action);
      const subscription = DeviceEventEmitter.addListener(action, bool => {
        if (bool === true) {
          setIsPinModalOpened(false);
          subscription.remove();
          resolve();
        } else if (bool === false) {
          subscription.remove();
          reject();
        }
      });
    });
  };

  // fixes a bug where going back from webpage causes header to disappear
  useEffect(() => {
    if (route.params?.updateHeader) {
      navigation.setOptions({
        headerShown: false,
      });

      setTimeout(() => {
        navigation.setOptions({
          headerShown: true,
        });
      }, 10);
    }
  }, [route, navigation]);

  const settingsData = useMemo(
    () => [
      {id: 'support', type: 'support'},
      {id: 'general-header', type: 'header', textKey: 'general_settings'},
      {
        id: 'about',
        type: 'cell',
        textKey: 'about',
        forward: true,
        onPress: () => navigation.navigate('About'),
      },
      {id: 'notifications', type: 'notifications', notificationsEnabled},
      ...(biometricsAvailable ? [{id: 'biometrics', type: 'biometrics'}] : []),
      ...(torDeviceCompatible
        ? [
            {
              id: 'tor',
              type: 'cell',
              textKey: 'enable_tor',
              forward: true,
              onPress: () => navigation.navigate('Tor'),
            },
          ]
        : []),
      {
        id: 'explorer',
        type: 'cell',
        textKey: 'block_explorer',
        forward: true,
        onPress: () => navigation.navigate('Explorer'),
      },
      {
        id: 'currency',
        type: 'cell',
        textKey: 'change_currency',
        forward: true,
        onPress: () => navigation.navigate('Currency'),
      },
      {
        id: 'language',
        type: 'cell',
        textKey: 'change_lang',
        forward: true,
        onPress: () => navigation.navigate('Language'),
      },
      {
        id: 'wallet-header',
        type: 'header',
        textKey: 'wallet_settings',
        marginTop: true,
      },
      {
        id: 'change-pin',
        type: 'cell',
        textKey: 'change_wallet_pin',
        forward: true,
        onPress: () => navigation.navigate('ChangePincode', {type: null}),
      },
      {
        id: 'import-key',
        type: 'cell',
        textKey: 'import_private_key',
        forward: true,
        onPress: () => navigation.navigate('Import'),
      },
      {
        id: 'import-litewallet',
        type: 'cell',
        textKey: 'import_litewallet',
        forward: true,
        onPress: () => navigation.navigate('RecoverLitewallet'),
      },
      {
        id: 'view-seed',
        type: 'cell',
        textKey: 'view_seed',
        forward: true,
        onPress: () => {
          handleAuthenticationRequired('view-seed-auth')
            .then(() => navigation.navigate('Seed'))
            .catch(() =>
              Alert.alert('Incorrect Pincode', undefined, [
                {
                  text: t('dismiss'),
                  onPress: () => setIsPinModalOpened(false),
                  style: 'cancel',
                },
              ]),
            );
        },
      },
      {
        id: 'view-root-key',
        type: 'cell',
        textKey: 'view_root_key',
        forward: true,
        onPress: () => {
          handleAuthenticationRequired('view-root-key-auth')
            .then(() => navigation.navigate('RootKey'))
            .catch(() =>
              Alert.alert('Incorrect Pincode', undefined, [
                {
                  text: t('dismiss'),
                  onPress: () => setIsPinModalOpened(false),
                  style: 'cancel',
                },
              ]),
            );
        },
      },
      {
        id: 'export_electrum',
        type: 'cell',
        textKey: 'export_electrum',
        forward: true,
        onPress: () => {
          handleAuthenticationRequired('export_electrum-auth')
            .then(() => navigation.navigate('ExportElectrum'))
            .catch(() =>
              Alert.alert('Incorrect Pincode', undefined, [
                {
                  text: t('dismiss'),
                  onPress: () => setIsPinModalOpened(false),
                  style: 'cancel',
                },
              ]),
            );
        },
      },
      {id: 'manual_coin_selection', type: 'manual_coin_selection'},
      {id: 'denomination', type: 'denomination'},
      {
        id: 'rescan-wallet',
        type: 'cell',
        textKey: 'rescan_wallet',
        forward: true,
        onPress: () => navigation.navigate('RescanWallet'),
      },
      {
        id: 'reset-wallet',
        type: 'cell',
        textKey: 'reset_wallet',
        forward: true,
        onPress: () => navigation.navigate('ResetWallet'),
      },
      ...(__DEV__
        ? [
            {
              id: 'debug',
              type: 'cell',
              textKey: 'DEBUG: Buy/Sell Settings',
              forward: true,
              onPress: () => navigation.navigate('TestPayment'),
            },
          ]
        : []),
    ],
    [
      biometricsAvailable,
      torDeviceCompatible,
      notificationsEnabled,
      manualCoinSelectionEnabled,
      biometricsEnabled,
      faceIDSupported,
      subunit,
      t,
      navigation,
    ],
  );

  //           <SettingCell
  //             textKey="Products"
  //             textDomain="settingsTab"
  //             onPress={() => navigation.navigate('Products')}
  //             forward
  //           />

  const renderItem = useCallback(
    ({item}: {item: any}) => {
      switch (item.type) {
        case 'support':
          return <SupportCell onPress={() => navigation.navigate('Support')} />;
        case 'header':
          return (
            <SectionHeader
              textKey={item.textKey}
              marginTopMultiplier={item.marginTop ? 0.037 : undefined}
            />
          );
        case 'cell':
          return (
            <SettingCell
              textKey={item.textKey}
              textDomain="settingsTab"
              onPress={item.onPress}
              forward={item.forward}
            />
          );
        case 'notifications':
          return (
            <SettingCell
              textKey="enable_notifications"
              textDomain="settingsTab"
              switchEnabled
              fakeSwitch
              switchValue={item.notificationsEnabled}
              onPress={() => openSystemSettings()}
            />
          );
        case 'biometrics':
          return (
            <SettingCell
              textKey="enable_face_id"
              textDomain="settingsTab"
              switchEnabled
              switchValue={biometricsEnabled}
              handleSwitch={handleBiometricSwitch}
              interpolationObj={{
                faceIDSupported: `${faceIDSupported ? t('face_id') : t('touch_id')}`,
              }}
            />
          );
        case 'manual_coin_selection':
          return (
            <SettingCell
              textKey="manual_coin_selection"
              textDomain="settingsTab"
              switchEnabled
              switchValue={manualCoinSelectionEnabled}
              handleSwitch={handleManualCoinSelectionSwitch}
            />
          );
        case 'denomination':
          return (
            <View style={styles.switchContainer}>
              <TranslateText
                textKey="litecoin_denomination"
                domain="settingsTab"
                textStyle={styles.switchTitleText}
                maxSizeInPixels={SCREEN_HEIGHT * 0.017}
              />
              <SegmentedControl
                values={['LTC', 'Lites', 'Photons']}
                selectedIndex={subunit}
                tintColor="#2C72FF"
                fontStyle={styles.toggleText}
                activeFontStyle={styles.activeToggleText}
                backgroundColor="#fff"
                onChange={event =>
                  dispatch(
                    updateSubunit(event.nativeEvent.selectedSegmentIndex),
                  )
                }
              />
            </View>
          );
        default:
          return null;
      }
    },
    [
      biometricsEnabled,
      faceIDSupported,
      subunit,
      t,
      SCREEN_HEIGHT,
      styles,
      handleBiometricSwitch,
      dispatch,
      navigation,
      notificationsEnabled,
      manualCoinSelectionEnabled,
    ],
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  const getItemLayout = useCallback(
    (_item: any, index: number) => ({
      length: 60,
      offset: 60 * index,
      index,
    }),
    [],
  );

  return (
    <>
      <LinearGradient
        style={[
          styles.container,
          Platform.OS === 'android' ? {paddingBottom: insets.bottom} : null,
        ]}
        colors={['#F2F8FD', '#d2e1ef00']}>
        <Header />
        <FlashList
          data={settingsData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={60}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          drawDistance={200}
          overrideItemLayout={getItemLayout}
          key={`flashlist-${notificationsEnabled}`}
        />
      </LinearGradient>

      <PlasmaModal
        isOpened={isPinModalOpened}
        close={() => setIsPinModalOpened(false)}
        isFromBottomToTop={true}
        animDuration={250}
        gapInPixels={0}
        backSpecifiedStyle={{backgroundColor: 'rgba(19,58,138, 0.6)'}}
        renderBody={(_, __, ___, ____, cardTranslateAnim: any) => (
          <PinModalContent
            cardTranslateAnim={cardTranslateAnim}
            close={() => setIsPinModalOpened(false)}
            handleValidationFailure={() =>
              DeviceEventEmitter.emit(pinModalAction.current, false)
            }
            handleValidationSuccess={() =>
              DeviceEventEmitter.emit(pinModalAction.current, true)
            }
          />
        )}
      />
    </>
  );
};

const getStyles = (_screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F7F7F7',
    },
    scrollContent: {
      paddingBottom: screenHeight * 0.04,
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.026,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    switchContainer: {
      flex: 1,
      gap: 8,
      paddingLeft: 25,
      paddingTop: 10,
      paddingRight: 25,
      paddingBottom: 14,
      borderTopWidth: 0.5,
      borderBottomWidth: 0.5,
      borderColor: '#9797974d',
      backgroundColor: 'white',
    },
    switchTitleText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#484859',
      fontSize: 14,
    },
    toggleText: {
      color: '#484859',
      fontSize: screenHeight * 0.017,
      fontWeight: 'bold',
    },
    activeToggleText: {
      color: '#fff',
      fontSize: screenHeight * 0.017,
      fontWeight: 'bold',
    },
  });

export const SettingsNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <TranslateText
        textKey={'settings'}
        domain={'settingsTab'}
        maxSizeInPixels={SCREEN_HEIGHT * 0.022}
        textStyle={styles.headerTitle}
        numberOfLines={1}
      />
    ),
    headerTitleAlign: 'left',
    headerTitleContainerStyle: {
      left: 7,
    },
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default Settings;
