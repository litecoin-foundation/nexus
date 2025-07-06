import React, {
  useState,
  useRef,
  useContext,
  useLayoutEffect,
  useCallback,
  useEffect,
} from 'react';
import {
  StyleSheet,
  ScrollView,
  DeviceEventEmitter,
  Alert,
  View,
  Platform,
  PermissionsAndroid,
  Linking,
  AppState,
} from 'react-native';
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
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {updateSubunit, setNotificationsEnabled} from '../../reducers/settings';

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
  Seed: undefined;
  RootKey: undefined;
  Import: undefined;
  RecoverLitewallet: undefined;
  Loading: undefined;
  Support: undefined;
  ResetWallet: undefined;
  TestPayment: undefined;
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
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [isPinModalOpened, setIsPinModalOpened] = useState(false);
  const pinModalAction = useRef<string>('view-seed-auth');
  function openPinModal(action: string) {
    pinModalAction.current = action;
    setIsPinModalOpened(true);
  }

  const {biometricsAvailable, biometricsEnabled, faceIDSupported} =
    useAppSelector(state => state.authentication!);
  const {subunit, notificationsEnabled} = useAppSelector(
    state => state.settings!,
  );

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

  useLayoutEffect(() => {
    handleNotificationSwitch();
    const subscription = AppState.addEventListener(
      'change',
      handleNotificationSwitch,
    );
    return () => subscription.remove();
    /* eslint-disable react-hooks/exhaustive-deps */
  }, []);

  const handleBiometricSwitch = () => {
    dispatch(setBiometricEnabled(!biometricsEnabled));
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

  // NOTE: useMemo won't work here because we need to recalc the function after changing AppState,
  // this is bacause closing/opening the app do not trigger opened component to rerender
  const NotificationsSettingCell = useCallback(
    () => (
      <SettingCell
        textKey="enable_notifications"
        textDomain="settingsTab"
        switchEnabled
        fakeSwitch
        switchValue={notificationsEnabled}
        onPress={() => openSystemSettings()}
      />
    ),
    [notificationsEnabled],
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <SupportCell onPress={() => navigation.navigate('Support')} />

          <SectionHeader textKey="general_settings" />
          <SettingCell
            textKey="about"
            textDomain="settingsTab"
            onPress={() => navigation.navigate('About')}
            forward
          />
          <NotificationsSettingCell />
          {biometricsAvailable ? (
            <SettingCell
              textKey="enable_face_id"
              textDomain="settingsTab"
              switchEnabled
              switchValue={biometricsEnabled}
              handleSwitch={handleBiometricSwitch}
              interpolationObj={{
                faceIDSupported: `${
                  faceIDSupported ? t('face_id') : t('touch_id')
                }`,
              }}
            />
          ) : null}
          <SettingCell
            textKey="block_explorer"
            textDomain="settingsTab"
            onPress={() => navigation.navigate('Explorer')}
            forward
          />
          <SettingCell
            textKey="change_currency"
            textDomain="settingsTab"
            onPress={() => navigation.navigate('Currency')}
            forward
          />
          <SettingCell
            textKey="change_lang"
            textDomain="settingsTab"
            onPress={() => navigation.navigate('Language')}
            forward
          />

          <SectionHeader
            textKey="wallet_settings"
            marginTopMultiplier={0.037}
          />
          <SettingCell
            textKey="change_wallet_pin"
            textDomain="settingsTab"
            onPress={() => navigation.navigate('ChangePincode', {type: null})}
            forward
          />
          <SettingCell
            textKey="import_private_key"
            textDomain="settingsTab"
            onPress={() => navigation.navigate('Import')}
            forward
          />
          <SettingCell
            textKey="import_litewallet"
            textDomain="settingsTab"
            onPress={() => navigation.navigate('RecoverLitewallet')}
            forward
          />
          <SettingCell
            textKey="view_seed"
            textDomain="settingsTab"
            onPress={() => {
              handleAuthenticationRequired('view-seed-auth')
                .then(() => props.navigation.navigate('Seed'))
                .catch(() =>
                  Alert.alert('Incorrect Pincode', undefined, [
                    {
                      text: t('dismiss'),
                      onPress: () => setIsPinModalOpened(false),
                      style: 'cancel',
                    },
                  ]),
                );
            }}
            forward
          />
          <SettingCell
            textKey="view_root_key"
            textDomain="settingsTab"
            onPress={() => {
              handleAuthenticationRequired('view-root-key-auth')
                .then(() => props.navigation.navigate('RootKey'))
                .catch(() =>
                  Alert.alert('Incorrect Pincode', undefined, [
                    {
                      text: t('dismiss'),
                      onPress: () => setIsPinModalOpened(false),
                      style: 'cancel',
                    },
                  ]),
                );
            }}
            forward
          />

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
                dispatch(updateSubunit(event.nativeEvent.selectedSegmentIndex))
              }
            />
          </View>

          <SettingCell
            textKey="reset_wallet"
            textDomain="settingsTab"
            onPress={() => navigation.navigate('ResetWallet')}
            forward
          />
          {__DEV__ ? (
            <SettingCell
              textKey="DEBUG: Buy/Sell Settings"
              textDomain="settingsTab"
              onPress={() => navigation.navigate('TestPayment')}
              forward
            />
          ) : null}
        </ScrollView>
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

const getStyles = (screenWidth: number, screenHeight: number) =>
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
