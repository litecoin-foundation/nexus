import React, {useState, useRef, useContext, useEffect} from 'react';
import {
  StyleSheet,
  View,
  DeviceEventEmitter,
  Platform,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  StackNavigationOptions,
  StackNavigationProp,
} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import WhiteButton from '../../components/Buttons/WhiteButton';
import HeaderButton from '../../components/Buttons/HeaderButton';
import PlasmaModal from '../../components/Modals/PlasmaModal';
import PinModalContent from '../../components/Modals/PinModalContent';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {rescanWallet, setRescanningWallet} from '../../reducers/lightning';

import {ScreenSizeContext} from '../../context/screenSize';
import TranslateText from '../../components/TranslateText';

type RootStackParamList = {
  RescanWallet: undefined;
  Settings: {
    updateHeader?: boolean;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'RescanWallet'>;
  route: RouteProp<RootStackParamList, 'RescanWallet'>;
}

const RescanWallet: React.FC<Props> = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [isPinModalOpened, setIsPinModalOpened] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const pinModalAction = useRef<string>('rescan-wallet-auth');

  const {isRescanningWallet} = useAppSelector(state => state.lightning!);

  useEffect(() => {
    setIsRescanning(isRescanningWallet);
  }, [isRescanningWallet]);

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

  const handleRescan = async () => {
    try {
      setIsRescanning(true);
      await dispatch(rescanWallet());
    } catch (error) {
      console.error('Error during wallet rescan:', error);
      setIsRescanning(false);
      dispatch(setRescanningWallet(false));
    }
  };

  return (
    <>
      <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
        <View style={styles.body}>
          <TranslateText
            textKey="rescanning_wallet"
            domain="settingsTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.035}
            textStyle={styles.title}
            numberOfLines={3}
          />
          <TranslateText
            textKey={
              isRescanning
                ? 'rescanning_in_progress'
                : 'rescanning_wallet_warning'
            }
            domain="settingsTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.022}
            textStyle={styles.subtitle}
            numberOfLines={6}
          />
          {isRescanning && (
            <>
              <ActivityIndicator
                size="large"
                color="#fff"
                style={styles.activityIndicator}
              />
              <TranslateText
                textKey="do_not_exit_app"
                domain="settingsTab"
                maxSizeInPixels={SCREEN_HEIGHT * 0.019}
                textStyle={styles.warningText}
                numberOfLines={2}
              />
            </>
          )}
        </View>

        <View
          style={[
            styles.confirmButtonContainer,
            Platform.OS === 'android' ? {paddingBottom: insets.bottom} : null,
          ]}>
          <WhiteButton
            textKey={isRescanning ? 'rescanning' : 'continue_rescan'}
            textDomain="settingsTab"
            disabled={isRescanning}
            small={false}
            active={!isRescanning}
            onPress={() => {
              handleAuthenticationRequired('rescan-wallet-auth')
                .then(() => handleRescan())
                .catch(() => {
                  setIsPinModalOpened(false);
                });
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
    warningText: {
      width: '100%',
      maxWidth: '100%',
      color: '#FFD700',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.019,
      textAlign: 'center',
      marginTop: screenHeight * 0.03,
    },
    activityIndicator: {
      marginTop: screenHeight * 0.05,
    },
    confirmButtonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.03,
      width: '100%',
      paddingHorizontal: screenWidth * 0.06,
    },
  });

export const RescanWalletNavigationOptions = (
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

export default RescanWallet;
