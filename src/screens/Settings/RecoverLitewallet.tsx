import React, {useLayoutEffect, useState, useContext} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  StackNavigationOptions,
  StackScreenProps,
} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import HeaderButton from '../../components/Buttons/HeaderButton';
import RecoveryField from '../../components/RecoveryField';
import LoadingIndicator from '../../components/LoadingIndicator';
import {SettingsStackParamList} from '../../navigation/types';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {sweepLitewallet} from '../../lib/utils/sweep';
import {getAddress} from '../../reducers/address';
import {publishTransaction} from '../../reducers/transaction';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

const RecoverLitewallet = ({
  navigation,
}: StackScreenProps<SettingsStackParamList, 'RecoverLitewallet'>) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const {regularAddress} = useAppSelector(state => state.address);
  const torEnabled = useAppSelector(state => state.settings.torEnabled);

  const [loading, setLoading] = useState(false);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  useLayoutEffect(() => {
    dispatch(getAddress());
  }, [dispatch]);

  const {t} = useTranslation('settingsTab');

  const handleLWRecovery = async (seed: string[]) => {
    setLoading(true);

    try {
      if (!regularAddress) {
        throw new Error('Receiving address not found. Try again.');
      }

      const rawTxs = await sweepLitewallet(seed, regularAddress, torEnabled);

      await Promise.all(
        rawTxs.map(async rawTx => {
          await Promise.all(
            rawTx.map(async (txHex: string) => {
              const res = await publishTransaction(txHex);
              if (__DEV__) {
                console.log(res);
              }
            }),
          );
        }),
      );

      setLoading(false);
      navigation.replace('ImportSuccess', {
        txHash: t('litewallet_success'),
      });
    } catch (error: any) {
      setLoading(false);
      if (error instanceof Error) {
        Alert.alert(error.message);
      } else {
        Alert.alert(String(error));
      }
    }
  };

  return (
    <>
      <LinearGradient
        colors={['#1162E6', '#0F55C7']}
        style={[
          styles.container,
          Platform.OS === 'android' && {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 40}>
          <SafeAreaView style={styles.flex}>
            <RecoveryField
              handleLogin={() => {}}
              headerText={t('litewallet_description')}
              isLitewalletRecovery={true}
              handleLWRecovery={seed => handleLWRecovery(seed)}
            />
          </SafeAreaView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <LoadingIndicator visible={loading} />
    </>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    activity: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.026,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    flex: {
      flex: 1,
    },
  });

export const RecoverLitewalletNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <TranslateText
        textKey="import_litewallet"
        domain="settingsTab"
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

export default RecoverLitewallet;
