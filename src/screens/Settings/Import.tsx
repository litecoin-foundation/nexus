import React, {useEffect, useContext, useLayoutEffect} from 'react';
import {StyleSheet, View, Alert} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {
  StackNavigationOptions,
  StackNavigationProp,
} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';

import Card from '../../components/Card';
import WhiteButton from '../../components/Buttons/WhiteButton';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {publishTransaction} from '../../reducers/transaction';
import {sweepQrKey} from '../../lib/utils/sweep';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import {unsetDeeplink} from '../../reducers/deeplinks';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  Import: {
    scanData?: string;
  };
  Scan: {returnRoute: string};
  ImportSuccess: {
    txHash: string;
  };
  Settings: {
    updateHeader?: boolean;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Import'>;
  route: RouteProp<RootStackParamList, 'Import'>;
}

const Import: React.FC<Props> = props => {
  const {navigation, route} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();
  const {t} = useTranslation('settingsTab');
  const {regularAddress} = useAppSelector(state => state.address);
  const torEnabled = useAppSelector(state => state.settings.torEnabled);

  useLayoutEffect(() => {
    dispatch(getAddress());
  }, [dispatch]);

  // handle scanned QR code
  useEffect(() => {
    if (regularAddress) {
      const handleScan = async (scanPayload: string) => {
        try {
          // NOTE: Never show this error, generate address instead
          if (!regularAddress) {
            throw new Error('Receiving address not found. Try again.');
          }

          const rawTxs = await sweepQrKey(
            scanPayload,
            regularAddress,
            torEnabled,
          );

          await Promise.all(
            rawTxs.map(async rawTx => {
              await Promise.all(
                rawTx.map(async (txHex: string) => {
                  const res = await publishTransaction(txHex, torEnabled);
                  if (__DEV__) {
                    console.log(res);
                  }
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
        }
      };

      if (route.params?.scanData) {
        handleScan(route.params?.scanData);
        dispatch(unsetDeeplink());
      }
    }
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [regularAddress, route.params?.scanData, torEnabled]);

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.container}>
      <View style={styles.cardContainer}>
        <Card
          titleText={t('import_private_key')}
          descriptionText={
            t('import_private_key_note') +
            '\n\n' +
            t('import_private_key_warning')
          }
          imageSource={require('../../assets/images/qr-frame.png')}
        />
      </View>

      <View style={styles.buttonContainer}>
        <CustomSafeAreaView styles={styles.safeArea} edges={['bottom']}>
          <WhiteButton
            textKey="scan_private_key"
            textDomain="settingsTab"
            customFontStyles={styles.buttonCustomStyle}
            small={false}
            active={true}
            onPress={() => {
              navigation.navigate('Scan', {returnRoute: 'Import'});
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
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.026,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    cardContainer: {
      flex: 1,
      justifyContent: 'center',
      marginTop: screenHeight * 0.05 * -1,
    },
    buttonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.01,
      width: '100%',
      paddingHorizontal: screenWidth * 0.06,
    },
    buttonCustomStyle: {
      textAlign: 'center',
    },
    safeArea: {
      width: '100%',
    },
  });

export const ImportNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <TranslateText
        textKey="import_private_key"
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
        onPress={() => navigation.popTo('Settings', {updateHeader: true})}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default Import;
