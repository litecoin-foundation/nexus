import React, {useEffect, useContext} from 'react';
import {StyleSheet, View, SafeAreaView, Alert, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
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
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Import'>;
  route: RouteProp<RootStackParamList, 'Import'>;
}

const Import: React.FC<Props> = props => {
  const {navigation, route} = props;
  const insets = useSafeAreaInsets();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();
  const {t} = useTranslation('settingsTab');
  const {address} = useAppSelector(state => state.address);

  useEffect(() => {
    dispatch(getAddress());
  }, [dispatch]);

  // handle scanned QR code
  useEffect(() => {
    const handleScan = async (scanPayload: string) => {
      try {
        const rawTxs = await sweepQrKey(scanPayload, address);
        rawTxs.map(rawTx => {
          rawTx.map(async (txHex: string) => {
            await publishTransaction(txHex);
          });
        });

        navigation.replace('ImportSuccess', {
          txHash: t('success'),
        });
      } catch (error) {
        Alert.alert(String(error));
      }
    };

    if (route.params?.scanData) {
      handleScan(route.params?.scanData);
    }
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [address, route.params?.scanData]);

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.container}>
      <SafeAreaView />

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

      <View
        style={[
          styles.buttonContainer,
          Platform.OS === 'android' ? {paddingBottom: insets.bottom} : null,
        ]}>
        <WhiteButton
          textKey="scan_private_key"
          textDomain="settingsTab"
          customFontStyles={{textAlign: 'center'}}
          small={false}
          active={true}
          onPress={() => {
            navigation.navigate('Scan', {returnRoute: 'Import'});
          }}
        />
      </View>
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'column',
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
      bottom: screenHeight * 0.03,
      width: '100%',
      paddingHorizontal: screenWidth * 0.06,
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

export default Import;
