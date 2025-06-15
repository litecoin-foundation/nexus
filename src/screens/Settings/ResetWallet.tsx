import React, {useState, useRef, useContext} from 'react';
import {
  StyleSheet,
  View,
  Alert,
  DeviceEventEmitter,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  StackNavigationOptions,
  StackNavigationProp,
} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import WhiteButton from '../../components/Buttons/WhiteButton';
import HeaderButton from '../../components/Buttons/HeaderButton';
import PlasmaModal from '../../components/Modals/PlasmaModal';
import PinModalContent from '../../components/Modals/PinModalContent';
import {resetPincode} from '../../reducers/authentication';
import {useAppDispatch} from '../../store/hooks';
import {sleep} from '../../lib/utils/poll';
import {purgeStore} from '../../store';
import {deleteLNDDir} from '../../lib/utils/file';

import {ScreenSizeContext} from '../../context/screenSize';
import TranslateText from '../../components/TranslateText';

type RootStackParamList = {
  ResetWallet: undefined;
  Main: {
    isInitial: boolean;
  };
  Loading: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'ResetWallet'>;
  route: RouteProp<RootStackParamList, 'ResetWallet'>;
}

const ResetWallet: React.FC<Props> = props => {
  const {navigation} = props;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const {t} = useTranslation('settingsTab');

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [isPinModalOpened, setIsPinModalOpened] = useState(false);
  const pinModalAction = useRef<string>('reset-wallet-auth');
  function openPinModal(action: string) {
    pinModalAction.current = action;
    setIsPinModalOpened(true);
  }

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

  return (
    <>
      <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
        <View style={styles.body}>
          <TranslateText
            textKey="resetting_wallet"
            domain="settingsTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.035}
            textStyle={styles.title}
            numberOfLines={3}
          />
          <TranslateText
            textKey="resetting_wallet_warning"
            domain="settingsTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.022}
            textStyle={styles.subtitle}
            numberOfLines={4}
          />
          <TranslateText
            textKey="mweb_missing_note"
            domain="settingsTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.022}
            textStyle={styles.subtitle}
            numberOfLines={4}
          />
        </View>

        <View
          style={[
            styles.confirmButtonContainer,
            Platform.OS === 'android' ? {paddingBottom: insets.bottom} : null,
          ]}>
          <WhiteButton
            textKey="Continue Reset"
            textDomain="settingsTab"
            disabled={false}
            small={false}
            active={true}
            onPress={() => {
              handleAuthenticationRequired('reset-wallet-auth').then(() =>
                Alert.alert(t('reset_wallet'), t('reset_warning'), [
                  {
                    text: t('cancel'),
                    onPress: () => setIsPinModalOpened(false),
                  },
                  {text: t('ok'), onPress: () => handleReset()},
                ]),
              );
            }}
          />
        </View>
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
      width: '100%',
      height: '100%',
    },
    body: {
      width: '100%',
      height: '100%',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: screenHeight * 0.03,
    },
    title: {
      width: '100%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.03,
      textAlign: 'center',
    },
    subtitle: {
      width: '100%',
      maxWidth: '100%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.02,
      textAlign: 'center',
      opacity: 0.9,
      marginTop: screenHeight * 0.04,
    },
    confirmButtonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.03,
      width: '100%',
      paddingHorizontal: screenWidth * 0.06,
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.026,
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export const ResetWalletNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  return {
    headerTitle: '',
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

export default ResetWallet;
