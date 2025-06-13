import React, {useEffect, useContext, useLayoutEffect} from 'react';
import {StyleSheet, View, Alert} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {
  StackNavigationOptions,
  StackNavigationProp,
} from '@react-navigation/stack';
import {RouteProp, CommonActions} from '@react-navigation/native';

import WhiteButton from '../../components/Buttons/WhiteButton';
import {unsetDeeplink} from '../../reducers/deeplinks';
import {publishTransaction} from '../../reducers/transaction';
import {getAddress} from '../../reducers/address';
import {sweepQrKey} from '../../lib/utils/sweep';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  ImportDeeplink: {
    scanData?: string;
  };
  ImportSuccess: {
    txHash: string;
  };
  Main: {
    isInitial: boolean;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'ImportDeeplink'>;
  route: RouteProp<RootStackParamList, 'ImportDeeplink'>;
}

const ImportDeeplink: React.FC<Props> = props => {
  const {navigation, route} = props;

  const {t} = useTranslation('settingsTab');

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();

  const {regularAddress} = useAppSelector(state => state.address);

  useLayoutEffect(() => {
    dispatch(getAddress());
  }, [dispatch]);

  useEffect(() => {
    if (regularAddress) {
      const handleDeeplinkPayload = async (deeplinkPayload: string) => {
        try {
          // NOTE: Never show this error, generate address instead
          if (!regularAddress) {
            throw new Error('Receiving address not found. Try again.');
          }

          const rawTxs = await sweepQrKey(deeplinkPayload, regularAddress);

          await Promise.all(
            rawTxs.map(async rawTx => {
              await Promise.all(
                rawTx.map(async (txHex: string) => {
                  const res = await publishTransaction(txHex);
                }),
              );
            }),
          );

          navigation.navigate('ImportSuccess', {
            txHash: t('success'),
          });
        } catch (error) {
          if (error instanceof Error) {
            Alert.alert(error.message);
          } else {
            Alert.alert(String(error));
          }

          const resetAction = CommonActions.reset({
            index: 0,
            routes: [
              {name: 'Main', params: {isInitial: true, updateHeader: true}},
            ],
          });
          navigation.dispatch(resetAction);
        }
      };

      if (route.params?.scanData) {
        handleDeeplinkPayload(route.params?.scanData);
        dispatch(unsetDeeplink());
      }
    }
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [regularAddress, route.params?.scanData]);

  return (
    <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
      <View style={styles.body}>
        <TranslateText
          textKey="processing"
          domain="settingsTab"
          maxSizeInPixels={SCREEN_HEIGHT * 0.07}
          textStyle={styles.title}
          numberOfLines={1}
        />
      </View>

      <View style={styles.backButtonContainer}>
        <CustomSafeAreaView styles={styles.safeArea} edges={['bottom']}>
          <WhiteButton
            textKey="back_to_wallet"
            textDomain="settingsTab"
            disabled={false}
            small={false}
            active={true}
            onPress={() => {
              navigation.navigate('Main', {isInitial: true});
            }}
          />
        </CustomSafeAreaView>
      </View>
    </LinearGradient>
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
      fontSize: screenHeight * 0.05,
      textAlign: 'center',
      marginTop: screenHeight * 0.05 * -1,
    },
    subtitle: {
      width: '100%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.02,
      textTransform: 'uppercase',
      textAlign: 'center',
      opacity: 0.9,
      marginTop: screenHeight * 0.005,
    },
    backButtonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.01,
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
    safeArea: {},
  });

export const ImportDeeplinkNavigationOptions = (): StackNavigationOptions => {
  return {
    headerTitle: () => null,
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => null,
    gestureEnabled: false,
  };
};

export default ImportDeeplink;
