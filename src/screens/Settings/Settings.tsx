import React, {useState, useRef, useContext} from 'react';
import {
  StyleSheet,
  ScrollView,
  DeviceEventEmitter,
  Alert,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import {StackNavigationProp} from '@react-navigation/stack';

import PlasmaModal from '../../components/Modals/PlasmaModal';
import Header from '../../components/Header';
import SettingCell from '../../components/Cells/SettingCell';
import {resetPincode, setBiometricEnabled} from '../../reducers/authentication';
import PinModalContent from '../../components/Modals/PinModalContent';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {sleep} from '../../lib/utils/poll';
import {purgeStore} from '../../store';
import {deleteLNDDir} from '../../lib/utils/file';
import {updateSubunit} from '../../reducers/settings';
import HeaderButton from '../../components/Buttons/HeaderButton';
import SupportCell from '../../components/Cells/SupportCell';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {useTranslation} from 'react-i18next';

type RootStackParamList = {
  General: undefined;
  About: undefined;
  ChangePincode: {
    type: null;
  };
  Wallet: undefined;
  Explorer: undefined;
  Currency: undefined;
  Language: undefined;
  Seed: undefined;
  Import: undefined;
  RecoverLitewallet: undefined;
  Loading: undefined;
  Support: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'General'>;
}

const Settings: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [isPinModalOpened, setIsPinModalOpened] = useState(false);
  const pinModalAction = useRef<string>('view-seed-auth');
  function openPinModal(action: string) {
    pinModalAction.current = action;
    setIsPinModalOpened(true);
  }

  const biometricsAvailable = useAppSelector(
    state => state.authentication.biometricsAvailable,
  );
  const biometricsEnabled = useAppSelector(
    state => state.authentication.biometricsEnabled,
  );
  const faceIDSupported = useAppSelector(
    state => state.authentication.faceIDSupported,
  );
  const {subunit} = useAppSelector(state => state.settings);

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

  const handleReset = async () => {
    dispatch(resetPincode());
    await purgeStore();
    await deleteLNDDir();
    await sleep(4000);
    navigation.reset({
      index: 0,
      routes: [{name: 'Loading'}],
    });
  };

  const {t} = useTranslation('settingsTab');

  return (
    <>
      <LinearGradient
        style={styles.container}
        colors={['#F2F8FD', '#d2e1ef00']}>
        <Header />
        <ScrollView>
          <SupportCell onPress={() => navigation.navigate('Support')} />

          <SettingCell
            textKey="about"
            textDomain="settingsTab"
            onPress={() => navigation.navigate('About')}
            forward
          />
          <SettingCell
            textKey="change_wallet_pin"
            textDomain="settingsTab"
            onPress={() => navigation.navigate('ChangePincode', {type: null})}
            forward
          />
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
            onPress={() => {
              handleAuthenticationRequired('reset-wallet-auth').then(() =>
                Alert.alert(t('reset_wallet'), t('reset_warning'), [
                  {
                    text: t('cancel'),
                    onPress: () => setIsPinModalOpened(false),
                    style: 'cancel',
                  },
                  {text: t('ok'), onPress: () => handleReset()},
                ]),
              );
            }}
          />
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

export const SettingsNavigationOptions = (navigation: any) => {
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
